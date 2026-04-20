type LogLevel = "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  action?: string
  duration?: number
  success?: boolean
  error?: string
  [key: string]: unknown
}

function log(entry: LogEntry) {
  const output = JSON.stringify({ ts: new Date().toISOString(), ...entry })
  if (entry.level === "error") {
    process.stderr.write(output + "\n")
  } else {
    process.stdout.write(output + "\n")
  }
}

export const logger = {
  info: (entry: Omit<LogEntry, "level">) => log({ level: "info", ...entry }),
  warn: (entry: Omit<LogEntry, "level">) => log({ level: "warn", ...entry }),
  error: (entry: Omit<LogEntry, "level">) => log({ level: "error", ...entry }),
}
