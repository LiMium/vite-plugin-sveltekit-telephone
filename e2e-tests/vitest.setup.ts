import { beforeAll, afterAll } from 'vitest'
import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'

let devServer: ChildProcess;

beforeAll(async () => {
  const testAppDir = path.resolve(__dirname, './test-app');
  await new Promise<void>((resolve, reject) => {
    devServer = spawn('npm', ['run', 'dev'], {
      cwd: testAppdDir,
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

afterAll(() => {
  return new Promise<void>((resolve) => {
    if (devServer) {
      devServer.on('close', () => {
        resolve();
      });
      if (devServer.pid) {
        process.kill(devServer.pid, 'SIGTERM');
      }
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
