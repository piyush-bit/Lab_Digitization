import { Request, Response } from "express";
import prisma from "../database/prisma";
import { format } from 'date-fns';
import path from "path";
import fs from "fs";
import { client } from "../database/redis";

export async function createStudent(req: Request, res: Response) {
    try {
        const { name, email, departmentId, enrollmentNumber } = req.body;

        const student = await prisma.student.create({
            data: {
                name,
                email,
                departmentId,
                enrollmentNumber
            }
        });
        res.status(201).send(student);
    }
    catch (err) {
        console.log(err);
        res.status(500).send(err);

    }
}

export async function getQuestions(req: Request, res: Response) {
    try {
        const { studentId } = req.query;
        if (!studentId) {
            return res.status(400).send("studentId is required");
        }
        
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setUTCHours(23, 59, 59, 999);

        console.log(startOfDay, endOfDay);
        


        // Find today's lab session that the student is enrolled in
        const labSession = await prisma.labSession.findFirst({
            where: {
                sessionDate: {
                    gte: startOfDay,
                    lte: endOfDay,
                } ,
                program: {
                    students: {
                        some: {
                            id: Number(studentId),
                        },
                    },
                },
            },
            include: {
                questions: true,
            },
        });

        if (!labSession) {
            return res.status(404).send("No lab session found for today or student not enrolled.");
        }

        // Get the questions for today's lab session
        const questions = labSession.questions;

        res.status(200).json(questions);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
}

export async function getLabSessions(req: Request, res: Response) {
    try {
        const { studentId } = req.query;
        if (!studentId) {
            return res.status(400).send("studentId is required");
        }

        const today = format(new Date(), 'yyyy-MM-dd');
        const labSessions = await prisma.labSession.findMany({
            where: {
                sessionDate: today,
                program: {
                    students: {
                        some: {
                            id: Number(studentId),
                        },
                    },
                },
            },
            include: {
                program: true,
                instructor: true,
                questions: true,
            },
        });
        res.status(200).json(labSessions);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
}

export async function uploadSolution(req: Request, res: Response) {
    try {
        const { studentId, questionId } = req.body;
        const solutionFile = req.file;

        // Check if studentId and questionId are valid
        const questions = await prisma.question.findMany({
            where: {
                id: Number(questionId),
            },
        });

        if (!questions || questions.length === 0) {
            return res.status(400).send({ error: 'Invalid question id' });
        }


        // Check if solution file is uploaded
        if (!solutionFile) {
            console.error(solutionFile, studentId, questionId, "No solution file uploaded");
            return res.status(400).send({ error: 'No solution file uploaded' });
        }

        const dirPath = path.join(__dirname, '/../uploads', studentId, questionId);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // rename the file to solution.cpp
        const solutionFilePath = path.join(dirPath, 'solution.cpp');
        fs.renameSync(solutionFile.path, solutionFilePath);



        // push to redis
        client.lPush('submissions', JSON.stringify({ studentId, questionId, solutionFilePath, dirPath, testCases: JSON.parse(questions[0].inputsOutputs) }));

        // Set up SSE
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // send response that its pushed to the quque to the client
        res.write('data: {"pushed": true}\n\n');

        const channel = `${studentId}-${questionId}`;

        const messageHandler = async (message: string) => {
            try {
                const data = JSON.parse(message);
                res.write(`data: ${JSON.stringify(data)}\n\n`);

                if (data.end) {
                    console.log("Ending connection");
                    res.end();
                    client.unsubscribe(channel);
                    const submission = await prisma.submission.create({
                        data: {
                            studentId: Number(studentId),
                            questionId: Number(questionId),
                            labSessionId: questions[0].labSessionId as number,
                            status: data.status,
                        }
                    })
                }
            } catch (error) {
                console.error("Error parsing message:", error);
                res.end();
                client.unsubscribe(channel);
            }
        };

        // Subscribe to channel

        client.subscribe(channel, messageHandler);

        console.log("pushed to excicution queue");
        
            // Handle client disconnect
            req.on('close', () => {
            console.log("Client disconnected");
            client.unsubscribe(channel);
            });




    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
}

