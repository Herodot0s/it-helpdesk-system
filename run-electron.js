const { spawn } = require('child_process');
const path = require('path');
const electronPath = require('./node_modules/electron');

// Strip out ELECTRON_RUN_AS_NODE leaked by IDE / terminal harnesses
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const flags = [
  '.',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-gpu-sandbox',
  '--in-process-gpu'
];

const child = spawn(electronPath, flags, {
  env,
  cwd: __dirname,
  stdio: 'inherit',
  windowsHide: false
});

child.on('error', (err) => {
  console.error('Failed to start Electron:', err);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code || 0);
});
