import { TestBed } from '@angular/core/testing';

import type { PersistedPomodoroState } from './pomodoro-state';
import { PomodoroPersistenceService } from './pomodoro-persistence.service';

describe('PomodoroPersistenceService', () => {
  let service: PomodoroPersistenceService;
  const validState: PersistedPomodoroState = {
    mode: 'relax',
    workTime: 25 * 60,
    breakTime: 5 * 60,
    customWorkTime: 25 * 60,
    customBreakTime: 5 * 60,
    timeLeft: 12 * 60,
    isWorkTime: true,
    isRunning: true,
    deadlineMs: 10_000,
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PomodoroPersistenceService);
  });

  it('should save and restore a valid state', () => {
    expect(service.save(validState)).toBeTrue();
    expect(service.load()).toEqual(validState);
  });

  it('should discard malformed JSON', () => {
    localStorage.setItem('pomodoro-state-v1', '{invalid');

    expect(service.load()).toBeUndefined();
  });

  it('should discard an invalid running state without a deadline', () => {
    const invalidState = { ...validState, deadlineMs: undefined };
    localStorage.setItem('pomodoro-state-v1', JSON.stringify(invalidState));

    expect(service.load()).toBeUndefined();
    expect(localStorage.getItem('pomodoro-state-v1')).toBeNull();
  });

  it('should accept a paused state without a deadline', () => {
    const pausedState = { ...validState, isRunning: false, deadlineMs: undefined };

    service.save(pausedState);

    expect(service.load()).toEqual({
      mode: pausedState.mode,
      workTime: pausedState.workTime,
      breakTime: pausedState.breakTime,
      customWorkTime: pausedState.customWorkTime,
      customBreakTime: pausedState.customBreakTime,
      timeLeft: pausedState.timeLeft,
      isWorkTime: pausedState.isWorkTime,
      isRunning: false,
    });
  });
});
