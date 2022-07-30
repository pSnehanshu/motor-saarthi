import axios from 'axios';
import { Routes } from './routes';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { queryClient } from './queries/client';
import { getAuthToken } from './queries/auth';

axios.defaults.baseURL = 'http://192.168.29.42:4080/c';
axios.interceptors.request.use(async (config) => {
  if (config.headers) {
    const token = await getAuthToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes />
    </QueryClientProvider>
  );
}
