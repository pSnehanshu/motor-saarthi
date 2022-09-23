import { QueryClientProvider } from 'react-query';
import messaging from '@react-native-firebase/messaging';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { NativeBaseProvider } from 'native-base';
import { queryClient } from './queries/client';
import { Routes } from './routes';
import { trpc, trpcClient } from './utils/trpc';
import notifee, { AndroidColor, Event, EventType } from '@notifee/react-native';
import {
  ContactReasons,
  ContactReasonsHumanFriendly,
} from './shared/contact-reasons';

// Foreground service
notifee.registerForegroundService((notification) => {
  return new Promise(() => {
    // Never quit
  });
});
displayForegroundServiceNotification();
async function displayForegroundServiceNotification() {
  // Request permissions (required for iOS)
  await notifee.requestPermission();

  // Create a channel (required for Android)
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
  });

  notifee.displayNotification({
    title: 'MotorSaarthi running...',
    body: 'Do not close it please',
    android: {
      channelId,
      asForegroundService: true,
      color: AndroidColor.YELLOW,
      colorized: true,
      pressAction: {
        id: 'default',
      },
    },
  });
}

// Note that an async function or a function that returns a Promise
// is required for both subscribers.
async function onMessageReceived(
  message: FirebaseMessagingTypes.RemoteMessage,
) {
  trpcClient.query('ping');
  console.log('Message received', message);

  const { data } = message;
  if (!data) return;

  // Request permissions (required for iOS)
  await notifee.requestPermission();

  // Create a channel (required for Android)
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
  });

  // Display a notification
  await notifee.displayNotification({
    title: ContactReasonsHumanFriendly[data.reason as ContactReasons],
    body: `Please reach to your vehicle ${data.vehicleRegNum} ASAP!`,
    android: {
      channelId,
      pressAction: {
        id: 'default',
      },
    },
  });
}

async function onNotificationEvent(e: Event, type: 'bg' | 'fg') {
  console.log('Type', type);
  if (e.type === EventType.PRESS) {
    console.log('Notif pressed');
  }
}
notifee.onBackgroundEvent((e) => onNotificationEvent(e, 'bg'));
notifee.onForegroundEvent((e) => onNotificationEvent(e, 'fg'));

const FCM = messaging();
FCM.onMessage(onMessageReceived);
FCM.setBackgroundMessageHandler(onMessageReceived);

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <NativeBaseProvider>
          <Routes />
        </NativeBaseProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
