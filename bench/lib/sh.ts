import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

export function run(cmd: string, args: string[], opts: { cwd?: string } = {}): string {
  try {
    return execFileSync(cmd, args, { cwd: opts.cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28, timeout: 180_000 });
  } catch (e) {
    const err = e as { stderr?: string; message: string };
    throw new Error(`${cmd} ${args.join(" ")} failed: ${err.stderr?.trim() || err.message}`);
  }
}

export function soffice(): string {
  const mac = "/Applications/LibreOffice.app/Contents/MacOS/soffice";
  return process.env.SOFFICE ?? (existsSync(mac) ? mac : "soffice");
}
