import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Button, TextInput, Snackbar, Appbar, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI } from '../services/api';
import { useAppState } from '../contexts/AppContext';

export default function AuthScreen({ navigation }) {
  const { signInServer, continueAsGuest } = useAppState();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [snackbar, setSnackbar] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const submit = async () => {
    if (loading) return;
    if (!email.includes('@')) {
      setSnackbar('Enter a valid email address.');
      return;
    }
    if (mode === 'forgot') {
      setLoading(true);
      const result = await userAPI.forgotPassword(email.trim());
      setLoading(false);
      setSnackbar(result?.message || 'If the email exists, a reset link was sent.');
      return;
    }
    if (mode === 'signup') {
      if (!name.trim()) {
        setSnackbar('Enter your name.');
        return;
      }
      if (!password) {
        setSnackbar('Enter a password.');
        return;
      }
      setLoading(true);
      const result = await userAPI.register(name.trim(), email.trim(), password);
      setLoading(false);
      if (!result) {
        setSnackbar('Unable to create account. Try again.');
        return;
      }
      try { await AsyncStorage.setItem('rememberMe', rememberMe ? '1' : '0'); } catch(e){}
      navigation.replace('MainTabs');
      return;
    }

    if (!password) {
      setSnackbar('Enter your password.');
      return;
    }
    setLoading(true);
    const profile = await signInServer({ email: email.trim(), password });
    setLoading(false);
    if (!profile) {
      setSnackbar('Login failed. Check your email and password.');
      return;
    }
    try { await AsyncStorage.setItem('rememberMe', rememberMe ? '1' : '0'); } catch(e){}
    navigation.replace('MainTabs');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Appbar.Header>
        <Appbar.Content title={mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Reset password' : 'Welcome back'} subtitle="Sign in to sync your notes, bookmarks, and devotional progress." />
      </Appbar.Header>

      {mode === 'signup' && (
        <TextInput label="Name" value={name} onChangeText={setName} mode="outlined" style={{ margin: 16 }} placeholder="Jane Doe" />
      )}

      <TextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" mode="outlined" style={{ margin: 16 }} placeholder="you@example.com" />
      {mode !== 'forgot' && (
        <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} mode="outlined" style={{ margin: 16 }} placeholder="Enter your password" right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword((s) => !s)} />} />
      )}

      <Button mode="contained" onPress={submit} loading={loading} style={{ margin: 16 }}>
        {mode === 'forgot' ? 'Send reset link' : mode === 'signup' ? 'Create account' : 'Login'}
      </Button>

      <Button mode="text" onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')}>{mode === 'signup' ? 'I already have an account' : 'Create a new account'}</Button>
      <Button mode="text" onPress={() => setMode(mode === 'forgot' ? 'login' : 'forgot')}>{mode === 'forgot' ? 'Back to login' : 'Forgot password?'}</Button>

      <Button mode="outlined" onPress={() => { continueAsGuest(); navigation.replace('MainTabs'); }} style={{ margin: 16 }}>
        Continue as guest
      </Button>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')}>{snackbar}</Snackbar>
    </KeyboardAvoidingView>
  );
}
