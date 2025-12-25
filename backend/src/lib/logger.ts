import pino from "pino";
// we import env instead of process.env because of type safety and also default value injection
import { env } from "../config/env.js";

const devTransport = {
  // pino pretty transport for human readable output
  target: "pino-pretty",
  options: {
    colorize: true,
    translateTime: "SYS:standard",
    ignore: "pid,hostname",
  },
};

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  // for production, there is no transport, so the output is newline-delimited JSON (NDJSON)
  // faster than pretty-printing
  ...(env.NODE_ENV === "development" && { transport: devTransport }),
});

export type Logger = typeof logger;

// pino logging scope
// trace → debug → info → warn → error → fatal
// the level that we choose, Pino would log that level and above

// by default Pino wrote to stdout, not filesystem, not database
