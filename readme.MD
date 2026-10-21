# Pomodoro Timer

A mobile-first Pomodoro timer built with Ionic 9, Angular 22, and Capacitor 8.
This repository also serves as a learning example for students, interns, and
developers getting started with this stack.

![Pomodoro timer screenshot](screens/screenshot.png)

## Features

- `Focus`, `Relax`, and `Custom` modes
- Custom work and break durations
- French, English, and Spanish translations selected from the device language
- A tomato that changes from green to yellow to red and blinks in the last 10 seconds
- Native audio through the maintained `@capgo/capacitor-native-audio` package
- Drift-free countdown based on a real deadline instead of interval ticks
- Background recovery across elapsed work and break sessions
- Native deadline notifications through `@capacitor/local-notifications`
- Timer restoration after the application WebView is recreated
- A responsive Ionic interface with a neon theme

## Stack

- Angular 22
- Ionic Angular 9
- Capacitor 8
- TypeScript 6.0
- Jasmine and Karma for unit tests
- ESLint 9 for TypeScript and Angular templates

## Requirements

- Node.js **22.23.3**, the version pinned in `.nvmrc` and used by CI
- npm, included with Node.js
- Google Chrome to run the Karma tests

The supported Node.js ranges are `^22.22.3`, `^24.15.0`, or `>=26.0.0`.
Using the pinned version keeps local development consistent with CI.

The browser compilation targets are declared explicitly in the `browserslist`
field of `package.json`. They use the intersection of Ionic 9's documented
platform support and Angular 22's Baseline browser set: Chrome, Edge, and
Firefox 119 or later, plus Safari and iOS 17 or later. This prevents Ionic CLI
from silently falling back to a reduced set of devices after a migration.

## Getting started

After cloning the repository, open a terminal in its root directory.
If you use nvm or nvm-windows, install and activate the pinned Node.js version:

```bash
nvm install 22.23.3
nvm use 22.23.3
```

On Windows, nvm may request administrator permission to switch Node.js versions.

Install the dependencies and start the development server:

```bash
npm ci
npm start
```

Open `http://localhost:4200/` in your browser. Changes to the source files are
reflected by the development server.

Use `npm ci` for a fresh installation from `package-lock.json`. Use `npm install`
when intentionally adding or updating a dependency, and commit both
`package.json` and `package-lock.json` when they change.

## Checks

Before committing a change, run the linter, tests, and production build:

```bash
npm run check
```

| Command | Purpose |
| --- | --- |
| `npm start` | Start the development server |
| `npm run build` | Create a production build in `www/` |
| `npm run watch` | Rebuild the development output when files change |
| `npm test` | Run Jasmine/Karma tests in Chrome and watch for changes |
| `npm run test:ci` | Run tests once in ChromeHeadless |
| `npm run lint` | Check TypeScript and HTML; warnings fail the check |
| `npm run check` | Run lint, tests, and the production build in sequence |

If Chrome is installed in a nonstandard location, set the `CHROME_BIN`
environment variable to the path of its executable.

The [CI workflow](.github/workflows/ci.yml) runs `npm ci` and `npm run check`
for pull requests and pushes to `main`.

## Understanding the application

Start with these files:

| File | Responsibility |
| --- | --- |
| [src/main.ts](src/main.ts) | Bootstrap Angular and configure Ionic, routing, HTTP, and translations |
| [src/app/app.routes.ts](src/app/app.routes.ts) | Define the application routes |
| [src/app/home/home.page.ts](src/app/home/home.page.ts) | Compose the home page |
| [src/app/components/pomodoro/pomodoro.component.ts](src/app/components/pomodoro/pomodoro.component.ts) | Manage UI state, deadlines, background recovery, and custom durations |
| [src/app/components/pomodoro/pomodoro.component.html](src/app/components/pomodoro/pomodoro.component.html) | Display the timer and handle user actions |
| [src/app/core/i18n.service.ts](src/app/core/i18n.service.ts) | Load translations and provide translated text |
| [src/app/core/pomodoro-persistence.service.ts](src/app/core/pomodoro-persistence.service.ts) | Validate, save, and restore timer state |
| [src/app/core/pomodoro-notification.service.ts](src/app/core/pomodoro-notification.service.ts) | Schedule and cancel the native deadline notification |
| [src/app/core/pomodoro-audio.service.ts](src/app/core/pomodoro-audio.service.ts) | Preload and play native audio after user interaction |
| [src/app/core/app-lifecycle.service.ts](src/app/core/app-lifecycle.service.ts) | Synchronize the countdown when the native application resumes |
| [src/app/core/capacitor-plugins.service.ts](src/app/core/capacitor-plugins.service.ts) | Provide injectable, testable boundaries around Capacitor plugins |

The application runs without Zone.js. Timer state uses Angular signals: read a
value with `timeLeft()` and change it with `timeLeft.set(...)`. Angular tracks
signal reads in templates and refreshes the view when those values change,
including updates made outside a Zone.js task.

The interval only refreshes the display. It is not the source of truth for the
countdown. `startTimer()` stores an absolute deadline based on `Date.now()`, and
each refresh derives the remaining seconds from that deadline. This prevents
timer drift when browsers throttle callbacks or iOS suspends the WebView.

