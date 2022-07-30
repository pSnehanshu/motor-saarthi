import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useIsLoggedIn } from './queries/auth';
import Auth from './views/auth/Auth';
import Home from './views/protected/Home';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
};
export const Stack = createNativeStackNavigator<RootStackParamList>();
export type ScreenProps<RouteName extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, RouteName>;

export function Routes() {
  const { data: isLoggedIn } = useIsLoggedIn();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Home" component={Home} />
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
