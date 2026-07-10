import spawn from 'cross-spawn';

// Signals that must be forwarded to the child process.
// Ensures that user interruptions (like Ctrl+C) clean up both the proxy and the target app.
const FORWARDED_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const;

/**
 * Executes a target command as a transparent child process.
 * Inherits standard I/O to maintain terminal interactivity,
 * forwards system signals, and propagates the exit code to the parent shell.
 * 
 * @param command - Executable name or binary path.
 * @param args - Arguments list to pass to the executable.
 */
export function launchProcess(command: string, args: string[]): void {
  const child = spawn(command, args, { stdio: 'inherit' });

  // Propagate key interruption signals down to the child process
  // to ensure child handles shutdown and does not become a zombie.
  for (const signal of FORWARDED_SIGNALS) {
    process.on(signal, () => {
      if (!child.killed) {
        child.kill(signal);
      }
    });
  }

  // Bubble child termination statuses back up to the parent shell.
  child.on('close', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 1);
    }
  });
}
