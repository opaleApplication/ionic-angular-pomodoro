import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { StateChangeListener } from '@capacitor/app';

import { AppLifecycleService } from './app-lifecycle.service';
import { CapacitorAppPlugin } from './capacitor-plugins.service';
import { CapacitorPlatformService } from './capacitor-platform.service';

describe('AppLifecycleService', () => {
  let service: AppLifecycleService;
  let appPlugin: jasmine.SpyObj<CapacitorAppPlugin>;

  beforeEach(() => {
    appPlugin = jasmine.createSpyObj<CapacitorAppPlugin>('CapacitorAppPlugin', [
      'addStateChangeListener',
    ]);
  });

  it('should not register a native listener on the web', async () => {
    configureService(false);
    await service.synchronizeOnNativeResume(() => undefined, createDestroyRef());

    expect(appPlugin.addStateChangeListener).not.toHaveBeenCalled();
  });

  it('should synchronize on native resume and remove the listener on destroy', async () => {
    configureService(true);
    const remove = jasmine.createSpy('remove').and.returnValue(Promise.resolve());
    let stateChange: ((state: { isActive: boolean }) => void) | undefined;
    appPlugin.addStateChangeListener.and.callFake(async callback => {
      stateChange = callback as StateChangeListener;
      return { remove };
    });
    const callback = jasmine.createSpy('callback');
    const destroyRef = createDestroyRef();

    await service.synchronizeOnNativeResume(callback, destroyRef.ref);
    stateChange?.({ isActive: false });
    stateChange?.({ isActive: true });
    destroyRef.destroy();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  function configureService(isNativePlatform: boolean): void {
    TestBed.configureTestingModule({
      providers: [
        AppLifecycleService,
        { provide: CapacitorAppPlugin, useValue: appPlugin },
        { provide: CapacitorPlatformService, useValue: createPlatform(isNativePlatform) },
      ],
    });
    service = TestBed.inject(AppLifecycleService);
  }
});

function createPlatform(isNativePlatform: boolean): CapacitorPlatformService {
  return { isNative: () => isNativePlatform } as CapacitorPlatformService;
}

function createDestroyRef(): DestroyRef & { ref: DestroyRef; destroy: () => void } {
  let destroyed = false;
  const callbacks: Array<() => void> = [];
  const ref = {
    get destroyed() {
      return destroyed;
    },
    onDestroy(callback: () => void) {
      callbacks.push(callback);
      return () => undefined;
    },
  } as DestroyRef;

  return Object.assign(ref, {
    ref,
    destroy: () => {
      destroyed = true;
      callbacks.forEach(callback => callback());
    },
  });
}
