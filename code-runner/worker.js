import { createClient } from "redis";
import { compile } from "./compile.js";
import { run } from "./run.js";
import fs from "fs";

const client = createClient();         

client.on("error", (err) => console.log("Redis Client Error", err));

client.connect();

client.on("ready", () => {
    console.log("Redis Client Ready");

    processQueue();
    
});


const processQueue = async () => {
    while (true) {
        const submission = await client.rPop("submissions");
        if (submission) {
            const submissionJson = JSON.parse(submission);
            client.publish(`${submissionJson.studentId}-${submissionJson.questionId}`, JSON.stringify({ "start" : true }));
            //compile 
            const compileResult  = await compile(submissionJson.solutionFilePath , submissionJson.dirPath);

            client.publish(`${submissionJson.studentId}-${submissionJson.questionId}`, JSON.stringify({ ...compileResult  }));
            // run
            console.log("testcases", submissionJson.testCases);
            
            const result = await run(submissionJson.solutionFilePath , submissionJson.dirPath , submissionJson.testCases , client); 

            // save the output json in the submissionJson.dirPath
            const outputPath = `${submissionJson.dirPath}/output.json`;
            const outputJson = { ...result , studentId : submissionJson.studentId , questionId : submissionJson.questionId , "end" : true };
            fs.writeFileSync(outputPath, JSON.stringify(outputJson));


            client.publish(`${submissionJson.studentId}-${submissionJson.questionId}`, JSON.stringify(outputJson));

            console.log(`Running submission: ${submissionJson.studentId} ${submissionJson.questionId}`, result);
        }
        else {
            // wait a sec 
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};
