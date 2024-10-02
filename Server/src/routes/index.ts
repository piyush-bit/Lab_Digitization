import { Router } from 'express';
import { getQuestions, handleSubmission } from '../controller/submissionController';
import {getQuestions as getQuestionsForStudent , uploadSolution } from '../controller/studentController';
import multer from 'multer';
import path from 'path';

const router = Router();
// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
export const upload = multer({ storage });


export default () => {
  router.get('/', (req, res) => {
    res.send('hello');
  })
  router.post('/submit', upload.single('solution'), handleSubmission);
  router.get('/questions',getQuestions)
  router.use('/ins', require('./instructorRoute').default);
  router.use('/stu',  require('./studentRoute').default);
  return router;
};

