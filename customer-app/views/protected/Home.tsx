import notifee from '@notifee/react-native';
import { Button, Text, View, ActivityIndicator } from 'react-native';
import { useRemoveAuthToken } from '../../queries/auth';

export default function Home() {
  const { logout, mutation } = useRemoveAuthToken();

  const onDisplayNotification = async () => {
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
        progress: {
          max: 100,
          current: 30,
          indeterminate: true,
        },
        // ongoing: true,
      },
    });
  };

  return (
    <View>
      <Text>Home screen is this, ain't it?</Text>
      <Button title="Display Notification" onPress={onDisplayNotification} />

      {mutation.isLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Logout" onPress={logout} />
      )}
    </View>
  );
}
