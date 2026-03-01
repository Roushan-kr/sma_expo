import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SIGNIN_METHOD } from '@/lib/env';

export default function SignUpScreen() {
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();

  const [input, setInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!isLoaded) return;
    if (!input.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 4) {
      setError('Please enter a password (min 4 chars).');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp.create({
        emailAddress: input,
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      // On success, route to sign-in for login
      router.replace('/(auth)/sign-in');
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        'Failed to sign up. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !input || !password;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-7 gap-4">
        <Text className="text-4xl font-bold text-slate-50 mb-1">Create Account</Text>
        <Text className="text-base text-slate-400 mb-2">Enter your email and password to sign up</Text>

        <View className="border border-slate-700 rounded-xl bg-slate-800 px-4 py-3 mb-2">
          <TextInput
            className="text-base text-slate-50"
            placeholder="you@email.com"
            placeholderTextColor="#9ca3af"
            value={input}
            onChangeText={(t) => {
              setError(null);
              setInput(t);
            }}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            editable={!loading}
          />
        </View>
        <View className="border border-slate-700 rounded-xl bg-slate-800 px-4 py-3">
          <TextInput
            className="text-base text-slate-50"
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={(t) => {
              setError(null);
              setPassword(t);
            }}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
            editable={!loading}
          />
        </View>

        {error ? (
          <Text className="text-red-400 text-sm -mt-2">{error}</Text>
        ) : null}

        <Pressable
          className={`rounded-xl py-4 items-center mt-2 ${disabled ? 'bg-indigo-500 opacity-50' : 'bg-indigo-500'}`}
          onPress={handleSignUp}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Sign Up"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">Sign Up</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}