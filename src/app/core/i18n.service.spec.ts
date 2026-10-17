import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });

    service = TestBed.inject(I18nService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should load english translations from a regional locale code', async () => {
    const loading = service.setLanguage('en-US');

    httpController.expectOne('assets/i18n/fr.json').flush({
      'app.title': 'Pomodoro Timer',
      'pomodoro.phase.work': 'Travail',
    });
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    httpController.expectOne('assets/i18n/en.json').flush({
      'pomodoro.phase.work': 'Work',
    });
    await loading;

    expect(service.language()).toBe('en');
    expect(service.t('pomodoro.phase.work')).toBe('Work');
  });

  it('should fall back to french for unsupported locales', async () => {
    const loading = service.setLanguage('de-DE');

    httpController.expectOne('assets/i18n/fr.json').flush({
      'app.title': 'Pomodoro Timer',
      'pomodoro.phase.break': 'Pause',
    });
    await loading;

    expect(service.language()).toBe('fr');
    expect(service.t('pomodoro.phase.break')).toBe('Pause');
  });

  it('should merge the fallback dictionary with the active language', async () => {
    const loading = service.setLanguage('es-MX');

    httpController.expectOne('assets/i18n/fr.json').flush({
      'app.title': 'Pomodoro Timer',
      'pomodoro.note': 'Changer de mode relance une session de travail avec la duree choisie.',
    });
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    httpController.expectOne('assets/i18n/es.json').flush({
      'app.title': 'Temporizador Pomodoro',
    });
    await loading;

    expect(service.language()).toBe('es');
    expect(service.t('app.title')).toBe('Temporizador Pomodoro');
    expect(service.t('pomodoro.note')).toBe('Changer de mode relance une session de travail avec la duree choisie.');
  });
});
