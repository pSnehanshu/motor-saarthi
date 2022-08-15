import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Button, Text, TextInput, View } from 'react-native';
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

  const loading = requestOtpMutation.isLoading || submitOtpMutation.isLoading;

  return (
    <View>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : otpSent ? (
        <>
          <Text
            onPress={() => {
              setOtpSent(false);
              setPhone('');
            }}
          >
            Phone: {phone} (Tap to change)
          </Text>
          <TextInput
            onChangeText={setOtp}
            value={otp}
            placeholder="Enter 4-digit OTP"
            keyboardType="numeric"
          />
          <Button
            onPress={() => otp && submitOtpMutation.mutate({ phone, otp })}
            title="Submit OTP"
          />
        </>
      ) : (
        <>
          <TextInput
            onChangeText={setPhone}
            value={phone}
            placeholder="Enter your phone number"
            keyboardType="numeric"
          />
          <Button
            onPress={() => phone && requestOtpMutation.mutate({ phone })}
            title="Send OTP"
          />
        </>
      )}

      <StatusBar style="auto" />
    </View>
  );
}
