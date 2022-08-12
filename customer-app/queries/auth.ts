import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { queryClient } from './client';
import { registerForPushNotificationsAsync } from '../utils/notif';

const AUTH_TOKEN = 'auth-token';

export async function setAuthToken(token: string) {
  await SecureStore.setItemAsync(AUTH_TOKEN, token);
  await queryClient.invalidateQueries(['auth']);
}

export async function removeAuthToken() {
  try {
    // Deregister device for this user
    await axios.post('/auth/logout', {
      token: await getAuthToken(),
      ept: await registerForPushNotificationsAsync(),
    });

    await SecureStore.deleteItemAsync(AUTH_TOKEN);
    await queryClient.invalidateQueries(['auth']);
  } catch (error) {
    console.error('Logout error', error);
  }
}

export function getAuthToken() {
  return SecureStore.getItemAsync(AUTH_TOKEN);
}

export function useIsLoggedIn() {
  return false;
  // useQuery(['auth', 'isLoggedIn'], () =>
  //   getAuthToken().then((token) => !!token),
  // );
}
