import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GREEN = '#087F68';
const db = supabase as any;

export default function PersonalInformationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileResult, setupResult] = await Promise.all([
        supabase.from('profiles').select('display_name, phone').eq('id', user.id).maybeSingle(),
        db.from('account_setup').select('birth_date').eq('user_id', user.id).maybeSingle(),
      ]);
      if (profileResult.error) throw profileResult.error;
      if (setupResult.error) throw setupResult.error;
      setName(profileResult.data?.display_name ?? (typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name : ''));
      setPhone(profileResult.data?.phone ?? user.phone ?? '');
      setBirthDate(setupResult.data?.birth_date ?? '');
      setPhoneVerified(Boolean(user.phone_confirmed_at));
    } catch (error) {
      Alert.alert('Could not load your details', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const save = async () => {
    if (!user) return;
    if (!name.trim()) return Alert.alert('Name required', 'Please enter your full name.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return Alert.alert('Birth date required', 'Use YYYY-MM-DD format.');
    if (!phone.trim()) return Alert.alert('Contact number required', 'Please enter your contact number.');
    try {
      setSaving(true);
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        display_name: name.trim(),
        phone: phone.trim(),
      }, { onConflict: 'id' });
      if (profileError) throw profileError;

      const { error: setupError } = await db.from('account_setup').upsert({
        user_id: user.id,
        birth_date: birthDate,
      }, { onConflict: 'user_id' });
      if (setupError) throw setupError;

      Alert.alert('Changes saved', 'Your personal information has been updated.');
      await load();
    } catch (error) {
      Alert.alert('Could not save changes', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SafeAreaView style={s.center}><ActivityIndicator color={GREEN} size="large" /></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={s.back}><Text style={s.backText}>‹  Account</Text></Pressable>
          <Text style={s.eyebrow}>ACCOUNT DETAILS</Text>
          <Text style={s.title}>Personal information</Text>
          <Text style={s.subtitle}>Keep your details accurate so SELLSPACE can support your account and deliveries.</Text>

          <Text style={s.label}>Full name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor="#9AA39D" style={s.input} autoCapitalize="words" />

          <Text style={s.label}>Birth date</Text>
          <TextInput value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" placeholderTextColor="#9AA39D" style={s.input} maxLength={10} />

          <Text style={s.label}>Contact number</Text>
          <TextInput value={phone} onChangeText={setPhone} placeholder="+63 9XX XXX XXXX" placeholderTextColor="#9AA39D" style={s.input} keyboardType="phone-pad" />

          <View style={s.statusCard}>
            <View style={[s.statusDot, { backgroundColor: phoneVerified ? GREEN : '#D97706' }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.statusTitle}>{phoneVerified ? 'Phone number verified' : 'Phone verification pending'}</Text>
              <Text style={s.statusText}>{phoneVerified ? 'Your current Supabase Auth phone is confirmed.' : 'Changing or entering a number here does not verify it. SMS verification will be available once configured.'}</Text>
            </View>
          </View>

          <Pressable style={[s.button, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.buttonText}>Save Changes</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  page: { padding: 24, paddingBottom: 48 }, back: { alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 28 },
  backText: { color: '#5E6962', fontSize: 14, fontWeight: '700' }, eyebrow: { color: GREEN, fontSize: 10, fontWeight: '900', letterSpacing: 1.8, marginBottom: 10 },
  title: { color: '#171A18', fontSize: 29, fontWeight: '900' }, subtitle: { color: '#77817A', fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 25 },
  label: { color: '#333C36', fontSize: 12, fontWeight: '800', marginBottom: 8, marginTop: 15 },
  input: { height: 52, borderWidth: 1, borderColor: '#E3EAE6', borderRadius: 13, paddingHorizontal: 14, color: '#171A18', fontSize: 14 },
  statusCard: { flexDirection: 'row', gap: 11, padding: 15, borderRadius: 14, backgroundColor: '#F5F8F6', marginTop: 22, marginBottom: 18 },
  statusDot: { width: 9, height: 9, borderRadius: 5, marginTop: 4 }, statusTitle: { color: '#34433A', fontSize: 12, fontWeight: '800' },
  statusText: { color: '#77817A', fontSize: 11, lineHeight: 17, marginTop: 5 },
  button: { height: 54, borderRadius: 14, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
});
