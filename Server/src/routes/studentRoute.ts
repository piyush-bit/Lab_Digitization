import { Request, Response, Router } from 'express';
import { createStudent, getLabSessions, getQuestions, getStatus, uploadSolution } from '../controller/studentController';

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
studentRouter.post('/submit', uploadSolution);

studentRouter.get('/' , (req: Request, res: Response) => {
    res.send("hello")
})

export default studentRouter;