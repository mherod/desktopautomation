import { exec } from "child_process";

async function execute(
  //language=AppleScript
  command: string | string[]
): Promise<string> {
  const command1 = Array.isArray(command) ? Array.from(command).join("\n") : command;
  return new Promise((resolve, reject) => {
    const escaped = command1 //
      .replace(/--[^\n]+/ig, ``) // comments
      .trim();
    const command0 = `osascript -e '${escaped}'`;
    exec(command0, (
      err,
      stdout,
      stderr
      //
    ) => {
      if (err) {
        reject(err);
        return;
      }
      if (stderr) {
        reject(stderr);
        return;
      }
      if (stdout) {
        resolve(stdout);
      }
    });
  });
}

export default {
  name: "osascript",
  description: "Run an AppleScript command",
  execute,
};
