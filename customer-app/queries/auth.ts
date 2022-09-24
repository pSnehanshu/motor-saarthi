import { useQuery } from 'react-query';
import * as SecureStore from 'expo-secure-store';
import messaging from '@react-native-firebase/messaging';
import { queryClient } from './client';
import { trpc } from '../utils/trpc';
import { Platform } from 'react-native';
import { AUTH_TOKEN, getAuthToken } from './getAuthToken';

export async function setAuthToken(token: string) {
  await SecureStore.setItemAsync(AUTH_TOKEN, token);
  await queryClient.invalidateQueries(['auth']);
}

export function useRemoveAuthToken() {
  const logoutMutation = trpc.useMutation('auth.logout', {
    async onSuccess() {
      await SecureStore.deleteItemAsync(AUTH_TOKEN);
      await queryClient.invalidateQueries(['auth']);
    },
    onError(error) {
      console.error('Logout error', error);
    },
  });

  return {
    mutation: logoutMutation,
    async logout() {
      const token = await getAuthToken();

      await messaging().registerDeviceForRemoteMessages();
      const regtoken = await messaging().getToken();

      if (token)
        logoutMutation.mutate({
          jwtToken: token,
          deviceType: Platform.OS,
          regtoken,
        });
    },
  };
}

export function useIsLoggedIn() {
  return useQuery(['auth', 'isLoggedIn'], () =>
    getAuthToken().then((token) => !!token),
  );
}
