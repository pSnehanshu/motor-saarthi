import _ from 'lodash';
import { Row, Pressable, Center, ScrollView, Button } from 'native-base';
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
      onPress() {
        navigation.navigate('ScanQR', {});
      },
    },
    {
      title: 'Buy QR tags',
    },
    {
      title: 'Scan a QR',
    },
  ];

  const itemsPerRow = 2;

  return (
    <ScrollView>
      {_.chunk(menuItems, itemsPerRow).map((row, i) => (
        <Row key={i}>
          {row.map((item, j) => (
            <Pressable
              key={j}
              width={`${100 / itemsPerRow}%`}
              height={200}
              onPress={() => item.onPress && item.onPress()}
              borderWidth={4}
              borderColor="primary.800"
            >
              <Center height="100%" width="100%">
                {item.title}
              </Center>
            </Pressable>
          ))}
        </Row>
      ))}

      <Button m="4" isLoading={logoutMutation.isLoading} onPress={logout}>
        Logout
      </Button>
    </ScrollView>
  );
}
