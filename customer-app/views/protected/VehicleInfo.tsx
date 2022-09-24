import {
  Box,
  Heading,
  Spinner,
  Text,
  View,
  Image,
  Modal,
  Button,
  Center,
} from 'native-base';
import { useState } from 'react';
import { ScreenProps } from '../../routes';
import { trpc } from '../../utils/trpc';

export default function VehicleInfo({
  route: {
    params: { id },
  },
  navigation,
}: ScreenProps<'VehicleInfo'>) {
  const {
    data: vehicle,
    isLoading,
    isError,
  } = trpc.useQuery(['customer.vehicle-info', { id }]);

  const queryClient = trpc.useContext();
  const unlinkVehicleMutation = trpc.useMutation('customer.unlink-vehicle', {
    onSuccess() {
      queryClient.invalidateQueries(['customer.vehicle-info', { id }]);
    },
    onError(error) {
      console.error(error);
      alert(`Failed to unlink: ${error.message}`);
    },
  });

  const [showQR, setShowQR] = useState(false);
  const [showUnlink, setShowUnlink] = useState(false);

  return (
    <View p="4">
      {isLoading ? (
        <Spinner size="lg" />
      ) : isError ? (
        <Heading>Error!</Heading>
      ) : (
        <Box>
          <Heading>{vehicle?.name}</Heading>
          <Text>{vehicle?.wheelCount} wheeler</Text>
          <Text>{vehicle?.registration_num}</Text>

          <Button.Group my="4">
            {vehicle?.QR ? (
              <>
                <Button onPress={() => setShowQR(true)}>Show QR code</Button>
                <Button
                  colorScheme="danger"
                  onPress={() => setShowUnlink(true)}
                >
                  Unlink QR code
                </Button>
              </>
            ) : (
              <>
                <Button
                  onPress={() =>
                    navigation.navigate('ScanQR', {
                      vehicle: vehicle
                        ? {
                            id: vehicle.id,
                            name: vehicle.name ?? '',
                            regNum: vehicle.registration_num ?? '',
                            wheelCount: vehicle.wheelCount as '2' | '3' | '4',
                          }
                        : undefined,
                    })
                  }
                >
                  Link QR code
                </Button>
              </>
            )}
          </Button.Group>

          {/* QR code modal */}
          <Modal isOpen={showQR} onClose={() => setShowQR(false)}>
            <Modal.Content maxWidth="400px">
              <Modal.CloseButton />
              <Modal.Header>QR code</Modal.Header>
              <Modal.Body>
                <Center>
                  {vehicle?.qrCodeURL ? (
                    <Image
                      source={{
                        uri: vehicle?.qrCodeURL,
                      }}
                      alt="QR code"
                      size="2xl"
                    />
                  ) : (
                    <Text>QR code not assigned</Text>
                  )}
                </Center>
              </Modal.Body>
            </Modal.Content>
          </Modal>

          {/* Unlink QR code modal */}
          <Modal isOpen={showUnlink} onClose={() => setShowUnlink(false)}>
            <Modal.Content maxWidth="400px">
              <Modal.CloseButton />
              <Modal.Header>Unlink QR code</Modal.Header>
              <Modal.Body>
                This will free up the QR code attached to this vehicle. Then you
                can link the QR code to another vehicle.
              </Modal.Body>
              <Modal.Footer>
                <Button.Group>
                  <Button
                    variant="ghost"
                    colorScheme="blueGray"
                    onPress={() => {
                      setShowUnlink(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="danger"
                    onPress={async () => {
                      await unlinkVehicleMutation.mutateAsync({
                        vehicleId: vehicle?.id!,
                      });
                      setShowUnlink(false);
                    }}
                    isLoading={unlinkVehicleMutation.isLoading}
                  >
                    Unlink
                  </Button>
                </Button.Group>
              </Modal.Footer>
            </Modal.Content>
          </Modal>
        </Box>
      )}
    </View>
  );
}
