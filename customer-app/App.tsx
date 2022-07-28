import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import type { SuccessResponse } from '../shared/responses.type';

axios.defaults.baseURL = 'http://192.168.29.42:4080/c';

const AUTH_TOKEN = 'auth-token';
async function getAuthToken() {
  return SecureStore.getItemAsync(AUTH_TOKEN);
}
async function setAuthToken(token: string) {
  await SecureStore.setItemAsync(AUTH_TOKEN, token);
}
async function removeAuthToken() {
  await SecureStore.deleteItemAsync(AUTH_TOKEN);
}

type LoginProps = {
  onLogin?: (token: string) => void;
};
function Login({ onLogin }: LoginProps) {
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

      onLogin && onLogin(data.data.token);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
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
            style={styles.input}
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
            style={styles.input}
          />
          <Button onPress={sendOtp} title="Send OTP" />
        </>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

export default function Main() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    getAuthToken().then((token) => {
      setIsLoggedIn(!!token);
    });
  }, []);

  return isLoggedIn ? (
    <>
      <Text>You're logged in</Text>
      <Button
        title="Logout"
        onPress={async () => {
          await removeAuthToken();
          setIsLoggedIn(false);
        }}
      />
    </>
  ) : (
    <Login
      onLogin={async (token) => {
        await setAuthToken(token);
        setIsLoggedIn(true);
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});
