import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { queryClient } from './client';

const AUTH_TOKEN = 'auth-token';

export async function setAuthToken(token: string) {
  await SecureStore.setItemAsync(AUTH_TOKEN, token);
  await queryClient.invalidateQueries(['auth']);
}

export async function removeAuthToken() {
  await SecureStore.deleteItemAsync(AUTH_TOKEN);
  await queryClient.invalidateQueries(['auth']);
}

export function useIsLoggedIn() {
  return useQuery(['auth', 'isLoggedIn'], () =>
    SecureStore.getItemAsync(AUTH_TOKEN).then((token) => !!token),
  );
}
