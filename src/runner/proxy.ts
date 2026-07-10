import spawn from "cross-spawn"

const FORWARDED_SIGNALS = ["SIGINT", "SIGTERM", "SIGHUP"] as const

/**
 * Executes a target command as a transparent child process.
 * Inherits standard I/O to maintain terminal interactivity,
 * forwards system signals, and propagates the exit code to the parent shell.
 *
 * @param command - Executable name or binary path.
 * @param args - Arguments list to pass to the executable.
 */
export function launchProcess(command: string, args: string[]): void {
  const child = spawn(command, args, { stdio: "inherit" })

  for (const signal of FORWARDED_SIGNALS) {
    process.on(signal, () => {
      // Prevent spawning zombie processes by ensuring child receives the signal
      // to terminate cleanly before the parent process exits.
      if (!child.killed) {
        child.kill(signal)
      }
    })
  }

  child.on("close", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
    } else {
      process.exit(code ?? 1)
    }
  })
}
