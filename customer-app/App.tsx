import { useEffect } from 'react';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { QueryClientProvider } from 'react-query';
import { queryClient } from './queries/client';
import { getAuthToken } from './queries/auth';
import { Routes } from './routes';
import { trpc, trpcClient } from './utils/trpc';

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
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (response) {
      alert(`Notification tapped! ${response.notification.date}`);
    }
  }, [response]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Routes />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
