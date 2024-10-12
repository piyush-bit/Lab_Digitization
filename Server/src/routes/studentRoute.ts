import { Request, Response, Router } from 'express';
import { createStudent, getLabSessions, getQuestions, getStatus, getStudent, uploadSolution } from '../controller/studentController';
import { upload } from '.';

const studentRouter = Router();
//create student
studentRouter.post('/create', createStudent);

//get questions for student
studentRouter.get('/questions', getQuestions);

//get labsessions for student
studentRouter.get('/labsessions', getLabSessions);

//get status for student
studentRouter.get('/status', getStatus);

//upload solution
studentRouter.post('/submit', upload.single('solution'), uploadSolution);

studentRouter.get('/' , getStudent)

export default studentRouter;