import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
const GREEN = '#087F68';

export default function SignInScreen() {
  const router = useRouter(); const { signIn } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!email.trim() || !password) return Alert.alert('Missing details', 'Enter your email and password.');
    try { setBusy(true); await signIn(email, password); router.replace('/'); }
    catch (e) { Alert.alert('Sign in failed', e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={s.safe}><KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()} style={s.back}><Text style={s.backText}>‹  Back</Text></Pressable>
      <Text style={s.eyebrow}>SELLSPACE ACCOUNT</Text><Text style={s.title}>Welcome back.</Text><Text style={s.sub}>Sign in to continue to your marketplace.</Text>
      <View style={s.form}><Text style={s.label}>Email address</Text>
        <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#9AA39D" autoCapitalize="none" autoComplete="email" keyboardType="email-address" />
        <Text style={[s.label, { marginTop: 20 }]}>Password</Text>
        <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor="#9AA39D" secureTextEntry autoCapitalize="none" onSubmitEditing={submit} />
        <Pressable style={s.button} onPress={submit} disabled={busy}>{busy ? <ActivityIndicator color="#FFF" /> : <Text style={s.buttonText}>Sign In</Text>}</Pressable>
      </View>
      <View style={s.footer}><Text style={s.footerText}>New to SELLSPACE?</Text><Pressable onPress={() => router.replace('/auth/sign-up')}><Text style={s.link}> Create an account</Text></Pressable></View>
    </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const s = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: '#FFF' }, body: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  back: { alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 42 }, backText: { color: '#59635D', fontSize: 15, fontWeight: '600' },
  eyebrow: { color: GREEN, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 12 }, title: { color: '#171A18', fontSize: 32, fontWeight: '800' },
  sub: { color: '#77817A', fontSize: 14, lineHeight: 21, marginTop: 8 }, form: { marginTop: 34 },
  label: { color: '#303833', fontSize: 12, fontWeight: '700', marginBottom: 9 }, input: { height: 54, borderWidth: 1, borderColor: '#E1E7E3', borderRadius: 13, paddingHorizontal: 15, color: '#171A18', fontSize: 14 },
  button: { height: 54, borderRadius: 13, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginTop: 28 }, buttonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 }, footerText: { color: '#7A837D', fontSize: 13 }, link: { color: GREEN, fontSize: 13, fontWeight: '800' },
});
