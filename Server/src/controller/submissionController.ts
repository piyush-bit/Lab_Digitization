import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { client } from '../database/redis';


type TestCase = {
  input: string;
  output: string;
};

type Question = {
  description: string;
  testCases: TestCase[];
};

type Questions = {
  [key: number]: Question;
};

const questions : Questions  = {
  1: {
    description: 'output the difference between two numbers entered by the user',
    testCases: [{ input: '10 4', output: '6' }, { input: '15 7', output: '8' }],
  },
  2: {
    description: 'output the product of two numbers entered by the user',
    testCases: [{ input: '3 4', output: '12' }, { input: '5 6', output: '30' }],
  },
  3: {
    description: 'output the remainder when the first number is divided by the second number',
    testCases: [{ input: '17 5', output: '2' }, { input: '20 3', output: '2' }],
  },
  4: {
    description: 'output the absolute difference between two numbers entered by the user',
    testCases: [{ input: '5 8', output: '3' }, { input: '10 3', output: '7' }],
  },
  5: {
    description: 'output "Even" if the number entered by the user is even, otherwise output "Odd"',
    testCases: [{ input: '4', output: 'Even' }, { input: '7', output: 'Odd' }],
  },
  6: {
    description: 'output the larger of two numbers entered by the user',
    testCases: [{ input: '8 12', output: '12' }, { input: '15 7', output: '15' }],
  },
  7: {
    description: 'output "Prime" if the number entered is prime, otherwise output "Not Prime"',
    testCases: [{ input: '7', output: 'Prime' }, { input: '12', output: 'Not Prime' }],
  },
  8: {
    description: 'output the factorial of the number entered by the user',
    testCases: [{ input: '5', output: '120' }, { input: '4', output: '24' }],
  },
  9: {
    description: 'output the sum of all numbers from 1 to the number entered by the user',
    testCases: [{ input: '5', output: '15' }, { input: '3', output: '6' }],
  },
  10: {
    description: 'output the number of digits in the integer entered by the user',
    testCases: [{ input: '12345', output: '5' }, { input: '100', output: '3' }],
  },
  11: {
    description: 'output the reverse of the number entered by the user',
    testCases: [{ input: '1234', output: '4321' }, { input: '1000', output: '0001' }],
  },
  12: {
    description: 'output "Leap Year" if the year entered is a leap year, otherwise output "Not Leap Year"',
    testCases: [{ input: '2000', output: 'Leap Year' }, { input: '2023', output: 'Not Leap Year' }],
  },
  13: {
    description: 'output the sum of the digits of the number entered by the user',
    testCases: [{ input: '123', output: '6' }, { input: '456', output: '15' }],
  },
  14: {
    description: 'output "Palindrome" if the number entered is a palindrome, otherwise output "Not Palindrome"',
    testCases: [{ input: '12321', output: 'Palindrome' }, { input: '12345', output: 'Not Palindrome' }],
  },
  15: {
    description: 'output the greatest common divisor of two numbers entered by the user',
    testCases: [{ input: '48 18', output: '6' }, { input: '100 75', output: '25' }],
  }
}

export const handleSubmission = async (req: Request, res: Response) => {
  const { studentId, questionId } = req.body;
  const solutionFile = req.file;

  if (!solutionFile) {
    console.error(solutionFile, studentId, questionId , "No solution file uploaded");
    return res.status(400).send({ error: 'No solution file uploaded' });
  }

  const dirPath = path.join(__dirname, '/../uploads', studentId, questionId);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // rename the file to solution.cpp
  const solutionFilePath = path.join(dirPath, 'solution.cpp');
  fs.renameSync(solutionFile.path, solutionFilePath);


  // check if question id is valid
  if (!questions[questionId]) {
    console.error(studentId, questionId, "Invalid question id");
    return res.status(400).send({ error: 'Invalid question id' });
  }

  // push to redis
  client.lPush('submissions', JSON.stringify({ studentId, questionId , solutionFilePath , dirPath ,  testCases : questions[questionId].testCases }));


  const channel = `${studentId}-${questionId}`;

  const messageHandler = (message: string) => {
    try {
      const data = JSON.parse(message);
      res.write(`data: ${JSON.stringify(data)}\n\n`);

      if (data.end) {
        console.log("Ending connection");
        res.end();
        client.unsubscribe(channel);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
      res.end();
      client.unsubscribe(channel);
    }
  };
  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // send response that its pushed to the quque to the client
  res.write('data: {"pushed": true}\n\n');

  // Subscribe to channel

  client.subscribe(channel, messageHandler);

  console.log("pushed to excicution queue");
  
    // Handle client disconnect
    req.on('close', () => {
      console.log("Client disconnected");
      client.unsubscribe(channel);
    });
};

export const getQuestions = (req: Request, res: Response) => {
  res.send(questions);
};


