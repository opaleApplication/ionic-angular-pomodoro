import { Component, DestroyRef, HostListener, OnInit, computed, inject, signal } from '@angular/core';

import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCol,
  IonGrid,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonProgressBar,
  IonRow,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import { add, pause, play, removeOutline, stop } from 'ionicons/icons';

import { I18nService } from '../../core/i18n.service';
import { AppLifecycleService } from '../../core/app-lifecycle.service';
import { PomodoroAudioService } from '../../core/pomodoro-audio.service';
import { PomodoroNotificationService } from '../../core/pomodoro-notification.service';
import { PomodoroPersistenceService } from '../../core/pomodoro-persistence.service';
import type {
  PersistedPomodoroState,
  PomodoroMode,
  SessionPhase,
} from '../../core/pomodoro-state';

type TomatoLayerKey = 'green' | 'yellow' | 'red';

@Component({
  selector: 'app-pomodoro',
  templateUrl: './pomodoro.component.html',
  styleUrls: ['./pomodoro.component.scss'],
  imports: [
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCol,
    IonGrid,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonProgressBar,
    IonRow,
    IonSegment,
    IonSegmentButton,
  ],
  standalone: true,
})
export class PomodoroComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly modes: readonly PomodoroMode[] = ['focus', 'relax', 'custom'];
  readonly customPhases: readonly SessionPhase[] = ['work', 'break'];
  readonly tomatoLayers = [
    { key: 'green' as const, src: 'assets/tomato-green.png' },
    { key: 'yellow' as const, src: 'assets/tomato-yellow.png' },
    { key: 'red' as const, src: 'assets/tomato.png' },
  ];

  readonly workTime = signal(25 * 60);
  readonly breakTime = signal(5 * 60);
  readonly timeLeft = signal(this.workTime());
  readonly isWorkTime = signal(true);
  readonly isRunning = signal(false);
  readonly currentMode = signal<PomodoroMode>('relax');
  readonly isCustomMode = computed(() => this.currentMode() === 'custom');

  private readonly minute = 60;
  private readonly destroyRef = inject(DestroyRef);
  private readonly appLifecycle = inject(AppLifecycleService);
  private readonly audio = inject(PomodoroAudioService);
  private readonly notifications = inject(PomodoroNotificationService);
  private readonly persistence = inject(PomodoroPersistenceService);
  private readonly presets: Record<Exclude<PomodoroMode, 'custom'>, { work: number; break: number }> = {
    focus: { work: 50 * 60, break: 10 * 60 },
    relax: { work: 25 * 60, break: 5 * 60 },
  };

  private interval: ReturnType<typeof setInterval> | undefined;
  private deadlineMs: number | undefined;
  private customWorkTime = this.workTime();
  private customBreakTime = this.breakTime();

  constructor() {
    addIcons({ add, play, pause, stop, removeOutline });
    this.restoreState();
    this.preloadSounds();
    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  ngOnInit(): void {
    void this.appLifecycle.synchronizeOnNativeResume(
      () => this.syncCountdown(),
      this.destroyRef,
    );

    if (this.isRunning()) {
      this.syncCountdown();
      this.startCountdownInterval();
      void this.scheduleDeadlineNotification(false);
    }
  }

  @HostListener('document:visibilitychange')
  protected onVisibilityChange(): void {
    if (!document.hidden) {
      this.syncCountdown();
    }
  }

  get appTitle(): string {
    return this.i18n.t('app.title');
  }

  get minuteUnit(): string {
    return this.i18n.t('common.minuteUnit');
  }

  get progressValue(): number {
    const totalDuration = this.getDurationForCurrentPhase();
    if (totalDuration <= 0) {
      return 0;
    }

    return Math.min(1, Math.max(0, 1 - this.timeLeft() / totalDuration));
  }

  get canReset(): boolean {
    return this.isRunning() || this.timeLeft() !== this.getDurationForCurrentPhase();
  }

  get greenTomatoOpacity(): number {
    return this.clamp(1 - this.progressValue * 2);
  }

  get yellowTomatoOpacity(): number {
    return this.clamp(1 - Math.abs(this.progressValue - 0.5) / 0.5);
  }

  get redTomatoOpacity(): number {
    return this.clamp((this.progressValue - 0.5) * 2);
  }

  get shouldBlink(): boolean {
    return this.isRunning() && this.timeLeft() > 0 && this.timeLeft() <= 10;
  }

  get blinkDuration(): string {
    if (!this.shouldBlink) {
      return '0s';
    }

    const ratio = this.clamp(this.timeLeft() / 10);
    const duration = 0.18 + ratio;
    return `${duration.toFixed(2)}s`;
  }

  selectMode(mode: PomodoroMode): void {
    this.currentMode.set(mode);

    if (mode === 'custom') {
      this.workTime.set(this.customWorkTime);
      this.breakTime.set(this.customBreakTime);
    } else {
      const preset = this.presets[mode];
      this.workTime.set(preset.work);
      this.breakTime.set(preset.break);
    }

    this.resetToWorkSession();
  }

  preloadSounds(): void {
    void this.audio.preload().then(loaded => {
      if (!loaded) {
        console.warn(this.i18n.t('pomodoro.audio.preloadError'));
      }
    });
  }

  startTimer(): void {
    if (this.isRunning()) {
      return;
    }

    this.registerUserInteraction();
    this.deadlineMs = Date.now() + this.timeLeft() * 1000;
    this.isRunning.set(true);
    this.startCountdownInterval();
    this.persistState();
    void this.scheduleDeadlineNotification(true);
  }

  pauseTimer(): void {
    if (!this.isRunning()) {
      return;
    }

    this.syncCountdown();
    this.isRunning.set(false);
    this.clearTimer();
    this.persistState();
    void this.cancelDeadlineNotification();
  }

  stopTimer(): void {
    this.isRunning.set(false);
    this.clearTimer();
    this.timeLeft.set(this.getDurationForCurrentPhase());
    this.persistState();
    void this.cancelDeadlineNotification();
  }

  toggleTimer(): void {
    const shouldResume = this.isRunning();

    this.clearTimer();
    this.isRunning.set(false);
    this.isWorkTime.update(isWorkTime => !isWorkTime);
    this.timeLeft.set(this.getDurationForCurrentPhase());
    void this.cancelDeadlineNotification();

    if (!this.isWorkTime()) {
      this.playSound('work_sound');
    }

    if (shouldResume) {
      this.startTimer();
    } else {
      this.persistState();
    }
  }

  playSound(assetId: string): void {
    void this.audio.play(assetId).then(result => {
      if (result === 'interaction-required') {
        console.warn(this.i18n.t('pomodoro.audio.interactionRequired'));
      } else if (result === 'failed') {
        console.warn(this.i18n.t('pomodoro.audio.playError'));
      }
    });
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getModeLabel(mode: PomodoroMode): string {
    return this.i18n.t(`pomodoro.mode.${mode}`);
  }

  getPhaseLabel(phase: SessionPhase): string {
    return this.i18n.t(`pomodoro.phase.${phase}`);
  }

  getSettingHint(phase: SessionPhase): string {
    return this.i18n.t(`pomodoro.custom.${phase}.hint`);
  }

  getDurationMinutes(phase: SessionPhase): number {
    return this.getPhaseDuration(phase) / this.minute;
  }

  getDurationAriaLabel(action: 'increase' | 'decrease', phase: SessionPhase): string {
    return this.i18n.t(`pomodoro.a11y.${action}.${phase}`);
  }

  getTomatoOpacity(layer: TomatoLayerKey): number {
    switch (layer) {
      case 'green':
        return this.greenTomatoOpacity;
      case 'yellow':
        return this.yellowTomatoOpacity;
      case 'red':
        return this.redTomatoOpacity;
    }
  }

  increaseDuration(phase: SessionPhase): void {
    this.updateCustomDuration(phase, this.minute);
  }

  decreaseDuration(phase: SessionPhase): void {
    this.updateCustomDuration(phase, -this.minute);
  }

  onSegmentChange(event: CustomEvent<{ value?: string | number | null }>): void {
    const selectedMode = event.detail.value;
    if (typeof selectedMode === 'string' && this.isPomodoroMode(selectedMode)) {
      this.selectMode(selectedMode);
    }
  }

  private resetToWorkSession(): void {
    this.isRunning.set(false);
    this.clearTimer();
    this.isWorkTime.set(true);
    this.timeLeft.set(this.workTime());
    this.persistState();
    void this.cancelDeadlineNotification();
  }

  private getPhaseDuration(phase: SessionPhase): number {
    return phase === 'work' ? this.workTime() : this.breakTime();
  }

  private updateCustomDuration(phase: SessionPhase, delta: number): void {
    if (this.isRunning()) {
      this.syncCountdown();
    }

    const currentDuration = phase === 'work' ? this.customWorkTime : this.customBreakTime;
    const nextDuration = Math.max(this.minute, currentDuration + delta);

    if (nextDuration === currentDuration) {
      return;
    }

    if (phase === 'work') {
      this.customWorkTime = nextDuration;
      this.workTime.set(nextDuration);
    } else {
      this.customBreakTime = nextDuration;
      this.breakTime.set(nextDuration);
    }

    const isCurrentPhase = (phase === 'work') === this.isWorkTime();
    if (!isCurrentPhase) {
      this.persistState();
      return;
    }

    if (!this.isRunning()) {
      this.timeLeft.set(nextDuration);
      this.persistState();
      return;
    }

    if (this.timeLeft() > nextDuration) {
      this.timeLeft.set(nextDuration);
    }

    this.deadlineMs = Date.now() + this.timeLeft() * 1000;
    this.persistState();
    void this.scheduleDeadlineNotification(false);
  }

  private getDurationForCurrentPhase(): number {
    return this.isWorkTime() ? this.workTime() : this.breakTime();
  }

  private isPomodoroMode(value: string | undefined): value is PomodoroMode {
    return value === 'focus' || value === 'relax' || value === 'custom';
  }

  private clearTimer(): void {
    if (this.interval !== undefined) {
      clearInterval(this.interval);
      this.interval = undefined;
    }

    this.deadlineMs = undefined;
  }

  private startCountdownInterval(): void {
    if (this.interval !== undefined) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      this.syncCountdown();
    }, 250);
  }

  private registerUserInteraction(): void {
    this.audio.registerUserInteraction();
  }

  private syncCountdown(): void {
    if (!this.isRunning() || this.deadlineMs === undefined) {
      return;
    }

    const now = Date.now();
    if (now >= this.deadlineMs) {
      this.catchUpExpiredPhases(now);
    }

    const remaining = Math.max(0, Math.ceil((this.deadlineMs - now) / 1000));
    this.timeLeft.set(remaining);
  }

  private catchUpExpiredPhases(now: number): void {
    if (this.deadlineMs === undefined) {
      return;
    }

    const nextPhaseIsWork = !this.isWorkTime();
    const cycleDurationMs = (this.workTime() + this.breakTime()) * 1000;
    const elapsedAfterDeadlineMs = now - this.deadlineMs;
    const completedCycles = Math.floor(elapsedAfterDeadlineMs / cycleDurationMs);
    let phaseStartMs = this.deadlineMs + completedCycles * cycleDurationMs;
    let activePhaseIsWork = nextPhaseIsWork;
    let activePhaseDurationMs = this.getPhaseDuration(activePhaseIsWork ? 'work' : 'break') * 1000;

    if (now >= phaseStartMs + activePhaseDurationMs) {
      phaseStartMs += activePhaseDurationMs;
      activePhaseIsWork = !activePhaseIsWork;
      activePhaseDurationMs = this.getPhaseDuration(activePhaseIsWork ? 'work' : 'break') * 1000;
    }

    this.isWorkTime.set(activePhaseIsWork);
    this.deadlineMs = phaseStartMs + activePhaseDurationMs;
    this.persistState();
    void this.scheduleDeadlineNotification(false);

    if (!activePhaseIsWork) {
      this.playSound('work_sound');
    }
  }

  private async scheduleDeadlineNotification(requestPermission: boolean): Promise<void> {
    if (this.deadlineMs === undefined) {
      return;
    }

    const completedPhase: SessionPhase = this.isWorkTime() ? 'work' : 'break';
    const scheduled = await this.notifications.schedule({
      deadlineMs: this.deadlineMs,
      title: this.appTitle,
      body: this.i18n.t(`pomodoro.notification.${completedPhase}`),
      requestPermission,
    });
    if (!scheduled) {
      console.warn(this.i18n.t('pomodoro.notification.scheduleError'));
    }
  }

  private async cancelDeadlineNotification(): Promise<void> {
    const cancelled = await this.notifications.cancel();
    if (!cancelled) {
      console.warn(this.i18n.t('pomodoro.notification.cancelError'));
    }
  }

  private persistState(): void {
    const state: PersistedPomodoroState = {
      mode: this.currentMode(),
      workTime: this.workTime(),
      breakTime: this.breakTime(),
      customWorkTime: this.customWorkTime,
      customBreakTime: this.customBreakTime,
      timeLeft: this.timeLeft(),
      isWorkTime: this.isWorkTime(),
      isRunning: this.isRunning(),
      ...(this.deadlineMs === undefined ? {} : { deadlineMs: this.deadlineMs }),
    };

    if (!this.persistence.save(state)) {
      console.warn(this.i18n.t('pomodoro.persistence.saveError'));
    }
  }

  private restoreState(): void {
    const state = this.persistence.load();
    if (!state) {
      return;
    }

    this.currentMode.set(state.mode);
    this.workTime.set(state.workTime);
    this.breakTime.set(state.breakTime);
    this.customWorkTime = state.customWorkTime;
    this.customBreakTime = state.customBreakTime;
    this.timeLeft.set(state.timeLeft);
    this.isWorkTime.set(state.isWorkTime);
    this.isRunning.set(state.isRunning);
    this.deadlineMs = state.isRunning ? state.deadlineMs : undefined;
  }

  private clamp(value: number, min = 0, max = 1): number {
    return Math.min(max, Math.max(min, value));
  }
}
