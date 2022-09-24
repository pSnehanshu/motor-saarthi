import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useIsLoggedIn } from './queries/auth';
import Auth from './views/auth/Auth';
import Home from './views/protected/Home';
import { useEffect } from 'react';
import { registerDevice } from './utils/register-device';
import MyVehicles from './views/protected/MyVehicles';
import VehicleInfo from './views/protected/VehicleInfo';
import ScanQR from './views/protected/RegisterVehicle/ScanQR';
import LinkQR from './views/protected/RegisterVehicle/LinkQR';

type Vehicle = {
  id: string;
  name: string;
  regNum: string;
  wheelCount: '2' | '3' | '4';
};

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  MyVehicles: undefined;
  VehicleInfo: { id: string };
  ScanQR: {
    vehicle?: Vehicle;
  };
  LinkQR: {
    qrId: string;
    vehicle?: Vehicle;
  };
};
export const Stack = createNativeStackNavigator<RootStackParamList>();
export type ScreenProps<RouteName extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, RouteName>;

export function Routes() {
  const { data: isLoggedIn } = useIsLoggedIn();

  useEffect(() => {
    if (isLoggedIn) {
      registerDevice();
    }
  }, [isLoggedIn]);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="MyVehicles" component={MyVehicles} />
            <Stack.Screen name="VehicleInfo" component={VehicleInfo} />
            <Stack.Screen name="ScanQR" component={ScanQR} />
            <Stack.Screen name="LinkQR" component={LinkQR} />
          </>
        ) : (
          <>
            <Stack.Screen name="Auth" component={Auth} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
