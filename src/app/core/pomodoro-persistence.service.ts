import { Injectable } from '@angular/core';

import type { PersistedPomodoroState, PomodoroMode } from './pomodoro-state';

@Injectable({ providedIn: 'root' })
export class PomodoroPersistenceService {
  private readonly storageKey = 'pomodoro-state-v1';
  private readonly minimumDuration = 60;

  load(): PersistedPomodoroState | undefined {
    try {
      const storedState = localStorage.getItem(this.storageKey);
      if (!storedState) {
        return undefined;
      }

      const state = JSON.parse(storedState) as Partial<PersistedPomodoroState>;
      if (!this.isValidState(state)) {
        localStorage.removeItem(this.storageKey);
        return undefined;
      }

      return state;
    } catch {
      return undefined;
    }
  }

  save(state: PersistedPomodoroState): boolean {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
  }

  private isValidState(state: Partial<PersistedPomodoroState>): state is PersistedPomodoroState {
    return (
      this.isPomodoroMode(state.mode) &&
      this.isValidDuration(state.workTime) &&
      this.isValidDuration(state.breakTime) &&
      this.isValidDuration(state.customWorkTime) &&
      this.isValidDuration(state.customBreakTime) &&
      this.isValidTimeLeft(state.timeLeft) &&
      typeof state.isWorkTime === 'boolean' &&
      typeof state.isRunning === 'boolean' &&
      (!state.isRunning || this.isValidDeadline(state.deadlineMs))
    );
  }

  private isPomodoroMode(value: unknown): value is PomodoroMode {
    return value === 'focus' || value === 'relax' || value === 'custom';
  }

  private isValidDuration(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= this.minimumDuration;
  }

  private isValidTimeLeft(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
  }

  private isValidDeadline(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  }
}
