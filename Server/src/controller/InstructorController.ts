import { Request, Response } from "express";
import prisma from "../database/prisma";

export async function createInstructor(req: Request, res: Response) {
    try{
        const { name , email , departmentId  } = req.body;

        const instructor = await prisma.instructor.create({
            data: {
               name,
               email,
               departmentId
            }
        });
        res.status(201).send(instructor);
    }
    catch(err){
        console.log(err);
        res.status(500).send(err);
    }
}

// create lab session
export async function createLabSession(req: Request, res: Response) {
    try {
        const { programId, instructorId, sessionDate, description } = req.body;

        // Validate input
        if (!programId || !instructorId || !sessionDate ) {
            return res.status(400).json({ error: "programId, instructorId, sessionDate, and questionIds (array) are required" });
        }

        // Convert sessionDate string to Date object
        const parsedDate = new Date(sessionDate);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ error: "Invalid date format for sessionDate" });
        }

        const labSession = await prisma.labSession.create({
            data: {
                program: {
                    connect: { id: programId }
                },
                instructor: {
                    connect: { id: instructorId }
                },
                sessionDate: parsedDate,
                description: description || undefined, // Only set if provided
            },
            include: {
                program: true,
                instructor: true,
                questions: true
            }
        });
        res.status(201).send(labSession);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
}

// create question
export async function createQuestion(req: Request, res: Response) {
    try {
        const { description, instructorId , testCases , labSessionId } = req.body;
        if (!description || !instructorId || !testCases || !labSessionId) {
            return res.status(400).json({ error: "description, instructorId, testCases, and labSessionId are required" });
        }
        const question = await prisma.question.create({
            data: {
                description,
                inputsOutputs : JSON.stringify(testCases),
                labSessionId , 
                instructorId ,
            }
        });
        res.status(201).send(question);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
}

// add question to lab session
export async function addQuestionToLabSession(req: Request, res: Response) {
    try {
        const { labSessionId, questionId } = req.body;
        const labSession = await prisma.labSession.update({
            where: { id: labSessionId },
            data: {
                questions: {
                    connect: { id: questionId }
                }
            }
        });
        res.status(200).send(labSession);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
}

export async function getLabAttendance(req: Request, res: Response) {  
    try {
        const { labSessionId } = req.query;
        if (!labSessionId) {
            return res.status(400).send("labSessionId is required");
        }
        // get the program id from lab session
        const labSession = await prisma.labSession.findUnique({
            where: { id: Number(labSessionId) },
            include: {
                program: {
                    include: {
                        students: true, // Include students related to the program
                    },
                },
                submissions: {
                    include: {
                        student: true // Include student related to the submission
                    },
                }
            }
        })

        if (!labSession) {
            return res.status(404).send("labSession not found");
        }

        // get all the student in the program and create a object with all enrolment number marked false 
        const attendance = labSession.program.students.reduce((acc: Map<string, boolean>, student) => {
            acc.set(student.enrollmentNumber, false); // Use set method for Map
            return acc;
        }, new Map<string, boolean>()); // Initialize with a new Map

        // get all the submissions for the lab session
        // mark them present whose submission is not null 
        labSession.submissions.forEach((submission) => {
            if (submission) {
                attendance.set(submission.student.enrollmentNumber, true); // Use set method for Map
            }
        })

        // return the attendance
        res.status(200).json({
            attendance: Object.fromEntries(attendance),
        });

    }catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
}

export async function getInstructorDetail(req: Request , res: Response){
    try {
        const { instructorId } = req.query;
        if (!instructorId) {
            return res.status(400).send("instructorId is required");
        }

        const instructor = await prisma.instructor.findUnique({
            where: {
                id: Number(instructorId)
            },
            include: {
                labSessions: true
            }
        })
        res.status(200).json(instructor);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
}

export async function getSubmissionsForLabSession(req: Request, res: Response) {
    try {
        const { labSessionId } = req.query;
        if (!labSessionId) {
            return res.status(400).send("labSessionId is required");
        }
        const submissions = await prisma.submission.findMany({
            where: {
                labSessionId: Number(labSessionId)
            },
            include: {
                student: true
            }
        })
        res.status(200).json(submissions);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
}

//getlabsession info 
export async function getLabSession(req: Request, res: Response) {
    try {
        const { labSessionId } = req.query;
        if (!labSessionId) {
            return res.status(400).send("labSessionId is required");
        }
        const labSession = await prisma.labSession.findUnique({
            where: {
                id: Number(labSessionId)
            },
            include: {
                questions : true
            }
        })
        res.status(200).json(labSession);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
}

export async function judgeSubmission(req: Request, res: Response) {
    try {
        const { submissionId, verdict } = req.body;
        if (!submissionId) {
            return res.status(400).send("submissionId is required");
        }
        if (!verdict) {
            return res.status(400).send("verdict is required");
        }
        if (verdict !== "passed" && verdict !== "failed") {
            return res.status(400).send("Invalid verdict");
        }
        const submission = await prisma.submission.update({
            where: {
                id: Number(submissionId)
            },
            data: {
                status: verdict
            }
        })
        res.status(200).json(submission);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
}