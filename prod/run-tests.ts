import { exec } from 'child_process';

exec('ts-node --project tsconfig.json src/index.test.ts', (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
  console.error(stderr);
});
