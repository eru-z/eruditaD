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
    if (!child.killed) child.kill(signal);
  }
}

for (const child of processes) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      stopAll();
      process.exit(code);
    }
  });
}

process.on("SIGINT", () => {
  stopAll("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopAll("SIGTERM");
  process.exit(0);
});
