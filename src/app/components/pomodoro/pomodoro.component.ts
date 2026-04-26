import { Component, OnDestroy, OnInit, inject } from '@angular/core';

import { NativeAudio } from '@capgo/native-audio';

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
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { add, pause, play, removeOutline, stop } from 'ionicons/icons';

import { I18nService } from '../../core/i18n.service';

type PomodoroMode = 'focus' | 'relax' | 'custom';
type SessionPhase = 'work' | 'break';
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
export class PomodoroComponent implements OnInit, OnDestroy {
  readonly i18n = inject(I18nService);
  readonly modes: readonly PomodoroMode[] = ['focus', 'relax', 'custom'];
  readonly customPhases: readonly SessionPhase[] = ['work', 'break'];
  readonly tomatoLayers = [
    { key: 'green' as const, src: 'assets/tomato-green.png' },
    { key: 'yellow' as const, src: 'assets/tomato-yellow.png' },
    { key: 'red' as const, src: 'assets/tomato.png' },
  ];

  workTime = 25 * 60;
  breakTime = 5 * 60;
  timeLeft = this.workTime;
  isWorkTime = true;
  isRunning = false;
  userInteracted = false;
  currentMode: PomodoroMode = 'relax';
  isCustomMode = false;

  private readonly minute = 60;
  private readonly presets: Record<Exclude<PomodoroMode, 'custom'>, { work: number; break: number }> = {
    focus: { work: 50 * 60, break: 10 * 60 },
    relax: { work: 25 * 60, break: 5 * 60 },
  };

  private interval: ReturnType<typeof setInterval> | undefined;
  private soundsLoaded = false;
  private customWorkTime = this.workTime;
  private customBreakTime = this.breakTime;
  private readonly handleFirstInteraction = () => {
    if (!this.soundsLoaded) {
      this.preloadSounds();
    }
    this.userInteracted = true;
  };

  constructor() {
    addIcons({ add, play, pause, stop, removeOutline });
    this.preloadSounds();
  }

  ngOnInit(): void {
    document.addEventListener('click', this.handleFirstInteraction, { once: true });
  }

  ngOnDestroy(): void {
    this.clearTimer();
    document.removeEventListener('click', this.handleFirstInteraction);
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

    return Math.min(1, Math.max(0, 1 - this.timeLeft / totalDuration));
  }

  get canReset(): boolean {
    return this.isRunning || this.timeLeft !== this.getDurationForCurrentPhase();
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
    return this.isRunning && this.timeLeft > 0 && this.timeLeft <= 10;
  }

  get blinkDuration(): string {
    if (!this.shouldBlink) {
      return '0s';
    }

    const ratio = this.clamp(this.timeLeft / 10);
    const duration = 0.18 + ratio;
    return `${duration.toFixed(2)}s`;
  }

  selectMode(mode: PomodoroMode): void {
    this.currentMode = mode;
    this.isCustomMode = mode === 'custom';

    if (mode === 'custom') {
      this.workTime = this.customWorkTime;
      this.breakTime = this.customBreakTime;
    } else {
      const preset = this.presets[mode];
      this.workTime = preset.work;
      this.breakTime = preset.break;
    }

    this.resetToWorkSession();
  }

  preloadSounds(): void {
    if (this.soundsLoaded) {
      return;
    }

    void NativeAudio.preload({
      assetId: 'work_sound',
      assetPath: 'assets/sounds/work_sound.mp3',
      audioChannelNum: 1,
      isUrl: false,
    })
      .then(() => {
        this.soundsLoaded = true;
      })
      .catch((error) => {
        if (typeof error === 'string' && error.includes('AssetId already exists')) {
          this.soundsLoaded = true;
          return;
        }

        console.warn(this.i18n.t('pomodoro.audio.preloadError'), error);
      });
  }

  startTimer(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.interval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        return;
      }

      this.toggleTimer();
    }, 1000);
  }

  pauseTimer(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.clearTimer();
  }

  stopTimer(): void {
    this.isRunning = false;
    this.clearTimer();
    this.timeLeft = this.getDurationForCurrentPhase();
  }

  toggleTimer(): void {
    const shouldResume = this.isRunning;

    this.clearTimer();
    this.isRunning = false;
    this.isWorkTime = !this.isWorkTime;
    this.timeLeft = this.getDurationForCurrentPhase();

    if (!this.isWorkTime) {
      this.playSound('work_sound');
    }

    if (shouldResume) {
      this.startTimer();
    }
  }

  playSound(assetId: string): void {
    if (!this.userInteracted) {
      console.warn(this.i18n.t('pomodoro.audio.interactionRequired'));
      return;
    }

    void NativeAudio.play({ assetId }).catch((error) => {
      console.warn(this.i18n.t('pomodoro.audio.playError'), error);
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
    this.isRunning = false;
    this.clearTimer();
    this.isWorkTime = true;
    this.timeLeft = this.workTime;
  }

  private getPhaseDuration(phase: SessionPhase): number {
    return phase === 'work' ? this.workTime : this.breakTime;
  }

  private updateCustomDuration(phase: SessionPhase, delta: number): void {
    const currentDuration = phase === 'work' ? this.customWorkTime : this.customBreakTime;
    const nextDuration = Math.max(this.minute, currentDuration + delta);

    if (nextDuration === currentDuration) {
      return;
    }

    if (phase === 'work') {
      this.customWorkTime = nextDuration;
      this.workTime = nextDuration;
    } else {
      this.customBreakTime = nextDuration;
      this.breakTime = nextDuration;
    }

    const isCurrentPhase = (phase === 'work') === this.isWorkTime;
    if (!isCurrentPhase) {
      return;
    }

    if (!this.isRunning) {
      this.timeLeft = nextDuration;
      return;
    }

    if (this.timeLeft > nextDuration) {
      this.timeLeft = nextDuration;
    }
  }

  private getDurationForCurrentPhase(): number {
    return this.isWorkTime ? this.workTime : this.breakTime;
  }

  private isPomodoroMode(value: string | undefined): value is PomodoroMode {
    return value === 'focus' || value === 'relax' || value === 'custom';
  }

  private clearTimer(): void {
    if (!this.interval) {
      return;
    }

    clearInterval(this.interval);
    this.interval = undefined;
  }

  private clamp(value: number, min = 0, max = 1): number {
    return Math.min(max, Math.max(min, value));
  }
}
