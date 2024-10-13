import { Request, Response, Router } from 'express';
import { addQuestionToLabSession, createInstructor, createLabSession, createQuestion, getInstructorDetail, getLabAttendance, getLabSession, getSubmissionsForLabSession, judgeSubmission } from '../controller/InstructorController';


const instructorRoute = Router();

//create instructor
instructorRoute.post('/create', createInstructor);

//create lab session
instructorRoute.post('/labsession', createLabSession);

//create question
instructorRoute.post('/question', createQuestion);

//add question to lab session
instructorRoute.post('/question/add', addQuestionToLabSession);

//get lab attendance
instructorRoute.get('/attendance', getLabAttendance);

//get instructor details 
instructorRoute.get('/details', getInstructorDetail);

//get submissions
instructorRoute.get('/submissions', getSubmissionsForLabSession)

//get labsession 
instructorRoute.get('/labsession', getLabSession)

// judge solution
instructorRoute.post('/judge', judgeSubmission)

instructorRoute.get('/' , (req: Request, res: Response) => {
    res.send("hello")
})

export default instructorRoute;