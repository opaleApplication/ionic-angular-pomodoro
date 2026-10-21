export type PomodoroMode = 'focus' | 'relax' | 'custom';
export type SessionPhase = 'work' | 'break';

export interface PersistedPomodoroState {
  mode: PomodoroMode;
  workTime: number;
  breakTime: number;
  customWorkTime: number;
  customBreakTime: number;
  timeLeft: number;
  isWorkTime: boolean;
  isRunning: boolean;
  deadlineMs?: number;
}
