import { Heading, View } from 'native-base';
import { ScreenProps } from '../../../routes';

export default function LinkQR({
  route: {
    params: { qrId },
  },
}: ScreenProps<'LinkQR'>) {
  return (
    <View>
      <Heading>{qrId}</Heading>
    </View>
  );
}
