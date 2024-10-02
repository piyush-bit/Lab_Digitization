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
      let submissionJson;
      try {
        submissionJson = JSON.parse(submission);
      } catch (error) {
        console.log("Error parsing submission", submission);
        continue;
      }

      try {
        client.publish(
          `${submissionJson.studentId}-${submissionJson.questionId}`,
          JSON.stringify({ start: true })
        );
        //compile
        const compileResult = await compile(
          submissionJson.solutionFilePath,
          submissionJson.dirPath
        );

        client.publish(
          `${submissionJson.studentId}-${submissionJson.questionId}`,
          JSON.stringify({ ...compileResult })
        );
        console.log("compile finsh and sent");
        
        // run
        // console.log("testcases", submissionJson.testCases);

        const result = await run(
          submissionJson.solutionFilePath,
          submissionJson.dirPath,
          submissionJson.testCases,
          client
        );

        // save the output json in the submissionJson.dirPath
        const outputPath = `${submissionJson.dirPath}/output.json`;
        const outputJson = {
          ...result,
          studentId: submissionJson.studentId,
          questionId: submissionJson.questionId,
          end: true,
          status : result.failed.length === 0 ? "success" : "failed"
        };
        fs.writeFileSync(outputPath, JSON.stringify(outputJson));

        client.publish(
          `${submissionJson.studentId}-${submissionJson.questionId}`,
          JSON.stringify(outputJson)
        );

        console.log(
          `Running submission: ${submissionJson.studentId} ${submissionJson.questionId}`,
          result
        );
      } catch (error) {
        client.publish(
          `${submissionJson.studentId}-${submissionJson.questionId}`,
          JSON.stringify({
            ...error,
            studentId: submissionJson.studentId,
            questionId: submissionJson.questionId,
            end: true,
            status : "failed"
          })
        );
      }
    } else {
      // wait a sec
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};
