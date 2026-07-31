import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const viteBin = path.join(root, "node_modules", "vite", "bin", "vite.js");
const stdio = process.stdout.isTTY ? "inherit" : ["ignore", "pipe", "pipe"];

function run(command, args) {
  const child = spawn(command, args, { stdio, shell: false });
  if (child.stdout) child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  if (child.stderr) child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  return child;
}

const processes = [
  run(process.execPath, ["server/index.js"]),
  run(process.execPath, [viteBin]),
];

function stopAll(signal = "SIGTERM") {
  for (const child of processes) {
    if (!child.killed && child.exitCode === null) child.kill(signal);
  }
}

let shuttingDown = false;
function shutdown(code = 0, signal = "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;
  process.exitCode = code;
  stopAll(signal);
  const forceExit = setTimeout(() => process.exit(code), 1500);
  forceExit.unref();
}

for (const child of processes) {
  child.on("exit", (code) => {
    if (!shuttingDown && code && code !== 0) shutdown(code);
  });
}

process.on("SIGINT", () => shutdown(0, "SIGINT"));
process.on("SIGTERM", () => shutdown(0, "SIGTERM"));