export type LogLevel = 'info' | 'warn' | 'error';

type LogPayload = Record<string, unknown>;

export function logEdgeEvent(level: LogLevel, payload: LogPayload): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    ...payload,
  });

  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}
