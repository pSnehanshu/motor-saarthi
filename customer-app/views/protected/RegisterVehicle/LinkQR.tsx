import {
  Box,
  Button,
  FormControl,
  Heading,
  Input,
  Radio,
  ScrollView,
  Spinner,
  Text,
  View,
} from 'native-base';
import { useState } from 'react';
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
  const registerVehicleMutation = trpc.useMutation(
    'customer.register-vehicle',
    {
      onSuccess(data) {
        navigation.replace('VehicleInfo', { id: data.id });
      },
      onError(error) {
        console.error(error);
        alert(`An error occured: ${error.message}`);
      },
    },
  );

  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [regNum, setRegNum] = useState('');
  const [regNumTouched, setRegNumTouched] = useState(false);
  const [wheelCount, setWheelCount] = useState<'2' | '3' | '4'>();

  const handleFormSubmit = async () => {
    registerVehicleMutation.mutate({
      name,
      regNum,
      wheelCount,
      qrId,
    });
  };

  return (
    <ScrollView p="2">
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <Text>Error!</Text>
      ) : (
        <Box>
          {isQRValid?.isAvailable ? (
            <>
              <Heading>Enter vehicle details</Heading>

              <FormControl isRequired isInvalid={!name && nameTouched} my="1">
                <FormControl.Label>Name</FormControl.Label>
                <Input
                  type="text"
                  placeholder="Mahindra Xylo, Tata tigor, Scorpio etc."
                  value={name}
                  onChangeText={setName}
                  onBlur={() => setNameTouched(true)}
                />
                <FormControl.ErrorMessage>Required</FormControl.ErrorMessage>
              </FormControl>

              <FormControl
                isRequired
                isInvalid={!regNum && regNumTouched}
                my="1"
              >
                <FormControl.Label>Registration number</FormControl.Label>
                <Input
                  type="text"
                  placeholder="AS01XY0000"
                  value={regNum}
                  onChangeText={setRegNum}
                  onBlur={() => setRegNumTouched(true)}
                />
                <FormControl.HelperText>
                  The number on your number plate
                </FormControl.HelperText>
                <FormControl.ErrorMessage>Required</FormControl.ErrorMessage>
              </FormControl>

              <FormControl isRequired my="1">
                <FormControl.Label>Wheels count</FormControl.Label>
                <Radio.Group
                  name="wheelType"
                  accessibilityLabel="Wheel count"
                  value={wheelCount || ''}
                  onChange={(count) => setWheelCount(count as '2' | '3' | '4')}
                >
                  <Radio value="2" my={1}>
                    Two-wheeler
                    <FormControl.HelperText>
                      Bike, scooty etc.
                    </FormControl.HelperText>
                  </Radio>
                  <Radio value="4" my={1}>
                    Four-wheeler
                    <FormControl.HelperText>
                      Cars, SUVs, Sedan etc.
                    </FormControl.HelperText>
                  </Radio>
                  <Radio value="3" my={1}>
                    Three-wheeler
                    <FormControl.HelperText>
                      Auto-richshaws, E-Rickshaws etc.
                    </FormControl.HelperText>
                  </Radio>
                </Radio.Group>
                <FormControl.ErrorMessage>Required</FormControl.ErrorMessage>
              </FormControl>

              <Button my="8" onPress={handleFormSubmit}>
                Register you vehicle
              </Button>
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
    </ScrollView>
  );
}
