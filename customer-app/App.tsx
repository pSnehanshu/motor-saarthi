import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { QueryClientProvider } from 'react-query';
import { queryClient } from './queries/client';
import { Routes } from './routes';
import { trpc, trpcClient } from './utils/trpc';

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
