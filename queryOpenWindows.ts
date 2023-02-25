import osascript from "./osascript";
import { value } from "./value";
import { DesktopProcess } from "./DesktopProcessWindows";
import { unpackOutput } from "./unpackOutput";
import fs from "fs";
import path from "path";

export async function queryOpenWindows(): Promise<DesktopProcess[]> {
  const scriptPath = path.join(__dirname, "queryOpenWindows.scpt");
  const output = await osascript.execute(
    fs.readFileSync(scriptPath, "utf8")
  );
  fs.writeFileSync("output.txt", output, "utf8");
  const unpacked = unpackOutput(output);
  const transformed = [];
  for (const p in unpacked) {
    const windows = [];
    for (const w in unpacked[p]) {
      windows.push(unpacked[p][w]);
    }
    const k = "processName";
    transformed.push({
      [k]: value<string>(windows, k),
      windows
    });
  }
  fs.writeFileSync("output.json", JSON.stringify(transformed, null, 2));
  return transformed;
}
