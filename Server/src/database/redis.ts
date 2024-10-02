import {createClient} from 'redis';
export const client = createClient()
export const publisher = createClient();
export const subscriber = createClient();
// Connect all Redis clients and wait for the connection to be established
async function connectRedisClients() {
    try {
        await client.connect();
        console.log("Main client connected to Redis");

        await publisher.connect();
        console.log("Publisher connected to Redis");

        await subscriber.connect();
        console.log("Subscriber connected to Redis");
    } catch (error) {
        console.error("Error connecting to Redis:", error);
        process.exit(1); // Exit the process if unable to connect
    }
}

// Call the function to connect clients
connectRedisClients();