Angular's `@HostListener` synchronizes the timer when a web document becomes
visible. On iOS and Android, Capacitor's `appStateChange` event performs the same
synchronization when the application becomes active. `DestroyRef` owns cleanup
of the interval and native listener, so teardown follows the Angular component
lifecycle without manually implementing `OnDestroy`.

Native plugins are accessed through small injectable adapters. Application
services can therefore be unit-tested without a native runtime, while direct
plugin calls remain confined to one integration boundary.

The audio plugin's optional HLS support is disabled in `capacitor.config.ts`:
the application only plays a bundled MP3 sound, so including the Android HLS
engine would add binary size without providing a used feature.

If more than one phase elapsed in the background, the component calculates the
current phase and deadline directly instead of replaying every missed interval.
The running state is stored locally so a recreated WebView can resume from the
same deadline.

Tests live next to the code they exercise in `*.spec.ts` files. Component tests
use `await fixture.whenStable()` to wait for rendering. Countdown regression
tests cover zoneless rendering, delayed interval callbacks, transitions at the
exact deadline, multiple elapsed phases, and restoration of a paused timer.

## Native development

After changing web code or Capacitor dependencies, build the web application
and synchronize the native projects:

```bash
npm run build
npx cap sync
```

Open a native project:

```bash
npx cap open android
npx cap open ios
```

Android builds require Android Studio, the Android SDK, and a compatible JDK
(Android Studio's bundled runtime is sufficient). iOS builds require macOS,
Xcode, and CocoaPods. Web checks do not replace native builds and device testing,
especially for native audio, application suspension, and notifications.

Validate native compilation from the repository root with:

```bash
cd android && ./gradlew assembleDebug
cd ../ios/App && xcodebuild \
  -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  CODE_SIGNING_ALLOWED=NO \
  build
```

The iOS command performs an unsigned Simulator build. Release archives and
physical-device builds still require the appropriate Apple signing setup.

The first timer start can request notification permission on a native device.
When permission is granted, the application schedules one notification for the
current deadline. Pausing, stopping, changing mode, or changing the active
custom duration cancels or replaces that notification. Denying permission does
not prevent the timer from running.

On Android 12 and later, the Local Notifications plugin declares the exact
alarm permission. The user can still disable exact alarms in the system
settings; Android may then deliver the notification late. On Android 13 and
later, notification display permission is requested at runtime. On iOS, the
operating system remains responsible for notification delivery and timing.

The countdown itself never depends on notification delivery. Its absolute
deadline and session data are stored under the versioned local-storage key
`pomodoro-state-v1`. No timer data is sent to a server. Invalid or incompatible
stored state is ignored, and the application falls back to its default session.

Background behavior must be tested on physical devices. Start a short session,
lock the device, wait for the notification, and reopen the application to verify
the restored phase and remaining time. Simulators and browser tabs do not fully
reproduce iOS suspension behavior.

Use this physical-device checklist before a native release:

1. Start, pause, resume, and stop both work and break sessions.
2. Accept and deny notification permission on fresh installations.
3. Lock the device past one deadline, then past several complete phases.
4. Reopen the application and verify the phase and remaining time.
5. Terminate and reopen the application while a timer is running and while it
   is paused.
6. Verify notification and audio behavior on both iOS and Android.

`ios/App/Podfile.lock` and the Xcode workspace are tracked to keep native iOS
dependency resolution reproducible. Capacitor-generated Android and iOS plugin
registration files must be committed whenever `npx cap sync` changes them.

The native iOS deployment target is **iOS 17**. Browser targets do not lower
that native deployment target or override Angular 22's supported Baseline set.
See the [Angular browser support policy](https://angular.dev/reference/versions#browser-support)
and [Ionic 9 support matrix](https://github.com/ionic-team/ionic-framework/blob/main/BREAKING.md#browser-and-platform-support).

## Native validation status

The web build, unit tests, and unsigned iOS Simulator build are validated by
this repository's current checks. The following release checks remain manual:

- Android debug compilation requires a compatible JDK on the machine running
  `cd android && ./gradlew assembleDebug`.
- Physical iOS and Android devices are required to validate application
  suspension, notification delivery, and native audio behavior after locking
  the screen.

Do not mark a native release as device-validated until those checks have been
completed on the target platforms.

## Repository structure

- `src/app/`: components, home page, and translation service
- `src/assets/`: translations, images, and audio
- `src/testing/`: shared unit test helpers
- `android/` and `ios/`: Capacitor native projects
- `resources/`: icon and splash screen assets
- `screens/`: application screenshots

Dependencies, caches, coverage reports, and generated builds are ignored by Git.
The lockfile is tracked so contributors and CI install the same dependencies.

## Translations

Translation files are in `src/assets/i18n/`:

- `fr.json`
- `en.json`
- `es.json`

When adding a translation key, update all three files. French is the fallback
language for unsupported locales and missing translations.

## Contributing

Keep changes focused and explain their purpose. Add or update tests when
changing behavior, then run `npm run check`. Review `git diff` before committing
to ensure the change contains only the intended files.

Write commit messages in English with a short, imperative subject, for example
`fix: preserve custom durations when switching modes`. Explain compatibility
changes and validation in the commit body when relevant.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
