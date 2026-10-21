import { Injectable } from '@angular/core';

import { App, type AppState } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { NativeAudio } from '@capgo/capacitor-native-audio';

@Injectable({ providedIn: 'root' })
export class CapacitorAppPlugin {
  addStateChangeListener(callback: (state: AppState) => void) {
    return App.addListener('appStateChange', callback);
  }
}

@Injectable({ providedIn: 'root' })
export class LocalNotificationsPlugin {
  checkPermissions() {
    return LocalNotifications.checkPermissions();
  }

  requestPermissions() {
    return LocalNotifications.requestPermissions();
  }

  schedule(options: Parameters<typeof LocalNotifications.schedule>[0]) {
    return LocalNotifications.schedule(options);
  }

  cancel(options: Parameters<typeof LocalNotifications.cancel>[0]) {
    return LocalNotifications.cancel(options);
  }
}

@Injectable({ providedIn: 'root' })
export class NativeAudioPlugin {
  preload(options: Parameters<typeof NativeAudio.preload>[0]) {
    return NativeAudio.preload(options);
  }

  play(options: Parameters<typeof NativeAudio.play>[0]) {
    return NativeAudio.play(options);
  }
}
