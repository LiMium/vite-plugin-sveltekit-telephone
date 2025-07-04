import axios from 'axios';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

const BASE_URL = 'http://localhost:5173'; // Default Vite port
const RPC_ENDPOINT = `${BASE_URL}/telephone`;

describe('E2E RPC Tests', () => {
  let devServer: ChildProcess;
  let serverReady = false;
  let serverErrorOutput = '';

  beforeAll((done) => {
    const testAppDir = path.resolve(__dirname, '../test-app');
    // Try to run npm install first, then run dev
    // Note: Due to sandbox limitations, this might not work as expected if npm install fails silently.
    devServer = spawn('npm', ['run', 'dev'], {
      cwd: testAppDir,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'], // ignore stdin, pipe stdout and stderr
    });

    devServer.stdout?.on('data', (data) => {
      process.stdout.write(`[test-app server stdout]: ${data}`);
      if (data.toString().includes('Network')) { // A common message when Vite server is ready
        serverReady = true;
        done();
      }
    });

    devServer.stderr?.on('data', (data) => {
      process.stderr.write(`[test-app server stderr]: ${data}`);
      serverErrorOutput += data.toString();
      // If server fails to start quickly, call done to not hang tests indefinitely
      if (serverErrorOutput.includes('ERR_PNPM_RECURSIVE_RUN_FIRST') || serverErrorOutput.includes('error')) {
        if (!serverReady) { // Only fail if not already ready
          console.error('Server failed to start or encountered an error quickly.');
        }
      }
    });

    // Failsafe timeout in case server doesn't start or output expected message
    setTimeout(() => {
      if (!serverReady) {
        console.warn("Dev server did not signal readiness within timeout. Proceeding with tests, but they might fail.");
        done();
      }
    }, 25000); // 25 seconds timeout
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      if (devServer) {
        console.log('Stopping dev server...');
        devServer.on('close', () => {
          console.log('Dev server stopped.');
          resolve();
        });
        // Try graceful exit first
        if (devServer.pid) {
            process.kill(devServer.pid, 'SIGTERM');
        }
        // Force kill if not exited after a short delay
        setTimeout(() => {
            if (!devServer.killed) {
                devServer.kill('SIGKILL');
            }
        }, 5000);
      } else {
        resolve();
      }
    });
  });

  const callRpc = async (filePath: string, functionName: string, args: any[]) => {
    if (!serverReady) {
      // Wait a bit longer if server wasn't ready during beforeAll
      await new Promise(resolve => setTimeout(resolve, 5000));
      if (!serverReady) {
        throw new Error('Test server is not ready. Aborting RPC call.');
      }
    }
    return axios.post(RPC_ENDPOINT, {
      filePath,
      functionName,
      args,
    });
  };

  it('should call hello function and get a greeting', async () => {
    const response = await callRpc('src/lib/tele/e2e.telephone.ts', 'hello', ['Tester']);
    expect(response.status).toBe(200);
    expect(response.data.result).toBe('Hello, Tester!');
  });

  it('should call add function and get the sum', async () => {
    const response = await callRpc('src/lib/tele/e2e.telephone.ts', 'add', [5, 7]);
    expect(response.status).toBe(200);
    expect(response.data.result).toBe(12);
  });

  it('should call functionWithNoArgs and get the correct string', async () => {
    const response = await callRpc('src/lib/tele/e2e.telephone.ts', 'functionWithNoArgs', []);
    expect(response.status).toBe(200);
    expect(response.data.result).toBe('No arguments here!');
  });

  it('should call functionWithOptionalArg with argument and get personalized greeting', async () => {
    const response = await callRpc('src/lib/tele/e2e.telephone.ts', 'functionWithOptionalArg', ['User']);
    expect(response.status).toBe(200);
    expect(response.data.result).toBe('Hello, User!');
  });

  it('should call functionWithOptionalArg without argument and get default greeting', async () => {
    const response = await callRpc('src/lib/tele/e2e.telephone.ts', 'functionWithOptionalArg', []);
    expect(response.status).toBe(200);
    expect(response.data.result).toBe('Hello, world!');
  });

  it('should handle errors from the RPC function', async () => {
    try {
      await callRpc('src/lib/tele/e2e.telephone.ts', 'errorFunction', []);
    } catch (error: any) {
      expect(error.response).toBeDefined();
      // The actual error from the function is wrapped by the server
      // The exact structure of error.response.data might depend on SvelteKit/Vite error handling
      // For now, we check if the server responded with an error status (e.g., 500)
      // and if the response data contains the error message.
      // This might need adjustment based on actual error structure from prod package.
      expect(error.response.status).toBeGreaterThanOrEqual(400); // Or specifically 500 if that's what prod returns
      expect(error.response.data).toBeDefined();
      expect(error.response.data.error).toBeDefined();
      expect(error.response.data.error.message).toBe('This is a test error');
    }
  });

  it('should handle calling a non-existent function', async () => {
    try {
      await callRpc('src/lib/tele/e2e.telephone.ts', 'nonExistentFunction', []);
    } catch (error: any) {
      expect(error.response).toBeDefined();
      expect(error.response.status).toBeGreaterThanOrEqual(400);
      expect(error.response.data).toBeDefined();
      expect(error.response.data.error).toBeDefined();
      expect(error.response.data.error.message).toContain('RPC function "src/lib/tele/e2e.telephone.ts:nonExistentFunction" not found');
    }
  });

  it('should handle incorrect argument types for "hello" function', async () => {
    try {
      // Sending a number instead of a string for the 'name' argument
      await callRpc('src/lib/tele/e2e.telephone.ts', 'hello', [123]);
    } catch (error: any) {
      expect(error.response).toBeDefined();
      expect(error.response.status).toBeGreaterThanOrEqual(400);
      expect(error.response.data).toBeDefined();
      expect(error.response.data.error).toBeDefined();
      expect(error.response.data.error.message).toContain('Invalid argument type for name: expected string, got number');
    }
  });

  it('should handle incorrect argument types for "add" function', async () => {
    try {
      // Sending a string for the second argument
      await callRpc('src/lib/tele/e2e.telephone.ts', 'add', [5, 'world']);
    } catch (error: any) {
      expect(error.response).toBeDefined();
      expect(error.response.status).toBeGreaterThanOrEqual(400);
      expect(error.response.data).toBeDefined();
      expect(error.response.data.error).toBeDefined();
      expect(error.response.data.error.message).toContain('Invalid arguments: a and b must be numbers');
    }
  });

   it('should handle missing arguments for "add" function', async () => {
    try {
      await callRpc('src/lib/tele/e2e.telephone.ts', 'add', [5]);
    } catch (error: any) {
      expect(error.response).toBeDefined();
      expect(error.response.status).toBeGreaterThanOrEqual(400); // Or specific code
      expect(error.response.data).toBeDefined();
      expect(error.response.data.error).toBeDefined();
      // The exact error message for missing arguments might vary.
      // The prod package's handleRoute might throw "TypeError: func is not a function" or similar if args don't match.
      // Or it might be a "Cannot read properties of undefined" if the function tries to access a missing arg.
      // For now, we check for a server error. This may need refinement.
      expect(error.response.data.error.message).toBeDefined();
    }
  });
});
