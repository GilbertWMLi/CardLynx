import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cardlynx.local',
  appName: 'CardLynx Local',
  webDir: 'dist',
  server: {
    androidScheme: 'http', // Changed from 'https' to 'http' to allow API calls to local server
    cleartext: true, 
    allowNavigation: ['*']
  }
};

export default config;