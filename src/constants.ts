export const MATCHMAKER_IP = '192.168.11.11';
export const DEFAULT_LISTEN_PORT = 80;

export const STATE = {
  UNDEFINED: 'undefined',
  READY: 'ready',
  RUNNING: 'running',
  GOAL: 'goal',
} as const;

export type STATE = (typeof STATE)[keyof typeof STATE];
