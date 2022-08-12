import { useQuery } from 'react-query';
import * as SecureStore from 'expo-secure-store';
import { queryClient } from './client';
import { trpc } from '../utils/trpc';
import { registerForPushNotificationsAsync } from '../utils/notif';

const AUTH_TOKEN = 'auth-token';

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
      const ept = await registerForPushNotificationsAsync();
      const token = await getAuthToken();

      if (token)
        logoutMutation.mutate({
          ept,
          token,
        });
    },
  };
}

export function getAuthToken() {
  return SecureStore.getItemAsync(AUTH_TOKEN);
}

export function useIsLoggedIn() {
  return useQuery(['auth', 'isLoggedIn'], () =>
    getAuthToken().then((token) => !!token),
  );
}
