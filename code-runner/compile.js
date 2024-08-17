import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
export async function compile(solutionFilePath , dirPath){
    const compileCommand = `g++ ${solutionFilePath} -o ${dirPath}/output`;

    try {
      const { stdout, stderr } = await execPromise(compileCommand);
      if(stderr) {
        return {
            status: "failed",
            output: stderr , 
            end : true
        }
      }
      return {
          status: "success",
          output: "Compiled successfully"
      };
  } catch (error) {
      console.error(`Compilation error: ${error}`);
      return {
          status: "failed",
          output: error.message,
          end : true
      };
  }
}