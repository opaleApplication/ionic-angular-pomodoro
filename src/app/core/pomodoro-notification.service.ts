import { Injectable, inject } from '@angular/core';

import { LocalNotificationsPlugin } from './capacitor-plugins.service';
import { CapacitorPlatformService } from './capacitor-platform.service';

export interface PomodoroNotification {
  deadlineMs: number;
  title: string;
  body: string;
  requestPermission: boolean;
}

@Injectable({ providedIn: 'root' })
export class PomodoroNotificationService {
  private readonly localNotifications = inject(LocalNotificationsPlugin);
  private readonly notificationId = 1;
  private readonly platform = inject(CapacitorPlatformService);
  private revision = 0;

  async schedule(notification: PomodoroNotification): Promise<boolean> {
    if (!this.platform.isNative()) {
      return true;
    }

    try {
      const revision = ++this.revision;
      await this.cancelNativeNotification();

      let permission = await this.localNotifications.checkPermissions();
      if (permission.display === 'prompt' && notification.requestPermission) {
        permission = await this.localNotifications.requestPermissions();
      }

      if (revision !== this.revision || permission.display !== 'granted') {
        return false;
      }

      await this.localNotifications.schedule({
        notifications: [{
          id: this.notificationId,
          title: notification.title,
          body: notification.body,
          schedule: { at: new Date(notification.deadlineMs), allowWhileIdle: true },
          sound: 'default',
        }],
      });
      return true;
    } catch {
      return false;
    }
  }

  async cancel(): Promise<boolean> {
    this.revision += 1;
    if (!this.platform.isNative()) {
      return true;
    }

    try {
      await this.cancelNativeNotification();
      return true;
    } catch {
      return false;
    }
  }

  private async cancelNativeNotification(): Promise<void> {
    await this.localNotifications.cancel({ notifications: [{ id: this.notificationId }] });
  }
}
