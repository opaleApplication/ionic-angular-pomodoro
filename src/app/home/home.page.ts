import { Component } from '@angular/core';

import { IonContent } from '@ionic/angular/standalone';

import { PomodoroComponent } from '../components/pomodoro/pomodoro.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [ IonContent, PomodoroComponent],
})
export class HomePage {
  constructor() { }
}
