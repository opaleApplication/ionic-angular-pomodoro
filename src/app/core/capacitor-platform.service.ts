import { Injectable } from '@angular/core';

import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class CapacitorPlatformService {
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }
}
