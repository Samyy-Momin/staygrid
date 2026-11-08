import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { authApi, api } from './authApi';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  try {
    const session = await authApi.getSession();
    if (!session?.user || !Device.isDevice) return null;
    const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn('Set EXPO_PUBLIC_EAS_PROJECT_ID to enable push notifications.');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0066CC',
      });
    }

    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return null;

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.post('/api/notifications/push-token', {
      pushToken: token.data,
      platform: Platform.OS,
    });
    return token.data;
  } catch (error) {
    console.warn('Push notification registration failed:', error);
    return null;
  }
}

export async function unregisterPushNotificationsAsync() {
  try {
    const session = await authApi.getSession();
    if (!session?.user || !Device.isDevice) return;
    const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.delete('/api/notifications/push-token', { data: { pushToken: token.data } });
  } catch (error) {
    console.warn('Push notification token removal failed:', error);
  }
}
