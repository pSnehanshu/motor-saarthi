import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { trpcClient } from './trpc';

export async function registerDevice() {
  // Register the device with FCM
  await messaging().registerDeviceForRemoteMessages();

  // Get the token
  const token = await messaging().getToken();

  // Save the token
  await trpcClient.mutation('customer.register-device', {
    token,
    type: Platform.OS,
  });
}
