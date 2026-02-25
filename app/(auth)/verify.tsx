import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { syncUser } from '@/lib/api';

const OTP_LENGTH = 6;

export default function VerifyScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { getToken } = useAuth();
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const [codes, setCodes] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return;
    const next = [...codes];
    next[index] = text.slice(-1);
    setCodes(next);
    setError(null);
    if (text && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !codes[index] && index > 0) {
      const next = [...codes];
      next[index - 1] = '';
      setCodes(next);
      inputs.current[index - 1]?.focus();
    }
  };

  const fullCode = codes.join('');

  const handleVerify = async () => {
    if (!isLoaded || fullCode.length < OTP_LENGTH) return;
    setError(null);
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'phone_code',
        code: fullCode,
      });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        try {
          const token = await getToken();
          if (token) await syncUser(token);
        } catch {
          // Non-critical
        }
        router.replace('/(app)/dashboard');
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        'Invalid code. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded || !phone) return;
    setError(null);
    setLoading(true);
    try {
      await signIn.create({ strategy: 'phone_code', identifier: phone });
      setCodes(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyDisabled = loading || fullCode.length < OTP_LENGTH;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-7 gap-4">
        {/* Back button */}
        <Pressable
          className="absolute top-16 left-6"
          onPress={() => router.back()}
        >
          <Text className="text-indigo-400 text-base font-medium">← Back</Text>
        </Pressable>

        <Text className="text-3xl font-bold text-slate-50 mb-1">
          Verify your number
        </Text>
        <Text className="text-sm text-slate-400 leading-5 mb-2">
          Enter the 6-digit code sent to{' '}
          <Text className="text-indigo-200 font-semibold">{phone}</Text>
        </Text>

        {/* OTP boxes */}
        <View className="flex-row justify-between gap-2 my-2">
          {codes.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              className={`flex-1 h-14 rounded-xl text-center text-2xl font-bold text-slate-50 ${
                digit
                  ? 'border-2 border-indigo-500 bg-slate-800'
                  : 'border border-slate-700 bg-slate-800'
              }`}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </View>

        {error ? (
          <Text className="text-red-400 text-sm -mt-2">{error}</Text>
        ) : null}

        <Pressable
          className={`rounded-xl py-4 items-center mt-1 bg-indigo-500 ${verifyDisabled ? 'opacity-50' : 'opacity-100'}`}
          onPress={handleVerify}
          disabled={verifyDisabled}
          accessibilityRole="button"
          accessibilityLabel="Verify OTP"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">Verify</Text>
          )}
        </Pressable>

        <Pressable
          className="items-center py-2"
          onPress={handleResend}
          disabled={loading}
        >
          <Text className="text-indigo-400 text-sm">
            Didn't receive a code? Resend
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
