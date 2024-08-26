import express from 'express';
import multer from 'multer';
import path from 'path';
import routes from './routes';
import cors from 'cors';

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true }));


// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, './uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Routes
app.use('/api', routes(upload));



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
