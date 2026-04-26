import { Component, inject } from '@angular/core';

import {
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonRow,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { PomodoroComponent } from '../components/pomodoro/pomodoro.component';
import { I18nService } from '../core/i18n.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonCol, IonContent, IonGrid, IonHeader, IonRow, IonTitle, IonToolbar, PomodoroComponent],
})
export class HomePage {
  readonly i18n = inject(I18nService);
}
