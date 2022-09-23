import { BarCodeScanner as ExpoBarCodeScanner } from 'expo-barcode-scanner';
import { Button, Text, View, Factory, Heading, Box, Center } from 'native-base';
import { useEffect, useState } from 'react';
import { ScreenProps } from '../../routes';
import hostname from '../../utils/hostname';
import { isCuid } from '../../utils/isCuid';

// @ts-ignore
const BarCodeScanner = Factory(ExpoBarCodeScanner);

export default function RegisterVehicle(props: ScreenProps<'RegisterVehicle'>) {
  const [hasPermission, setHasPermission] = useState<'yes' | 'no' | 'pending'>(
    'pending',
  );
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isScanningPaused, setIsScanningPaused] = useState(false);

  function pauseScanning(duration = 3000) {
    setIsScanningPaused(true);
    setTimeout(() => setIsScanningPaused(false), duration);
  }

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await ExpoBarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted' ? 'yes' : 'no');
    };

    getBarCodeScannerPermissions();
  }, []);

  return (
    <View p="2">
      {hasPermission === 'pending' ? (
        <Text>Requesting permission for camera access, please wait...</Text>
      ) : hasPermission === 'no' ? (
        <Text>No access to camera</Text>
      ) : (
        <>
          {scannedData ? (
            <>
              <Text>{scannedData}</Text>
              <Button onPress={() => setScannedData(null)}>Scan Again</Button>
            </>
          ) : (
            <Box>
              <Center>
                <Heading>Scan a QR</Heading>
              </Center>
              <Box p="8">
                <BarCodeScanner
                  onBarCodeScanned={
                    isScanningPaused
                      ? undefined
                      : ({ data }) => {
                          pauseScanning();

                          if (!data.startsWith(hostname)) {
                            alert('Invalid QR code!');
                            return;
                          }

                          const { pathname } = new URL(data);
                          if (!pathname.startsWith('/qr/')) {
                            alert('Invalid QR code!');
                            return;
                          }

                          const qrId = pathname.split('/qr/')[1];
                          if (!isCuid(qrId)) {
                            alert('Invalid QR code!');
                            return;
                          }

                          setScannedData(qrId);
                        }
                  }
                  barCodeTypes={[ExpoBarCodeScanner.Constants.BarCodeType.qr]}
                  width="full"
                  height="full"
                />
              </Box>
            </Box>
          )}
        </>
      )}
    </View>
  );
}
