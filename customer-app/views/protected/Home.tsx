import { useState } from 'react';
import { Button, Text, View, ActivityIndicator } from 'react-native';
import { removeAuthToken } from '../../queries/auth';

export default function Home() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <View>
      <Text>Home screen is this, ain't it?</Text>

      {isLoggingOut ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button
          title="Logout"
          onPress={async () => {
            setIsLoggingOut(true);
            try {
              await removeAuthToken();
            } catch (error) {
              console.error(error);
            }
            setIsLoggingOut(false);
          }}
        />
      )}
    </View>
  );
}
