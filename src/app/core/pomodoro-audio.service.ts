import { Injectable, inject } from '@angular/core';

import { NativeAudioPlugin } from './capacitor-plugins.service';

export type AudioPlaybackResult = 'played' | 'interaction-required' | 'failed';

@Injectable({ providedIn: 'root' })
export class PomodoroAudioService {
  private readonly nativeAudio = inject(NativeAudioPlugin);
  private preloadPromise: Promise<boolean> | undefined;
  private userInteracted = false;

  preload(): Promise<boolean> {
    this.preloadPromise ??= this.nativeAudio.preload({
      assetId: 'work_sound',
      assetPath: 'assets/sounds/work_sound.mp3',
      audioChannelNum: 1,
      isUrl: false,
    })
      .then(() => true)
      .catch((error: unknown) => {
        if (typeof error === 'string' && error.includes('AssetId already exists')) {
          return true;
        }

        return false;
      });

    return this.preloadPromise;
  }

  registerUserInteraction(): void {
    this.userInteracted = true;
    void this.preload();
  }

  async play(assetId: string): Promise<AudioPlaybackResult> {
    if (!this.userInteracted) {
      return 'interaction-required';
    }

    if (!await this.preload()) {
      return 'failed';
    }

    try {
      await this.nativeAudio.play({ assetId });
      return 'played';
    } catch {
      return 'failed';
    }
  }
}
