import { Spinner, FlatList, Text, Box, Heading, Row } from 'native-base';
import { format } from 'date-fns';
import { trpc } from '../../utils/trpc';

export default function MyVehicles() {
  const {
    data: vehicles,
    isLoading,
    isError,
  } = trpc.useQuery(['customer.fetch-vehicles', {}]);

  return (
    <Box>
      {isLoading ? (
        <Spinner size="large" />
      ) : isError ? (
        <Text>Error!</Text>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={({ item: vehicle }) => (
            <Row p="6" borderBottomColor="primary.400" borderBottomWidth={2}>
              <Box width="80%">
                <Heading>{vehicle.name}</Heading>
                <Text>{vehicle.registration_num}</Text>
              </Box>
              <Box>
                <Text>
                  {format(new Date(vehicle.created_at), 'dd-LLL-yyyy')}
                </Text>
              </Box>
            </Row>
          )}
        />
      )}
    </Box>
  );
}
