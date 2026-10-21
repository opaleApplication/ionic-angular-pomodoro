import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ionic.pomodoro',
  appName: 'Pomodoro Timer',
  webDir: 'www',
  plugins: {
    NativeAudio: {
      hls: false,
    },
  },
};

export default config;
