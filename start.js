import { spawn } from 'child_process';

console.log('🚀 MediSync AI starting...');

const server = spawn('node', ['server/index.js'], {
  stdio: 'inherit',
  shell: true
});

const client = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true
});

server.on('error', (err) => {
  console.error('Server process error:', err);
});

client.on('error', (err) => {
  console.error('Client process error:', err);
});

process.on('SIGINT', () => {
  server.kill();
  client.kill();
  process.exit();
});

