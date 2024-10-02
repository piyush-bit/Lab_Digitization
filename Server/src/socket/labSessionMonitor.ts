import { Server, Socket } from "socket.io";
import { subscriber } from "../database/redis";

const users : Map<string, Socket> = new Map();
const sessionUsers : Map<string, Set<string>> = new Map();

function handleConnection (io:Server ,socket: Socket) {
    const { instructorId , labsessionId } = socket.handshake.query;

    if (!instructorId || !labsessionId) {
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
            const sessionInstructor = sessionUsers.get(labsessionId as string);
            if (sessionInstructor) {
                sessionInstructor.forEach((user) => {
                    const socket = users.get(user);
                    users.get(user)?.emit("submissions", data);
                });
            }
        });


    }
    else {
        const set = sessionUsers.get(labsessionId as string);
        set?.add(instructorId as string);
    }

    
}

function handleDisconnection (io:Server, socket: Socket) {

}