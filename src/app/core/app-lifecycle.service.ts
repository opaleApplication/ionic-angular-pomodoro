import { DestroyRef, Injectable, inject } from '@angular/core';

import { CapacitorAppPlugin } from './capacitor-plugins.service';
import { CapacitorPlatformService } from './capacitor-platform.service';

@Injectable({ providedIn: 'root' })
export class AppLifecycleService {
  private readonly app = inject(CapacitorAppPlugin);
  private readonly platform = inject(CapacitorPlatformService);

  async synchronizeOnNativeResume(callback: () => void, destroyRef: DestroyRef): Promise<void> {
    if (!this.platform.isNative()) {
      return;
    }

    const listener = await this.app.addStateChangeListener(({ isActive }) => {
      if (isActive) {
        callback();
      }
    });

    if (destroyRef.destroyed) {
      await listener.remove();
      return;
    }

    destroyRef.onDestroy(() => {
      void listener.remove();
    });
  }
}
