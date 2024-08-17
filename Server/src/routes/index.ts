import { Router } from 'express';
import { getQuestions, handleSubmission } from '../controller/submissionController';
import {getQuestions as getQuestionsForStudent , uploadSolution } from '../controller/studentController';
import multer from 'multer';

const router = Router();

export default (upload: multer.Multer) => {
  router.post('/submit', upload.single('solution'), handleSubmission);
  router.get('/questions',getQuestions)
  router.get('/questionsforstudent',getQuestionsForStudent)
  router.post('/upload',upload.single('solution'),uploadSolution)

  
  return router;
};

