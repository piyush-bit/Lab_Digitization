import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import ReactDOM from 'react-dom';

type Student = {
  id: number;
  name: string;
  email: string;
  enrollmentNumber: string;
  departmentId: number;
};

export enum SubmissionStatus {
  Failed = 'failed',
  Passed = 'passed',
  Pending = 'pending',
}

type Submission = {
  id: number;
  studentId: number;
  questionId: number;
  labSessionId: number;
  submissionTime: string;
  status: SubmissionStatus;
  resultDetails: string | null;
  solution: string | null;
  student: Student;
  labSession: LabSession;
  question: Question;
};

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
  fetchSubmissions : () => void;
};

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (questionData: {
    description: string;
    inputsOutputs: string;
  }) => void;
}

type Question = {
  id: number;
  instructorId: number;
  labSessionId: number;
  description: string;
  inputsOutputs: string;
};

type LabSession = {
  id: number;
  programId: number;
  instructorId: number;
  sessionDate: string;
  description: string;
  questions: Question[];
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, submission , fetchSubmissions }) => {
  if (!isOpen || !submission) return null;

  console.log('Rendering Modal with submission:', submission);

  let resultDetails;
  try {
    resultDetails = JSON.parse(submission.resultDetails || '{}');
  } catch (error) {
    resultDetails = { error: 'Failed to parse result details' };
  }

  const handleAccept = async () => {
    await axios.post('http://localhost:3000/api/ins/judge', {
      submissionId: submission.id,
      verdict: 'passed'
    });
    onClose();
    fetchSubmissions();
  };

  const handleReject = async () => {
    await axios.post('http://localhost:3000/api/ins/judge', {
      submissionId: submission.id,
      verdict: 'failed'
    });
    onClose();
    fetchSubmissions();
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Submission Details</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p><strong>Student:</strong> {submission.student.name}</p>
            <p><strong>Enrollment Number:</strong> {submission.student.enrollmentNumber}</p>
            <p><strong>Email:</strong> {submission.student.email}</p>
          </div>
          <div>
            <p><strong>Submission ID:</strong> {submission.id}</p>
            <p><strong>Question ID:</strong> {submission.questionId}</p>
            <p><strong>Submission Time:</strong> {new Date(submission.submissionTime).toLocaleString()}</p>
            <p><strong>Status:</strong> {submission.status.toUpperCase()}</p>
          </div>
        </div>
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Result Details</h3>
          
          {resultDetails.passed && (
            <div>
              <p><strong>Passed Tests:</strong> {resultDetails.passed.length}</p>
            </div>
          )}
          {resultDetails.failed && resultDetails.failed.length > 0 && (
            <div>
              <p><strong>Failed Tests:</strong> {resultDetails.failed.length}</p>
              <ul className="list-disc pl-5">
                {resultDetails.failed.map((test: any, index: number) => (
                  <li key={index}>
                    Input: {test.input}, Expected: {test.expected}, Output: {test.output}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {resultDetails.time && <p><strong>Execution Time:</strong> {resultDetails.time}ms</p>}
          {submission.solution && <p style={{ whiteSpace: 'pre-line' }}><strong>Solution:</strong> <br /> {submission.solution}</p>}
          {resultDetails.output && <p style={{ whiteSpace: 'pre-line' }}><strong>Output:</strong> <br /> {resultDetails.output}</p>}
          {submission.status == "pending" && <div className="flex gap-2">
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded" onClick={handleAccept}>Accept</button>
            <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded" onClick={handleReject}>Reject</button>
            </div>}
        </div>
        <button
          onClick={onClose}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Close
        </button>
      </div>
    </div>,
    document.body
  );
};


const AddQuestionModal: React.FC<AddQuestionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [description, setDescription] = useState('');
  const [inputsOutputs, setInputsOutputs] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ description, inputsOutputs });
    setDescription('');
    setInputsOutputs('');
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Add Question</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 font-bold mb-2">
              Description:
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="inputsOutputs" className="block text-gray-700 font-bold mb-2">
              Inputs/Outputs:
            </label>
            <textarea
              id="inputsOutputs"
              value={inputsOutputs}
              onChange={(e) => setInputsOutputs(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Question
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

function MonitorLab() {
  const { id } = useParams();
  const instructorId = 1;
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [labSession, setLabSession] = useState<LabSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  const fetchLabSession = useCallback(async () => {
    try {
      const response = await axios.get<LabSession>(`http://localhost:3000/api/ins/labsession`, {
        params: { labSessionId: id }
      });
      setLabSession(response.data);
    } catch (error) {
      console.error('Error fetching lab session:', error);
      setError('Failed to load lab session data. Please try refreshing the page.');
    }
  }, [id]);

  const fetchSubmissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get<Submission[]>(`http://localhost:3000/api/ins/submissions`, {
        params: { labSessionId: id }
      });
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Failed to load submissions. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let socket: Socket;

    const setupSocket = () => {
      socket = io('http://localhost:3000', {
        query: {
          instructorId,
          labsessionId: id
        }
      });

      socket.on('submissions', () => {
        fetchSubmissions();
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setError('Failed to establish real-time connection. Some updates may be delayed.');
      });
    };

    Promise.all([fetchLabSession(), fetchSubmissions()]).then(setupSocket);

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [id, fetchSubmissions, fetchLabSession]);

  const handleAddQuestion = async ({ description, inputsOutputs }: { description: string; inputsOutputs: string }) => {
    try {
      await axios.post(`http://localhost:3000/api/ins/question`, {
        description,
        testCases : inputsOutputs , 
        labSessionId: Number(id),
        instructorId : instructorId
      });
      setIsAddingQuestion(false);
      fetchLabSession(); // Refresh the lab session data to include the new question
    } catch (error) {
      console.error('Error adding question:', error);
      setError('Failed to add new question. Please try again.');
    }
  };

  if (isLoading && submissions.length === 0 && !labSession) {
    return <div>Loading lab session and submissions...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">MonitorLab {id}</h1>
      
      {/* Questions Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labSession?.questions.map((question) => (
            <div key={question.id} className="border p-4 rounded-lg shadow">
              <h3 className="font-bold mb-2">Question #{question.id}</h3>
              <p>{question.description}</p>
            </div>
          ))}
        </div>
          <button
            onClick={() => setIsAddingQuestion(true)}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            + Add Question
          </button>
        
      </div>

      {/* Submissions Section */}
      <h2 className="text-xl font-semibold mb-4">Submissions</h2>
      {submissions.length === 0 ? (
        <div className="text-gray-500">No submissions yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="border p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedSubmission(submission)}
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">Submission #{submission.id}</h2>
                <span className={`px-2 py-1 rounded text-sm ${
                  submission.status === 'passed' ? 'bg-green-200 text-green-800' :
                  submission.status === 'failed' ? 'bg-red-200 text-red-800' :
                  'bg-yellow-200 text-yellow-800'
                }`}>
                  {submission.status.toUpperCase()}
                </span>
              </div>
              <p><strong>Student:</strong> {submission.student.name}</p>
              <p><strong>Question ID:</strong> {submission.questionId}</p>
              <p><strong>Submission Time:</strong> {new Date(submission.submissionTime).toLocaleString()}</p>
              <p className="text-sm text-blue-600 mt-2">Click to view details</p>
            </div>
          ))}
        </div>
      )}
      <Modal
        isOpen={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        submission={selectedSubmission}
        fetchSubmissions={fetchSubmissions}
      />

      {/* Add Question Modal */}
      <AddQuestionModal
        isOpen={isAddingQuestion}
        onClose={() => setIsAddingQuestion(false)}
        onSubmit={handleAddQuestion}
      />
    </div>
  );
}

export default MonitorLab;