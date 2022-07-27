import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';

export default function App() {
  const [phone, setPhone] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);

  const sendOtp = async () => {
    if (!phone) return;

    try {
      setSendingOtp(true);

      await axios.post(
        'https://da6c-2405-201-a804-8808-f6d1-3cbf-ad04-abcf.in.ngrok.io/c/auth/request-otp',
        {
          phone,
        },
      );
    } catch (error) {
      console.error(error);
    }
    setSendingOtp(false);
  };

  return (
    <View style={styles.container}>
      {sendingOtp ? (
        <ActivityIndicator size="large" />
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
