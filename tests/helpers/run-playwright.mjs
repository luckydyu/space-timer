import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { listenStaticServer } from './serve-static.mjs';

const server = await listenStaticServer();
const cliPath = resolve('node_modules/@playwright/test/cli.js');
const args = [cliPath, 'test', ...process.argv.slice(2)];

const child = spawn(process.execPath, args, {
  cwd: process.cwd(),
  stdio: 'inherit'
});

child.on('exit', (code, signal) => {
  server.close(() => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
});
