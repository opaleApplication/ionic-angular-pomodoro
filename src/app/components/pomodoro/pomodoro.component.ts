import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { NativeAudio } from '@capgo/native-audio';

import { IonIcon, IonButton, IonLabel, IonText, IonSegment, IonSegmentButton } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { pause, play, stop, add, removeOutline } from 'ionicons/icons';

/**
 * PomodoroComponent is an Angular component that implements a Pomodoro timer.
 * It allows users to start, pause, stop, and toggle between work and break intervals.
 * The component also supports playing sounds and formatting time.
 */
@Component({
  selector: 'app-pomodoro',
  templateUrl: './pomodoro.component.html',
  styleUrls: ['./pomodoro.component.scss'],
  imports: [IonSegmentButton, IonSegment, IonText, IonLabel, IonButton, IonIcon, CommonModule],
  standalone: true,
})
export class PomodoroComponent implements OnInit {
  /** The title of the application. */
  appTitle: string = 'Pomodoro Timer';

  /** The duration of the work interval in seconds. Default is 25 minutes. */
  workTime = 25 * 60;

  /** The duration of the break interval in seconds. Default is 5 minutes. */
  breakTime = 5 * 60;

  /** The remaining time in the current interval in seconds. */
  timeLeft = this.workTime;

  /** Indicates whether the current interval is a work interval. */
  isWorkTime = true;

  /** Indicates whether the timer is currently running. */
  isRunning = false;

  /** The interval ID for the timer. */
  interval: any;

  /** Indicates whether the sounds have been loaded. */
  private soundsLoaded = false;

  /** Indicates whether the user has interacted with the page. */
  userInteracted: boolean = false;

  currentMode: string = 'relax'; // Set default mode to 'relax'
  isCustomMode: boolean = false;

  /**
   * Initialize the component.
   *
   * The constructor preloads the sounds using the {@link preloadSounds} method
   * and adds the necessary icons to the DOM using the {@link addIcons} method.
   */
  constructor() {
    addIcons({ add, play, pause, stop, removeOutline });
    this.preloadSounds();
  }

  /**
   * Event listener for the first user interaction on the document.
   * It is used to load the sounds after the first user interaction.
   * The event listener is removed after the first interaction.
   */
  ngOnInit() {
    document.addEventListener('click', () => {
      if (!this.soundsLoaded) {
        this.preloadSounds();  // Charger les sons après la première interaction
        this.soundsLoaded = true;
      }
      this.userInteracted = true;
    }, { once: true }); // Exécuter une seule fois
  }

  /**
   * Sets the mode of the Pomodoro timer to the given mode.
   * Available modes are 'focus', 'relax', and 'custom'.
   * The mode determines the duration of the work and break intervals.
   * @param mode The mode to set the timer to.
   */
  selectMode(mode: string) {
    this.currentMode = mode;
    this.isCustomMode = (mode === 'custom');
    switch (mode) {
      case 'focus':
        this.workTime = 50 * 60;
        this.breakTime = 10 * 60;
        break;
      case 'relax':
        this.workTime = 25 * 60;
        this.breakTime = 5 * 60;
        break;
      case 'custom':
        // Allow user to set custom times
        break;
      default:
        break;
    }
    this.timeLeft = this.workTime;
  }

  /**
   * Preloads the work sound asset if it has not been loaded yet.
   *
   * This method attempts to load the sound asset specified by the assetId 'work_sound'
   * from the path 'assets/sounds/work_sound.mp3'. It sets the `soundsLoaded` flag to true
   * upon successful loading. If the asset is already loaded or an error occurs during the
   * loading process, a warning is logged to the console with the error details.
   */
  preloadSounds() {
    if (!this.soundsLoaded) {
      try {
        NativeAudio.preload({
          assetId: 'work_sound',
          assetPath: 'assets/sounds/work_sound.mp3',
          audioChannelNum: 1,
          isUrl: false
        });
        this.soundsLoaded = true;
      } catch (error) {
        console.warn('Le son est déjà chargé ou une erreur est survenue :', error);
      }
    }
  }

