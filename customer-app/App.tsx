import { QueryClientProvider } from 'react-query';
import messaging from '@react-native-firebase/messaging';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { queryClient } from './queries/client';
import { Routes } from './routes';
import { trpc, trpcClient } from './utils/trpc';
import notifee, {
  AndroidCategory,
  AndroidImportance,
} from '@notifee/react-native';
import { useEffect } from 'react';
import { AppRegistry, Text, View } from 'react-native';

function ContactCallScreen() {
  return (
    <View>
      <Text>Full Screen notif</Text>
    </View>
  );
}

AppRegistry.registerComponent('contact-call-screen', () => ContactCallScreen);

// Note that an async function or a function that returns a Promise
// is required for both subscribers.
async function onMessageReceived(
  message: FirebaseMessagingTypes.RemoteMessage,
) {
  trpcClient.query('ping');
  console.log('Message received', message);

  // Request permissions (required for iOS)
  await notifee.requestPermission();

  // Create a channel (required for Android)
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
  });

  // Display a notification
  await notifee.displayNotification({
    title: 'Notification Title',
    body: 'Main body content of the notification',
    android: {
      channelId,
      pressAction: {
        id: 'default',
      },
      // progress: {
      //   max: 100,
      //   current: 30,
      //   indeterminate: true,
      // },
      // ongoing: true,
      fullScreenAction: {
        id: 'default',
        mainComponent: 'contact-call-screen',
      },
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
    },
  });
}

const FCM = messaging();

FCM.onMessage(onMessageReceived);
FCM.setBackgroundMessageHandler(onMessageReceived);

export default function App() {
  useEffect(() => {
    FCM.onNotificationOpenedApp((remoteMessage) => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage.notification,
      );
    });

    FCM.getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log(
          'Notification caused app to open from quit state:',
          remoteMessage.notification,
        );
      }
    });
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Routes />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
