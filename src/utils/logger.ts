/**
 * Minimal logger so error handlers and OAuth never hit undefined.error.
 * Extend with real transport (e.g. pino, winston) as needed.
 */
function log(level: string, message: string, err?: Error | undefined): void {
  const prefix = `[${level}]`;
  if (err instanceof Error) {
    console.error(prefix, message, err.message, err.stack);
  } else {
    console.error(prefix, message);
  }
}

export const logger = {
  error: (message: string, err?: Error | undefined) => log('ERROR', message, err),
  auth: (_message: string, ..._rest: unknown[]) => { /* no-op unless needed */ },
  authError: (_msg: string, _detail?: string, _detail2?: string) => { /* no-op unless needed */ },
  info: (_message: string, _meta?: unknown) => { /* no-op unless needed */ },
};
