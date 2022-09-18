import { Button, View, ActivityIndicator, FlatList } from 'react-native';
import { useRemoveAuthToken } from '../../queries/auth';
import { ScreenProps } from '../../routes';

type MenuItem = {
  title: string;
  onPress?: () => void;
};

export default function Home({ navigation }: ScreenProps<'Home'>) {
  const { logout, mutation: logoutMutation } = useRemoveAuthToken();

  const menuItems: MenuItem[] = [
    {
      title: 'My vehicles',
      onPress() {
        navigation.navigate('MyVehicles');
      },
    },
    {
      title: 'Register new vehicle',
    },
    {
      title: 'Buy QR tags',
    },
    {
      title: 'Scan a QR',
    },
  ];

  return (
    <View>
      <FlatList
        data={menuItems}
        renderItem={({ item }) => (
          <View
            style={{
              flex: 1,
              flexDirection: 'column',
              margin: 1,
            }}
          >
            <Button
              title={item.title}
              onPress={() => item.onPress && item.onPress()}
            />
          </View>
        )}
        numColumns={2}
      />

      {logoutMutation.isLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Logout" onPress={logout} />
      )}
    </View>
  );
}
