import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
const GREEN = '#087F68';

export default function SignUpScreen() {
  const router = useRouter(); const { signUp } = useAuth();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState(''); const [busy, setBusy] = useState(false); const [verify, setVerify] = useState(false);
  const submit = async () => {
    if (!name.trim() || !email.trim() || !password || !confirm) return Alert.alert('Missing details', 'Complete all fields.');
    if (password.length < 6) return Alert.alert('Password too short', 'Use at least 6 characters.');
    if (password !== confirm) return Alert.alert('Passwords do not match', 'Check both password fields.');
    try { setBusy(true); const result = await signUp(name, email, password); if (result.needsEmailConfirmation) setVerify(true); else router.replace('/'); }
    catch (e) { Alert.alert('Could not create account', e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={s.safe}><KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()} style={s.back}><Text style={s.backText}>‹  Back</Text></Pressable>
      <Text style={s.eyebrow}>JOIN SELLSPACE</Text>
      <Text style={s.title}>{verify ? 'Check your email.' : 'Make space for business.'}</Text>
      <Text style={s.sub}>{verify ? 'We sent a verification link. Verify your email, then return here to sign in.' : 'Create one account to buy, sell, and manage your marketplace activity.'}</Text>
      {verify ? <View style={s.confirm}><Text style={s.confirmTitle}>Email verification required</Text><Text style={s.confirmText}>Your account cannot sign in until the email address is verified.</Text><Pressable style={s.button} onPress={() => router.replace('/auth/sign-in')}><Text style={s.buttonText}>Go to Sign In</Text></Pressable></View> :
      <View style={s.form}>
        <Text style={s.label}>Display name</Text><TextInput style={s.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#9AA39D" autoCapitalize="words" />
        <Text style={s.spaced}>Email address</Text><TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#9AA39D" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Text style={s.spaced}>Password</Text><TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="At least 6 characters" placeholderTextColor="#9AA39D" secureTextEntry autoCapitalize="none" />
        <Text style={s.spaced}>Confirm password</Text><TextInput style={s.input} value={confirm} onChangeText={setConfirm} placeholder="Re-enter your password" placeholderTextColor="#9AA39D" secureTextEntry autoCapitalize="none" onSubmitEditing={submit} />
        <Pressable style={s.button} onPress={submit} disabled={busy}>{busy ? <ActivityIndicator color="#FFF" /> : <Text style={s.buttonText}>Create Account</Text>}</Pressable>
      </View>}
      {!verify && <View style={s.footer}><Text style={s.footerText}>Already have an account?</Text><Pressable onPress={() => router.replace('/auth/sign-in')}><Text style={s.link}> Sign In</Text></Pressable></View>}
    </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const s = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: '#FFF' }, body: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  back: { alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 35 }, backText: { color: '#59635D', fontSize: 15, fontWeight: '600' },
  eyebrow: { color: GREEN, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 12 }, title: { color: '#171A18', fontSize: 30, lineHeight: 37, fontWeight: '800' },
  sub: { color: '#77817A', fontSize: 14, lineHeight: 21, marginTop: 8 }, form: { marginTop: 28 }, label: { color: '#303833', fontSize: 12, fontWeight: '700', marginBottom: 9 },
  spaced: { color: '#303833', fontSize: 12, fontWeight: '700', marginTop: 17, marginBottom: 9 },
  input: { height: 52, borderWidth: 1, borderColor: '#E1E7E3', borderRadius: 13, paddingHorizontal: 15, color: '#171A18', fontSize: 14 },
  button: { height: 54, borderRadius: 13, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginTop: 25 }, buttonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 27 }, footerText: { color: '#7A837D', fontSize: 13 }, link: { color: GREEN, fontSize: 13, fontWeight: '800' },
  confirm: { marginTop: 28, padding: 20, borderRadius: 17, borderWidth: 1, borderColor: '#DCEBE4', backgroundColor: '#F5F9F6' },
  confirmTitle: { color: '#202522', fontSize: 16, fontWeight: '800' }, confirmText: { color: '#6E7972', fontSize: 13, lineHeight: 20, marginTop: 8 },
});
