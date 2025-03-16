import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonModule } from '@angular/common';

import { NativeAudio } from '@capgo/native-audio';

import { IonicModule } from '@ionic/angular';

import { PomodoroComponent } from './pomodoro.component';

class MockNativeAudio {
  /**
   * Mocked version of NativeAudio.preload() that simply logs a message
   * when called and resolves the promise immediately.
   * @returns {Promise<void>} - Resolves immediately.
   */
  preload() {
    console.log('Mock preload called');
    return Promise.resolve();
  }

  /**
   * Mocked version of NativeAudio.play().
   * Simply logs a message when called and resolves the promise immediately.
   * @returns {Promise<void>}
   */
  play() {
    console.log('Mock play called');
    return Promise.resolve();
  }
}

describe('PomodoroComponent', () => {
  let component: PomodoroComponent;
  let fixture: ComponentFixture<PomodoroComponent>;

  beforeEach(waitForAsync(() => {
    console.log('BeforeEach: Setting up test module');
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), CommonModule],
      providers: [{ provide: NativeAudio, useClass: MockNativeAudio }]
    }).compileComponents();

    fixture = TestBed.createComponent(PomodoroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    console.log('Test: should create');
    expect(component).toBeTruthy();
  });

  it('should initialize with default work and break times', () => {
    console.log('Test: should initialize with default work and break times');
    expect(component.workTime).toBe(25 * 60);
    expect(component.breakTime).toBe(5 * 60);
  });

  it('should start the timer when startTimer is called', () => {
    console.log('Test: should start the timer when startTimer is called');
    jasmine.clock().install();
    component.startTimer();
    expect(component.isRunning).toBeTrue();
    jasmine.clock().tick(1000);
    expect(component.timeLeft).toBe(component.workTime - 1);
    jasmine.clock().uninstall();
  });

  it('should pause the timer when pauseTimer is called', () => {
    console.log('Test: should pause the timer when pauseTimer is called');
    component.startTimer();
    component.pauseTimer();
    expect(component.isRunning).toBeFalse();
  });

  it('should stop the timer when stopTimer is called', () => {
    console.log('Test: should stop the timer when stopTimer is called');
    component.startTimer();
    component.stopTimer();
    expect(component.isRunning).toBeFalse();
    expect(component.timeLeft).toBe(component.workTime);
  });

  it('should toggle between work and break times', () => {
    console.log('Test: should toggle between work and break times');
    component.timeLeft = 0;
    component.toggleTimer();
    expect(component.timeLeft).toBe(component.breakTime);
    expect(component.isWorkTime).toBeFalse();
    component.toggleTimer();
    expect(component.timeLeft).toBe(component.workTime);
    expect(component.isWorkTime).toBeTrue();
  });
});

afterEach(async () => {
  try {
    await NativeAudio.unload({ assetId: 'work_sound' });
  } catch (error) {
    console.warn('Erreur lors du déchargement du son (peut être déjà supprimé) :', error);
  }
});