import fs from "fs";
import path from "path";

export function getMarkdownContent(filePath: string): string {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.readFileSync(fullPath, "utf-8");
}