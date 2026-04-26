const testTranslations: Record<string, string> = {
  'app.title': 'Pomodoro Timer',
  'common.minuteUnit': 'min',
  'pomodoro.mode.focus': 'Focus',
  'pomodoro.mode.relax': 'Relax',
  'pomodoro.mode.custom': 'Custom',
  'pomodoro.phase.work': 'Work',
  'pomodoro.phase.break': 'Break',
  'pomodoro.custom.work.hint': 'Focus duration',
  'pomodoro.custom.break.hint': 'Recovery between sessions',
  'pomodoro.a11y.decrease.work': 'Decrease work time',
  'pomodoro.a11y.increase.work': 'Increase work time',
  'pomodoro.a11y.decrease.break': 'Decrease break time',
  'pomodoro.a11y.increase.break': 'Increase break time',
  'pomodoro.a11y.start': 'Start timer',
  'pomodoro.a11y.pause': 'Pause timer',
  'pomodoro.a11y.stop': 'Reset timer',
  'pomodoro.note': 'Changing mode restarts a work session with the selected duration.',
  'pomodoro.audio.interactionRequired': 'The user must interact with the page before audio can play.',
  'pomodoro.audio.preloadError': 'The sound could not be preloaded:',
  'pomodoro.audio.playError': 'The sound could not be played:',
};

export const i18nTestingStub = {
  t: (key: string) => testTranslations[key] ?? key,
};
