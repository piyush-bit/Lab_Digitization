import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from "../../envVariables";
import CodeInput from "./CodeInput";
import { useNavigate } from 'react-router-dom';

interface LabSession {
  id: number;
  programId: number;
  instructorId: number;
  sessionDate: string;
  description: string;
}

interface Instructor {
  id: number;
  name: string;
  email: string;
  departmentId: number;
  labSessions: LabSession[];
}

interface Program {
  id: number;
  name: string;
  sessions: LabSession[];
}

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  session: LabSession | null;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, session }) => {
  if (!isOpen || !session) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h2 className="text-2xl fo
        nt-bold mb-4">Lab Session Details</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p><strong>Session ID:</strong> {session.id}</p>
            <p><strong>Program ID:</strong> {session.programId}</p>
          </div>
          <div>
            <p><strong>Date:</strong> {new Date(session.sessionDate).toLocaleString()}</p>
            <p><strong>Description:</strong> {session.description}</p>
          </div>
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
const Index: React.FC = () => {
  const [instructorCode, setInstructorCode] = useState<number>(-1);
  const [instructorDetail, setInstructorDetail] = useState<Instructor | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<LabSession | null>(null);
  const navigate = useNavigate();

  const fetchInstructorDetails = useCallback(async (code: number) => {
    console.log('Fetching instructor details for code:', code);
    try {
      setIsLoading(true);
      setError(null);
      const result = await axios.get<Instructor>(`${BACKEND_URL}/api/ins/details?instructorId=${code}`);
      console.log('Received instructor details:', result.data);
      setInstructorDetail(result.data);
      setInstructorCode(code);

      // Group lab sessions by program
      const groupedSessions = result.data.labSessions.reduce((acc, session) => {
        const program = acc.find(p => p.id === session.programId);
        if (program) {
          program.sessions.push(session);
        } else {
          acc.push({ id: session.programId, name: `Program ${session.programId}`, sessions: [session] });
        }
        return acc;
      }, [] as Program[]);

      console.log('Grouped sessions:', groupedSessions);
      setPrograms(groupedSessions);
    } catch (error) {
      console.error('Error fetching instructor details:', error);
      setError('Failed to load instructor details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = Number(formData.get("instructorCode"));
    console.log('Submitted instructor code:', code);
    await fetchInstructorDetails(code);
  };

  useEffect(() => {
    let socket: Socket;

    if (instructorCode !== -1) {
      console.log('Setting up socket connection for instructor:', instructorCode);
      socket = io(BACKEND_URL, {
        query: {
          instructorId: instructorCode,
        }
      });

      socket.on('labSessionUpdate', () => {
        console.log('Received labSessionUpdate event');
        fetchInstructorDetails(instructorCode);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setError('Failed to establish real-time connection. Some updates may be delayed.');
      });
    }

    return () => {
      if (socket) {
        console.log('Disconnecting socket');
        socket.disconnect();
      }
    };
  }, [instructorCode, fetchInstructorDetails]);

  const addLabSession = async (programId: number) => {
    console.log('Adding new lab session for program:', programId);
    // ... (keep the existing addLabSession function)
  };

  console.log('Current state:', { instructorCode, isLoading, error, instructorDetail, programs });

  if (isLoading) {
    return <div className="p-4">Loading instructor details... Please wait.</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-500">Error: {error}</p>
        <button 
          onClick={() => setInstructorCode(-1)} 
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Go back to code input
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {instructorCode === -1 ? (
        <CodeInput onSubmitHandler={onSubmitHandler} />
      ) : instructorDetail ? (
        <>
          <h1 className="text-2xl font-bold mb-4">Welcome, {instructorDetail.name}</h1>
          {programs.length === 0 ? (
            <div className="text-gray-500">No lab sessions yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map((program) => (
                <div key={program.id} className="border p-4 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-3">{program.name}</h2>
                  {program.sessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-gray-50 p-3 rounded mb-2 cursor-pointer hover:bg-gray-100"
                      onClick={() =>navigate(`./lab/${session.id}`)}
                    >
                      <p className="font-medium">Session {session.id}</p>
                      <p className="text-sm text-gray-600">{new Date(session.sessionDate).toLocaleDateString()}</p>
                      <p className="text-sm">{session.description}</p>
                      <p className="text-sm text-blue-600 mt-1">Click to view details</p>
                    </div>
                  ))}
                  <button
                    onClick={() => addLabSession(program.id)}
                    className="mt-3 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full"
                  >
                    Add New Session
                  </button>
                </div>
              ))}
            </div>
          )}
          <Modal
            isOpen={!!selectedSession}
            onClose={() => setSelectedSession(null)}
            session={selectedSession}
          />
        </>
      ) : (
        <div className="text-red-500">
          Something went wrong. Please try again.
          <button 
            onClick={() => setInstructorCode(-1)} 
            className="ml-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Go back to code input
          </button>
        </div>
      )}
    </div>
  );
};

export default Index;