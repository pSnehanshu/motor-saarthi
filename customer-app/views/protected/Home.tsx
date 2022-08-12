import { useState } from 'react';
import { Button, Text, View, ActivityIndicator } from 'react-native';
import { useRemoveAuthToken } from '../../queries/auth';

export default function Home() {
  const { logout, mutation } = useRemoveAuthToken();

  return (
    <View>
      <Text>Home screen is this, ain't it?</Text>

      {mutation.isLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Logout" onPress={logout} />
      )}
    </View>
  );
}
