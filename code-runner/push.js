import { createClient } from "redis";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const client = createClient();

client.on("error", (err) => console.log("Redis Client Error", err));

client.connect();

client.on("ready", () => {
    console.log("Redis Client Ready");

    // run every 3 second 
    setInterval(() => {
        client.rPush("submissions",
            JSON.stringify({
                studentId : "123", questionId : "223" , solutionFilePath : __dirname+"/program.cpp" , dirPath : __dirname , testCases : [{ input : "4 5" , output : "45" } , { input : "5 7" , output : "57" }]
            })
        );
        console.log("Pushed Hello World");
    }, 3000);
}); 