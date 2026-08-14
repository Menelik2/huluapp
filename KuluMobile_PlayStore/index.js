import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';

// Required for background/quit-state data messages
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  // Notification payload is displayed by the system automatically when app is backgrounded.
  // Data-only handling can be extended here (e.g. badge counts).
  console.log('FCM background:', remoteMessage?.data?.type || 'message');
});

AppRegistry.registerComponent(appName, () => App);
