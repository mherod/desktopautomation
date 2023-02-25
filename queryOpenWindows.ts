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
  const unpacked2 = [];
  for (const p in unpacked) {
    const ww = [];
    for (const w in unpacked[p]) {
      ww.push(unpacked[p][w]);
    }
    const k = "processName";
    unpacked2.push({
      [k]: value<string>(ww, k),
      windows: ww
    });
  }
  fs.writeFileSync("output.json", JSON.stringify(unpacked2, null, 2));
  return unpacked2;
}
