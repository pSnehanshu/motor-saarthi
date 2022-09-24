import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Button,
  Text,
  Input,
  FormControl,
  ScrollView,
  Pressable,
} from 'native-base';
import { ScreenProps } from '../../routes';
import { setAuthToken } from '../../queries/auth';
import { trpc } from '../../utils/trpc';

export default function Auth({}: ScreenProps<'Auth'>) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const requestOtpMutation = trpc.useMutation('auth.request-otp', {
    onMutate() {
      setOtp('');
    },
    onSuccess() {
      setOtpSent(true);
    },
  });
  const submitOtpMutation = trpc.useMutation('auth.submit-otp', {
    onSuccess({ token, user }) {
      setOtpSent(false);
      setPhone('');
      setAuthToken(token);
    },
  });

  return (
    <ScrollView p="2">
      {otpSent ? (
        <>
          <FormControl isRequired>
            <Pressable
              onPress={() => {
                setOtpSent(false);
                setPhone('');
              }}
            >
              <FormControl.Label>
                Phone: {phone} (Tap to change)
              </FormControl.Label>
            </Pressable>
            <Input
              onChangeText={setOtp}
              value={otp}
              placeholder="Enter 4-digit OTP"
              keyboardType="numeric"
            />
          </FormControl>

          <Button
            my="4"
            isLoading={submitOtpMutation.isLoading}
            onPress={() => otp && submitOtpMutation.mutate({ phone, otp })}
          >
            Submit OTP
          </Button>
        </>
      ) : (
        <>
          <FormControl isRequired>
            <FormControl.Label>Phone number</FormControl.Label>
            <Input
              onChangeText={setPhone}
              value={phone}
              placeholder="9876543210"
              keyboardType="numeric"
            />
          </FormControl>

          <Button
            my="4"
            isLoading={requestOtpMutation.isLoading}
            onPress={() => phone && requestOtpMutation.mutate({ phone })}
          >
            Send OTP
          </Button>
        </>
      )}

      <StatusBar style="auto" />
    </ScrollView>
  );
}
