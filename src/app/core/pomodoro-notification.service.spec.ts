import { TestBed } from '@angular/core/testing';

import { LocalNotificationsPlugin } from './capacitor-plugins.service';
import { CapacitorPlatformService } from './capacitor-platform.service';
import { PomodoroNotificationService } from './pomodoro-notification.service';

describe('PomodoroNotificationService', () => {
  let service: PomodoroNotificationService;
  let plugin: jasmine.SpyObj<LocalNotificationsPlugin>;

  beforeEach(() => {
    plugin = jasmine.createSpyObj<LocalNotificationsPlugin>('LocalNotificationsPlugin', [
      'cancel',
      'checkPermissions',
      'requestPermissions',
      'schedule',
    ]);
  });

  it('should be a successful no-op on the web', async () => {
    configureService(false);
    const result = await service.schedule({
      deadlineMs: 10_000,
      title: 'Pomodoro',
      body: 'Complete',
      requestPermission: true,
    });

    expect(result).toBeTrue();
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it('should request permission and schedule the native notification', async () => {
    configureService(true);
    plugin.cancel.and.returnValue(Promise.resolve());
    plugin.checkPermissions.and.returnValue(Promise.resolve({ display: 'prompt' }));
    plugin.requestPermissions.and.returnValue(Promise.resolve({ display: 'granted' }));
    plugin.schedule.and.returnValue(Promise.resolve({ notifications: [{ id: 1 }] }));

    const result = await service.schedule({
      deadlineMs: 10_000,
      title: 'Pomodoro',
      body: 'Complete',
      requestPermission: true,
    });

    expect(result).toBeTrue();
    expect(plugin.requestPermissions).toHaveBeenCalled();
    expect(plugin.schedule).toHaveBeenCalledWith({
      notifications: [{
        id: 1,
        title: 'Pomodoro',
        body: 'Complete',
        schedule: { at: new Date(10_000), allowWhileIdle: true },
        sound: 'default',
      }],
    });
  });

  it('should not schedule when permission is denied', async () => {
    configureService(true);
    plugin.cancel.and.returnValue(Promise.resolve());
    plugin.checkPermissions.and.returnValue(Promise.resolve({ display: 'denied' }));

    const result = await service.schedule({
      deadlineMs: 10_000,
      title: 'Pomodoro',
      body: 'Complete',
      requestPermission: true,
    });

    expect(result).toBeFalse();
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it('should cancel a pending native notification', async () => {
    configureService(true);
    plugin.cancel.and.returnValue(Promise.resolve());

    expect(await service.cancel()).toBeTrue();
    expect(plugin.cancel).toHaveBeenCalledWith({ notifications: [{ id: 1 }] });
  });

  function configureService(isNativePlatform: boolean): void {
    TestBed.configureTestingModule({
      providers: [
        PomodoroNotificationService,
        { provide: LocalNotificationsPlugin, useValue: plugin },
        { provide: CapacitorPlatformService, useValue: createPlatform(isNativePlatform) },
      ],
    });
    service = TestBed.inject(PomodoroNotificationService);
  }
});

function createPlatform(isNativePlatform: boolean): CapacitorPlatformService {
  return { isNative: () => isNativePlatform } as CapacitorPlatformService;
}
