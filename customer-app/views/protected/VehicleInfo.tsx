import { Box, Heading, Spinner, Text, View } from 'native-base';
import { ScreenProps } from '../../routes';
import { trpc } from '../../utils/trpc';

export default function VehicleInfo({
  route: {
    params: { id },
  },
}: ScreenProps<'VehicleInfo'>) {
  const {
    data: vehicle,
    isLoading,
    isError,
  } = trpc.useQuery(['customer.vehicle-info', { id }]);

  return (
    <View>
      {isLoading ? (
        <Spinner size="lg" />
      ) : isError ? (
        <Heading>Error!</Heading>
      ) : (
        <Box>
          <Heading>{vehicle?.name}</Heading>
          <Text>{vehicle?.registration_num}</Text>
        </Box>
      )}
    </View>
  );
}
