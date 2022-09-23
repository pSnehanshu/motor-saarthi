import { Box, Button, Heading, Spinner, Text, View } from 'native-base';
import { ScreenProps } from '../../../routes';
import { trpc } from '../../../utils/trpc';

export default function LinkQR({
  route: {
    params: { qrId },
  },
  navigation,
}: ScreenProps<'LinkQR'>) {
  const {
    data: isQRValid,
    isLoading,
    isError,
  } = trpc.useQuery(['customer.validate-qr', { qrId }]);

  return (
    <View p="2">
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <Text>Error!</Text>
      ) : (
        <Box>
          {isQRValid?.isAvailable ? (
            <>
              <Heading>Enter vehicle details</Heading>
            </>
          ) : (
            <>
              <Text>{isQRValid?.reason}</Text>
              <Button onPress={() => navigation.replace('ScanQR')}>
                Scan another
              </Button>
            </>
          )}
        </Box>
      )}
    </View>
  );
}
