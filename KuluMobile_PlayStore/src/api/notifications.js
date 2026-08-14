import messaging from '@react-native-firebase/messaging';
import {api} from './client';
import {PermissionsAndroid, Platform, Alert} from 'react-native';

export async function requestPushPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  return enabled;
}

export async function registerFcmToken() {
  try {
    const enabled = await requestPushPermission();
    if (!enabled) return null;
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    if (token) {
      await api.post('/device/fcm', {fcm_token: token});
    }

    // Refresh token when rotated
    messaging().onTokenRefresh(async (newToken) => {
      try {
        await api.post('/device/fcm', {fcm_token: newToken});
      } catch (_) {}
    });

    return token;
  } catch (e) {
    console.warn('FCM register failed', e?.message || e);
    return null;
  }
}

/**
 * Attach foreground message handler. Call once after app boots when user is logged in.
 * Returns an unsubscribe function.
 */
export function attachForegroundHandler() {
  return messaging().onMessage(async (remoteMessage) => {
    const title = remoteMessage.notification?.title || 'Kulu';
    const body = remoteMessage.notification?.body || '';
    if (title || body) {
      Alert.alert(title, body);
    }
  });
}

/**
 * Handle notification that opened the app from background/quit.
 * Returns the remote message or null.
 */
export async function getInitialNotification() {
  return messaging().getInitialNotification();
}

export function onNotificationOpened(handler) {
  return messaging().onNotificationOpenedApp(handler);
}
