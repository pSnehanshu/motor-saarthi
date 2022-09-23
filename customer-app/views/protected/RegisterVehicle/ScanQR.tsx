import { BarCodeScanner as ExpoBarCodeScanner } from 'expo-barcode-scanner';
import { Text, View, Factory, Heading, Box, Center } from 'native-base';
import { useEffect, useState } from 'react';
import { ScreenProps } from '../../../routes';
import hostname from '../../../utils/hostname';
import { isCuid } from '../../../utils/isCuid';

// @ts-ignore
const BarCodeScanner = Factory(ExpoBarCodeScanner);

export default function ScanQR({ navigation }: ScreenProps<'ScanQR'>) {
  const [hasPermission, setHasPermission] = useState<'yes' | 'no' | 'pending'>(
    'pending',
  );
  const [isScanningPaused, setIsScanningPaused] = useState(false);

  function pauseScanning(duration = 3000) {
    setIsScanningPaused(true);
    return setTimeout(() => setIsScanningPaused(false), duration);
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
        <Text>Initializing camera, please wait...</Text>
      ) : hasPermission === 'no' ? (
        <Text>No access to camera</Text>
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
                      const timeout = pauseScanning();

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

                      clearTimeout(timeout);
                      navigation.replace('LinkQR', { qrId });
                    }
              }
              barCodeTypes={[ExpoBarCodeScanner.Constants.BarCodeType.qr]}
              width="full"
              height="full"
            />
          </Box>
        </Box>
      )}
    </View>
  );
}
