import pc from "picocolors"

/**
 * Structured logger utility utilizing picocolors for colored terminal output.
 * Ensures a consistent look and feel across CLI commands and status messages.
 */
export const log = {
  /**
   * Logs a successful operation message with a green tick prefix.
   */
  success: (msg: string) => console.log(`${pc.green("✓")} ${msg}`),
  /**
   * Logs an error message with a red cross prefix to stderr.
   */
  error: (msg: string) => console.error(`${pc.red("✗")} ${pc.red(msg)}`),
  /**
   * Logs a warning message with a yellow warning prefix.
   */
  warn: (msg: string) => console.warn(`${pc.yellow("⚠")} ${pc.yellow(msg)}`),
  /**
   * Logs an informational message with a blue info prefix.
   */
  info: (msg: string) => console.log(`${pc.blue("ℹ")} ${msg}`),
  /**
   * Logs a bold cyan section header.
   */
  header: (msg: string) => console.log(`\n${pc.bold(pc.cyan(msg))}\n`),
  /**
   * Logs an environment variable's configuration state with a status-appropriate color and prefix.
   *
   * @param key - The environment variable name.
   * @param status - The configuration state ('synced', 'missing', or 'unused').
   * @param val - Optional current value to display alongside synced keys.
   */
  variable: (key: string, status: "synced" | "missing" | "unused", val?: string) => {
    if (status === "synced") {
      console.log(`  ${pc.green("✓")} ${pc.bold(key)}=${pc.gray(val ?? "")}`)
    } else if (status === "missing") {
      console.log(`  ${pc.red("✗")} ${pc.bold(pc.red(key))} ${pc.dim("(missing)")}`)
    } else {
      console.log(`  ${pc.yellow("⚠")} ${pc.bold(pc.yellow(key))} ${pc.dim("(unused)")}`)
    }
  },
}
