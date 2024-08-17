import { spawn } from 'child_process';
import pLimit from 'p-limit';
const limit = pLimit(10); // Adjust the concurrency limit based on your system's capabilities

const runTestCase = ({ input, output, timeLimit, dirPath  }) => {
  return new Promise((resolve, reject) => {
    console.log(`Running testcase: ${input} ${output}`);
    const child = spawn('./output', [], { cwd: dirPath });
    child.stdin.write(input);
    child.stdin.end();

    let sOutput = '';
    let startTime = Date.now();

    child.stdout.on('data', (data) => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      if (elapsedTime > timeLimit) {
        child.kill(); // Terminate the process if it exceeds the time limit
        reject({ passed: false, input, output: "TLE", expected: output, reason: 'Time Limit Exceeded' });
      }

      sOutput += data.toString();
    });

    child.stderr.on('data', (data) => {
      reject(`Error: ${data}`);
    });

    child.on('close', (code) => {
      if (code === 0) {
        if (sOutput.trim() === output.trim()) {
          resolve({ passed: true, input, output: sOutput, expected: output });
        } else {
          reject({ passed: false, input, output: sOutput, expected: output });
        }
      } else {
        reject(`Process exited with code ${code}`);
      }
    });
  });
};


  export async function run(solutionFilePath , dirPath , testCases ){

    const start = Date.now();
    const promises = testCases.map(testCase => limit(() => runTestCase({ ...testCase , dirPath })));

    try {
      const results = await Promise.allSettled(promises);

      const passed = results.filter(result => result.status === 'fulfilled').map(result => result.value);
      const failed = results.filter(result => result.status === 'rejected').map(result => result.reason);
      return {
          passed , failed , time : Date.now() - start
      }

    } catch (error) {
      console.error(error);

    }
  }