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
      devServer.on('close', () => {
        resolve();
      });
      if (devServer.pid) {
        try {
          process.kill(devServer.pid, 'SIGTERM');
        } catch (err) {
          console.error('Failed to kill dev server process:', err);
        }
      }
      setTimeout(() => {
        if (!devServer.killed && devServer.pid) {
          try {
            process.kill(devServer.pid, 0); // Check if process is running
            devServer.kill('SIGKILL');
          } catch (e) {
            // Process is not running, do nothing
          }
        }
      }, 2000);
    } else {
      resolve();
    }
  });
}

afterAll(() => {
  return shutdownDevServer();
});