  /**
   * Starts the timer.
   *
   * If the timer is not already running, sets it to running and starts
   * a new interval that decrements the `timeLeft` property every second.
   * If the `timeLeft` property reaches 0, the `toggleTimer` method is called
   * to switch to the next interval.
   */
  startTimer() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.interval = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
        } else {
          this.toggleTimer();
        }
      }, 1000);
    }
  }

  /**
   * Pauses the currently running timer.
   *
   * If the timer is active, sets the `isRunning` property to false
   * and clears the interval to stop the countdown.
   */
  pauseTimer() {
    if (this.isRunning) {
      this.isRunning = false;
      clearInterval(this.interval);
    }
  }

  /**
   * Stops the currently running timer and resets it to the start time.
   *
   * If the timer is active, sets the `isRunning` property to false
   * and clears the interval to stop the countdown. Then, it resets
   * the `timeLeft` property to the start time of the current interval
   * (either `workTime` or `breakTime`).
   */
  stopTimer() {
    this.isRunning = false;
    clearInterval(this.interval);
    this.timeLeft = this.isWorkTime ? this.workTime : this.breakTime;
  }

  /**
   * Toggles the timer between work and break intervals.
   *
   * If the timer is currently in a work interval, it switches to a break
   * interval. Otherwise, it switches to a work interval. It also clears the
   * previous interval and starts a new one. If the timer was previously running,
   * the sound associated with the new interval is played.
   */
  toggleTimer() {
    clearInterval(this.interval);
    if (this.isWorkTime) {
      this.timeLeft = this.breakTime;
      this.isWorkTime = false;
      this.playSound('work_sound');
    } else {
      this.timeLeft = this.workTime;
      this.isWorkTime = true;
    }
    this.startTimer();
  }

  /**
   * Plays a sound asset.
   *
   * If the user has already interacted with the page (e.g. by clicking on
   * something), the sound is played using NativeAudio. Otherwise, a warning
   * message is logged to the console.
   *
   * @param assetId - The ID of the asset to play.
   */
  playSound(assetId: string) {
    if (this.userInteracted) {
      NativeAudio.play({ assetId });
    } else {
      console.warn('L’utilisateur doit interagir avec la page avant de jouer un son.');
    }
  }

  /**
   * Converts a number of seconds to a string in "mm:ss" format.
   *
   * @param seconds - The number of seconds to format.
   * @returns A string in "mm:ss" format.
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Increments the work time by 60 seconds and updates the timer if the timer
   * is currently in a work interval.
   */
  increaseWorkTime() {
    this.workTime += 60;
    if (this.isWorkTime) this.timeLeft = this.workTime;
  }

  /**
   * Decrements the work time by 60 seconds if it is greater than 60 seconds.
   * Updates the `timeLeft` property if the timer is currently in a work interval
   * and the remaining time exceeds the new work time.
   */
  decreaseWorkTime() {
    if (this.workTime > 60) {
      this.workTime -= 60;
      if (this.isWorkTime && this.timeLeft > this.workTime) {
        this.timeLeft = this.workTime;
      }
    }
  }

  /**
   * Increments the break time by 60 seconds and updates the timer if the timer
   * is currently in a break interval.
   */
  increaseBreakTime() {
    this.breakTime += 60;
    if (!this.isWorkTime) this.timeLeft = this.breakTime;
  }

  /**
   * Decrements the break time by 60 seconds and updates the timer if the timer
   * is currently in a break interval.
   */
  decreaseBreakTime() {
    if (this.breakTime > 60) {
      this.breakTime -= 60;
      if (!this.isWorkTime && this.timeLeft > this.breakTime) {
        this.timeLeft = this.breakTime;
      }
    }
  }

  /**
   * Listens for changes in the segment and updates the mode of the Pomodoro timer.
   * @param event CustomEvent emitted by the ion-segment when the selected segment changes.
   * @param event.detail.value The currently selected mode.
   */
  onSegmentChange(event: CustomEvent) {
    const selectedMode = event.detail.value;
    this.selectMode(selectedMode);
  }
}
