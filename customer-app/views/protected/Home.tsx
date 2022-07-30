import { Button, Text, View } from 'react-native';
import { removeAuthToken } from '../../queries/auth';

export default function Home() {
  return (
    <View>
      <Text>Home screen</Text>
      <Button title="Logout" onPress={() => removeAuthToken()} />
    </View>
  );
}
