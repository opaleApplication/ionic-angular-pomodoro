import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { NativeAudio } from '@capgo/native-audio';

import { IonicModule } from '@ionic/angular';

import { I18nService } from '../../core/i18n.service';
import { i18nTestingStub } from '../../../testing/i18n-test.stub';
import { PomodoroComponent } from './pomodoro.component';

describe('PomodoroComponent', () => {
  let component: PomodoroComponent;
  let fixture: ComponentFixture<PomodoroComponent>;

  beforeEach(async () => {
    spyOn(NativeAudio, 'preload').and.returnValue(Promise.resolve());
    spyOn(NativeAudio, 'play').and.returnValue(Promise.resolve());
    spyOn(console, 'warn');

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), PomodoroComponent],
      providers: [{ provide: I18nService, useValue: i18nTestingStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(PomodoroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default work and break times', () => {
    expect(component.workTime).toBe(25 * 60);
    expect(component.breakTime).toBe(5 * 60);
    expect(component.timeLeft).toBe(component.workTime);
  });

  it('should expose translated helpers', () => {
    expect(component.appTitle).toBe('Pomodoro Timer');
    expect(component.minuteUnit).toBe('min');
    expect(component.getModeLabel('relax')).toBe('Relax');
    expect(component.getPhaseLabel('work')).toBe('Work');
  });

  it('should start the timer when startTimer is called', fakeAsync(() => {
    component.startTimer();

    expect(component.isRunning).toBeTrue();

    tick(1000);

    expect(component.timeLeft).toBe(component.workTime - 1);
  }));

  it('should pause the timer when pauseTimer is called', () => {
    component.startTimer();

    component.pauseTimer();

    expect(component.isRunning).toBeFalse();
  });

  it('should reset to the current session duration when stopTimer is called', () => {
    component.startTimer();
    component.pauseTimer();
    component.timeLeft = component.workTime - 42;

    component.stopTimer();

    expect(component.isRunning).toBeFalse();
    expect(component.timeLeft).toBe(component.workTime);
  });

  it('should use the custom break duration when toggling from work to break', () => {
    component.selectMode('custom');
    component.increaseDuration('break');
    component.increaseDuration('break');

    component.toggleTimer();

    expect(component.isWorkTime).toBeFalse();
    expect(component.breakTime).toBe(7 * 60);
    expect(component.timeLeft).toBe(7 * 60);
    expect(component.isRunning).toBeFalse();
  });

  it('should continue running with the custom break duration when the work session ends', fakeAsync(() => {
    component.selectMode('custom');
    component.increaseDuration('break');
    component.increaseDuration('break');
    component.startTimer();
    component.timeLeft = 0;

    tick(1000);

    expect(component.isWorkTime).toBeFalse();
    expect(component.breakTime).toBe(7 * 60);
    expect(component.timeLeft).toBe(7 * 60);
    expect(component.isRunning).toBeTrue();
  }));

  it('should reset to a work session when switching modes during a break', () => {
    component.toggleTimer();
    expect(component.isWorkTime).toBeFalse();

    component.selectMode('custom');

    expect(component.isRunning).toBeFalse();
    expect(component.isWorkTime).toBeTrue();
    expect(component.timeLeft).toBe(component.workTime);
  });

  it('should preserve custom durations when leaving and returning to custom mode', () => {
    component.selectMode('custom');
    component.increaseDuration('work');
    component.increaseDuration('break');

    component.selectMode('focus');
    component.selectMode('custom');

    expect(component.workTime).toBe(26 * 60);
    expect(component.breakTime).toBe(6 * 60);
    expect(component.timeLeft).toBe(component.workTime);
  });

  it('should render translated custom settings with Ionic items when custom mode is selected', () => {
    component.selectMode('custom');
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.custom-settings ion-item');
    const content = fixture.nativeElement.textContent;

    expect(items.length).toBe(2);
    expect(content).toContain('Custom');
    expect(content).toContain('Work');
    expect(content).toContain('Break');
    expect(content).toContain('Focus duration');
    expect(content).toContain('Recovery between sessions');
  });

  it('should expose translated aria labels for custom duration controls', () => {
    expect(component.getDurationAriaLabel('decrease', 'work')).toBe('Decrease work time');
    expect(component.getDurationAriaLabel('increase', 'work')).toBe('Increase work time');
    expect(component.getDurationAriaLabel('decrease', 'break')).toBe('Decrease break time');
    expect(component.getDurationAriaLabel('increase', 'break')).toBe('Increase break time');
  });

  it('should render the project tomato layers', () => {
    const layers = Array.from(fixture.nativeElement.querySelectorAll('.tomato-layer')) as HTMLImageElement[];
    const srcs = layers.map((layer) => layer.getAttribute('src'));

    expect(srcs).toEqual([
      'assets/tomato-green.png',
      'assets/tomato-yellow.png',
      'assets/tomato.png',
    ]);
  });

  it('should start with a green tomato and blink faster in the last ten seconds', () => {
    expect(component.getTomatoOpacity('green')).toBe(1);
    expect(component.getTomatoOpacity('yellow')).toBe(0);
    expect(component.getTomatoOpacity('red')).toBe(0);
    expect(component.shouldBlink).toBeFalse();

    component.isRunning = true;
    component.timeLeft = 10;
    const slowBlink = parseFloat(component.blinkDuration);

    component.timeLeft = 2;
    const fastBlink = parseFloat(component.blinkDuration);

    expect(component.shouldBlink).toBeTrue();
    expect(fastBlink).toBeLessThan(slowBlink);
  });

  it('should render Ionic neon controls and translated segment labels without old hardcoded text', () => {
    const card = fixture.nativeElement.querySelector('ion-card');
    const segment = fixture.nativeElement.querySelector('ion-segment');
    const segmentButtons = Array.from(
      fixture.nativeElement.querySelectorAll('ion-segment-button'),
    ) as HTMLElement[];
    const progress = fixture.nativeElement.querySelector('ion-progress-bar');
    const controls = Array.from(fixture.nativeElement.querySelectorAll('.controls-row ion-button')) as HTMLElement[];
    const content = fixture.nativeElement.textContent;

    expect(card).not.toBeNull();
    expect(segment?.getAttribute('color')).toBe('secondary');
    expect(segment?.getAttribute('mode')).toBe('md');
    expect(segmentButtons.length).toBe(3);
    expect(segmentButtons.every((button) => button.getAttribute('color') === 'secondary')).toBeTrue();
    expect(segmentButtons.every((button) => button.getAttribute('mode') === 'md')).toBeTrue();
    expect(progress).not.toBeNull();
    expect(controls.length).toBe(3);
    expect(controls[0].classList.contains('neon-control')).toBeTrue();
    expect(controls[0].classList.contains('neon-control--play')).toBeTrue();
    expect(controls[0].getAttribute('fill')).toBe('outline');
    expect(controls[1].classList.contains('neon-control--pause')).toBeTrue();
    expect(controls[2].classList.contains('neon-control--stop')).toBeTrue();
    expect(content).toContain('Focus');
    expect(content).toContain('Relax');
    expect(content).toContain('Custom');
    expect(content).not.toContain('Mode Focus');
    expect(content).not.toContain('Mode Relaxe');
  });

  it('should render neon outline custom steppers in custom mode', () => {
    component.selectMode('custom');
    fixture.detectChanges();

    const steppers = Array.from(
      fixture.nativeElement.querySelectorAll('.custom-settings ion-button'),
    ) as HTMLElement[];

    expect(steppers.length).toBe(4);
    expect(steppers.every((stepper) => stepper.classList.contains('neon-stepper'))).toBeTrue();
    expect(steppers.every((stepper) => stepper.getAttribute('fill') === 'outline')).toBeTrue();
  });
});
