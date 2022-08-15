import { QueryClientProvider } from 'react-query';
import messaging from '@react-native-firebase/messaging';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { queryClient } from './queries/client';
import { Routes } from './routes';
import { trpc, trpcClient } from './utils/trpc';

// Note that an async function or a function that returns a Promise
// is required for both subscribers.
async function onMessageReceived(
  message: FirebaseMessagingTypes.RemoteMessage,
) {
  console.log('Message received', message);
}

messaging().onMessage(onMessageReceived);
messaging().setBackgroundMessageHandler(onMessageReceived);

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Routes />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
