import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { trpc } from '../../utils/trpc';

export default function MyVehicles() {
  const {
    data: vehicles,
    isLoading,
    isError,
  } = trpc.useQuery(['customer.fetch-vehicles', {}]);

  return (
    <View>
      <Text>My-Vehicles</Text>

      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : isError ? (
        <Text>Error!</Text>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={({ item: vehicle }) => <Text>{vehicle.name}</Text>}
        />
      )}
    </View>
  );
}
