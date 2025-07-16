import { beforeAll, afterAll } from 'vitest'
import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'

let devServer: ChildProcess;

beforeAll(async () => {
  const testAppDir = path.resolve(__dirname, './test-app');
  await new Promise<void>((resolve, reject) => {
    devServer = spawn('npm', ['run', 'dev'], {
      cwd: testAppDir,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    devServer.stdout?.on('data', (data) => {
      console.log(`[test-app server stdout]: ${data}`);
      if (data.toString().includes('Network')) {
        resolve();
      }
    });

    devServer.stderr?.on('data', (data) => {
      console.error(`[test-app server stderr]: ${data}`);
    });

    devServer.on('error', (err) => {
      reject(err);
    });

    setTimeout(() => {
      reject(new Error("Dev server startup timeout"));
    }, 25000);
  });
});

function shutdownDevServer(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (devServer) {
      console.log('Shutting down dev server...');
      devServer.on('close', () => {
        console.log('Dev server has been shut down');
        resolve();
      });
      devServer.on('exit', () => {
        console.log('Dev server process exited');
        resolve();
      });
      devServer.kill('SIGTERM');
    } else {
      resolve();
    }
  });
}

afterAll(async () => {
  try {
    return await shutdownDevServer();
  } catch (error) {
    console.error('Error shutting down dev server:', error);
  }
});