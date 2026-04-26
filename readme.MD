# Pomodoro Timer

Application Pomodoro mobile-first construite avec Ionic 8, Angular 20 et Capacitor 8.

![Capture de l'application](screens/screenshot.png)

## Fonctionnalités

- Modes `Focus`, `Relax` et `Custom`
- Durées de travail et de pause personnalisables
- Traductions `fr`, `en` et `es` chargées selon la langue du mobile
- Tomate évolutive `vert -> jaune -> rouge` avec clignotement dans les 10 dernières secondes
- Audio natif via `@capgo/native-audio`
- Interface Ionic responsive avec style néon

## Stack

- Angular 20
- Ionic Angular 8
- Capacitor 8
- Jasmine + Karma pour les tests unitaires

## Démarrage

```bash
npm install
npm start
```

L'application est ensuite disponible sur `http://localhost:4200/`.

## Commandes utiles

```bash
npm run build
npx ng test --watch=false --browsers=ChromeHeadless
npm run lint
```

## Mobile

Synchroniser les plateformes natives après une modification web ou Capacitor :

```bash
npx cap sync
```

Ouvrir les projets natifs :

```bash
npx cap open android
npx cap open ios
```

## Traductions

Les fichiers de traduction se trouvent dans `src/assets/i18n/` :

- `fr.json`
- `en.json`
- `es.json`

## Licence

Projet sous licence MIT. Voir `LICENSE`.
