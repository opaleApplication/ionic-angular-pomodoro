import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';

import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(I18nService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should load english translations from a regional locale code', fakeAsync(() => {
    let completed = false;
    void service.setLanguage('en-US').then(() => {
      completed = true;
    });

    httpController.expectOne('assets/i18n/fr.json').flush({
      'app.title': 'Pomodoro Timer',
      'pomodoro.phase.work': 'Travail',
    });
    flushMicrotasks();
    httpController.expectOne('assets/i18n/en.json').flush({
      'pomodoro.phase.work': 'Work',
    });
    flushMicrotasks();

    expect(service.language()).toBe('en');
    expect(service.t('pomodoro.phase.work')).toBe('Work');
    expect(completed).toBeTrue();
  }));

  it('should fall back to french for unsupported locales', fakeAsync(() => {
    let completed = false;
    void service.setLanguage('de-DE').then(() => {
      completed = true;
    });

    httpController.expectOne('assets/i18n/fr.json').flush({
      'app.title': 'Pomodoro Timer',
      'pomodoro.phase.break': 'Pause',
    });
    flushMicrotasks();

    expect(service.language()).toBe('fr');
    expect(service.t('pomodoro.phase.break')).toBe('Pause');
    expect(completed).toBeTrue();
  }));

  it('should merge the fallback dictionary with the active language', fakeAsync(() => {
    let completed = false;
    void service.setLanguage('es-MX').then(() => {
      completed = true;
    });

    httpController.expectOne('assets/i18n/fr.json').flush({
      'app.title': 'Pomodoro Timer',
      'pomodoro.note': 'Changer de mode relance une session de travail avec la duree choisie.',
    });
    flushMicrotasks();
    httpController.expectOne('assets/i18n/es.json').flush({
      'app.title': 'Temporizador Pomodoro',
    });
    flushMicrotasks();

    expect(service.language()).toBe('es');
    expect(service.t('app.title')).toBe('Temporizador Pomodoro');
    expect(service.t('pomodoro.note')).toBe('Changer de mode relance une session de travail avec la duree choisie.');
    expect(completed).toBeTrue();
  }));
});
