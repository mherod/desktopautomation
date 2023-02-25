import osascript from "./osascript";
import { value } from "./value";
import { DesktopProcess } from "./DesktopProcessWindows";

export async function getDesktop(): Promise<DesktopProcess[]> {
  const out = await osascript.execute(
    //language=AppleScript
    `
set myOutput to {}
set i to 0
try
  tell application "System Events"
    set myProcesses to (processes whose background only = false)
    set p to 0
    repeat with myProcess in myProcesses
      set p to p + 1
      set w to 0
      repeat with myWindow in (windows of myProcess)
        set w to w + 1
        try
          set myProcessName to name of myProcess
          set myWindowName to name of myWindow
          set myWindowSize to size of myWindow
          set myWindowPosition to position of myWindow
          set i to i + 1
          set myOutput to {myOutput, {"i=" & i}, {"p=" & p}, {"w=" & w}, {{"processName=" & myProcessName}, {"windowName=" & myWindowName}, {"windowSize=", {myWindowSize}}, {"windowPosition=", {myWindowPosition}}}}
        end try
       end repeat
    end repeat
  end tell
  on error errStr number errNum
end try
copy myOutput to stdout
`
    //
  );

  const unpacked = {};
  if (typeof out === "string") {
    const lines = out.split(/(?!:\w),\s/ig);
    const keys = { i: null, p: null, w: null };
    let lastKey = null;
    for (const line of lines) {
      const splits = line.split(/=,?/, 2).filter(Boolean);
      if (splits.length) {
        const firstSplit = splits[0].trim();
        if (line.endsWith("=")) {
          lastKey = firstSplit;
          continue;
        }
        if (splits.length > 1) {
          const key = firstSplit;
          const secondSplit = splits[1].trim();
          if (key in keys) {
            keys[key] = secondSplit;
          } else {
            const { p, w } = keys;
            unpacked[p] = unpacked[p] || {};
            unpacked[p][w] = unpacked[p][w] || {};
            unpacked[p][w][key] = secondSplit;
          }
        } else {
          const { p, w } = keys;
          unpacked[p] = unpacked[p] || {};
          unpacked[p][w] = unpacked[p][w] || {};
          if (!!unpacked[p][w][lastKey]) {
            unpacked[p][w][lastKey] = [unpacked[p][w][lastKey], firstSplit];
          } else {
            unpacked[p][w][lastKey] = firstSplit;
          }
        }
      }
    }
  }

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

  return unpacked2;
}
