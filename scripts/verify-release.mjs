import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const commands = [
  ['run', 'lint'],
  ['run', 'verify:game-brain'],
  ['run', 'verify:ui-integration'],
  ['run', 'verify:layout'],
  ['run', 'verify:persistence'],
  ['run', 'verify:session-flow'],
  ['run', 'verify:mobile'],
  ['run', 'build'],
];

function runCommand(args) {
  return new Promise((resolve, reject) => {
    const label = `${npmCommand} ${args.join(' ')}`;
    console.log(`\n> ${label}`);
    const command = process.platform === 'win32' ? process.env.ComSpec ?? 'cmd.exe' : npmCommand;
    const commandArgs = process.platform === 'win32'
      ? ['/d', '/s', '/c', npmCommand, ...args]
      : args;
    const child = spawn(command, commandArgs, {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: false,
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} exited with code ${code}`));
    });
  });
}

for (const args of commands) {
  await runCommand(args);
}

console.log('\nRelease verification passed.');
