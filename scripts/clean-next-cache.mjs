import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const targets = [".next", ".turbo"];

for (const target of targets) {
  const fullPath = resolve(process.cwd(), target);
  await rm(fullPath, { recursive: true, force: true });
  console.log(`Removed ${fullPath}`);
}
