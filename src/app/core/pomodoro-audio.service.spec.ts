import { TestBed } from '@angular/core/testing';

import { NativeAudioPlugin } from './capacitor-plugins.service';
import { PomodoroAudioService } from './pomodoro-audio.service';

describe('PomodoroAudioService', () => {
  let service: PomodoroAudioService;
  let nativeAudio: jasmine.SpyObj<NativeAudioPlugin>;

  beforeEach(() => {
    nativeAudio = jasmine.createSpyObj<NativeAudioPlugin>('NativeAudioPlugin', ['play', 'preload']);
    TestBed.configureTestingModule({
      providers: [
        PomodoroAudioService,
        { provide: NativeAudioPlugin, useValue: nativeAudio },
      ],
    });
    service = TestBed.inject(PomodoroAudioService);
  });

  it('should preload the sound only once', async () => {
    nativeAudio.preload.and.returnValue(Promise.resolve());

    expect(await service.preload()).toBeTrue();
    expect(await service.preload()).toBeTrue();
    expect(nativeAudio.preload).toHaveBeenCalledTimes(1);
  });

  it('should require a user interaction before playback', async () => {
    expect(await service.play('work_sound')).toBe('interaction-required');
    expect(nativeAudio.play).not.toHaveBeenCalled();
  });

  it('should play after a user interaction', async () => {
    nativeAudio.preload.and.returnValue(Promise.resolve());
    nativeAudio.play.and.returnValue(Promise.resolve());
    service.registerUserInteraction();

    expect(await service.play('work_sound')).toBe('played');
    expect(nativeAudio.play).toHaveBeenCalledWith({ assetId: 'work_sound' });
  });

  it('should report plugin failures without rejecting', async () => {
    nativeAudio.preload.and.returnValue(Promise.reject(new Error('unavailable')));
    service.registerUserInteraction();

    expect(await service.play('work_sound')).toBe('failed');
  });
});
