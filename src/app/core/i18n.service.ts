import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { firstValueFrom } from 'rxjs';

type SupportedLanguage = 'fr' | 'en' | 'es';
type TranslationDictionary = Record<string, string>;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly http = inject(HttpClient);
  private readonly fallbackLanguage: SupportedLanguage = 'fr';
  private readonly cache = new Map<SupportedLanguage, TranslationDictionary>();
  private readonly currentLanguageSignal = signal<SupportedLanguage>(this.fallbackLanguage);
  private readonly translationsSignal = signal<TranslationDictionary>({});

  readonly language = this.currentLanguageSignal.asReadonly();

  async init(): Promise<void> {
    await this.setLanguage(this.detectDeviceLanguage());
  }

  async setLanguage(language: string): Promise<void> {
    const nextLanguage = this.normalizeLanguage(language);
    const { language: activeLanguage, translations } = await this.loadTranslations(nextLanguage);

    this.currentLanguageSignal.set(activeLanguage);
    this.translationsSignal.set(translations);

    document.documentElement.lang = activeLanguage;
    document.title = translations['app.title'] ?? 'Pomodoro Timer';
  }

  t(key: string): string {
    return this.translationsSignal()[key] ?? key;
  }

  private async loadTranslations(
    language: SupportedLanguage,
  ): Promise<{ language: SupportedLanguage; translations: TranslationDictionary }> {
    const fallbackTranslations = await this.loadDictionary(this.fallbackLanguage);

    if (language === this.fallbackLanguage) {
      return { language, translations: fallbackTranslations };
    }

    try {
      const activeTranslations = await this.loadDictionary(language);
      return {
        language,
        translations: { ...fallbackTranslations, ...activeTranslations },
      };
    } catch (error) {
      console.warn(`Unable to load ${language} translations. Falling back to ${this.fallbackLanguage}.`, error);
      return {
        language: this.fallbackLanguage,
        translations: fallbackTranslations,
      };
    }
  }

  private async loadDictionary(language: SupportedLanguage): Promise<TranslationDictionary> {
    const cachedDictionary = this.cache.get(language);
    if (cachedDictionary) {
      return cachedDictionary;
    }

    const dictionary = await firstValueFrom(
      this.http.get<TranslationDictionary>(`assets/i18n/${language}.json`),
    );

    this.cache.set(language, dictionary);
    return dictionary;
  }

  private detectDeviceLanguage(): string {
    const preferredLanguages = globalThis.navigator?.languages;
    if (Array.isArray(preferredLanguages) && preferredLanguages.length > 0) {
      return preferredLanguages[0];
    }

    return globalThis.navigator?.language ?? this.fallbackLanguage;
  }

  private normalizeLanguage(language: string | null | undefined): SupportedLanguage {
    const baseLanguage = language?.toLowerCase().split('-')[0];
    return this.isSupportedLanguage(baseLanguage) ? baseLanguage : this.fallbackLanguage;
  }

  private isSupportedLanguage(language: string | undefined): language is SupportedLanguage {
    return language === 'fr' || language === 'en' || language === 'es';
  }
}
