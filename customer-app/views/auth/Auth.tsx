import axios from 'axios';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Button, Text, TextInput, View } from 'react-native';
import { SuccessResponse } from '../../../shared/responses.type';
import { ScreenProps } from '../../routes';
import { setAuthToken } from '../../queries/auth';

export default function Auth({}: ScreenProps<'Auth'>) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const sendOtp = async () => {
    if (!phone) return;

    try {
      setLoading(true);
      setOtp('');

      await axios.post('/auth/request-otp', {
        phone,
      });

      setOtpSent(true);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const submitOtp = async () => {
    if (!otp) return;

    try {
      setLoading(true);

      const { data } = await axios.post<
        SuccessResponse<{ user: any; token: string }>
      >('/auth/submit-otp', {
        otp,
        phone,
      });

      setOtpSent(false);
      setPhone('');

      setAuthToken(data.data.token);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

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
          <Button onPress={submitOtp} title="Submit OTP" />
        </>
      ) : (
        <>
          <TextInput
            onChangeText={setPhone}
            value={phone}
            placeholder="Enter your phone number"
            keyboardType="numeric"
          />
          <Button onPress={sendOtp} title="Send OTP" />
        </>
      )}

      <StatusBar style="auto" />
    </View>
  );
}
