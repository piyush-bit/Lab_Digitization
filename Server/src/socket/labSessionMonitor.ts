import { Server, Socket } from "socket.io";
import { subscriber } from "../database/redis";

//stores userid:Socket
const users : Map<string, Socket> = new Map();
//stores labSessionId:Set<instructorId>
const sessionUsers : Map<string, Set<string>> = new Map();

export function handleConnection (io:Server ,socket: Socket) {
    const { instructorId , labsessionId } = socket.handshake.query;

    if (!instructorId || !labsessionId) {
        console.log("Invalid query params");
        socket.disconnect();
        return;
    }
    users.set(instructorId as string, socket);
    
    if (!sessionUsers.has(labsessionId as string)) {
        // create a new set and add the instructorId
        sessionUsers.set(labsessionId as string, new Set([instructorId as string]));
        // subscribe to the lab session
        subscriber.subscribe(labsessionId as string , (message) => {
            const data = JSON.parse(message);
            console.log("socket",data);
            const sessionInstructors = sessionUsers.get(labsessionId as string);
            // console.log("sessionInstructors", sessionInstructors);
            
            if (sessionInstructors) {
                sessionInstructors.forEach((user) => {
                    const socket = users.get(user);
                    // console.log("socket-d", socket);
                    if (socket && socket.connected) {
                      socket.emit("submissions", data);
                      console.log(`Emitting submissions for user ${user}`);
                    } else {
                      console.log(`Socket for user ${user} is not available or not connected`);
                    }
                  });
            }
        });


    }
    else {
        // retrieve the set of users for this lab session and add the instructorId
        const sessionInstructors = sessionUsers.get(labsessionId as string);
        if (sessionInstructors) {
            sessionInstructors.add(instructorId as string);
        }
    }
    // console.log("users", users);
    console.log("sessionUsers", sessionUsers);

    socket.emit("instructorId", instructorId);
    
    
    
}

export function handleDisconnection(socket: Socket) {
    const { instructorId, labsessionId } = socket.handshake.query;

    if (!instructorId || !labsessionId) {
        console.log("Invalid query params");
        return;
    }

    // Remove the instructor's socket from the users map
    users.delete(instructorId as string);

    // Get the set of users for this lab session
    const sessionInstructors = sessionUsers.get(labsessionId as string);

    if (sessionInstructors) {
        // Remove the instructorId from the set
        sessionInstructors.delete(instructorId as string);

        // If no more users are left in this session, clean up
        if (sessionInstructors.size === 0) {
            sessionUsers.delete(labsessionId as string);
            // Optionally, unsubscribe from the lab session
            subscriber.unsubscribe(labsessionId as string);
        }
    }
}
