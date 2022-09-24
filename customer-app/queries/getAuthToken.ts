import * as SecureStore from 'expo-secure-store';

export const AUTH_TOKEN = 'auth-token';

export function getAuthToken() {
  return SecureStore.getItemAsync(AUTH_TOKEN)
    .then((v) => v)
    .catch((err) => {
      console.error(err);
      return null;
    });
}
