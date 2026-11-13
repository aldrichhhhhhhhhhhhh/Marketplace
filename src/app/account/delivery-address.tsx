import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GREEN = '#087F68';
const db = supabase as any;

export default function DeliveryAddressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [addressId, setAddressId] = useState<string | null>(null);
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [barangay, setBarangay] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await db.from('user_addresses')
        .select('id, house_number, street, barangay, city_municipality, region, postal_code')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();
      if (error) throw error;
      setAddressId(data?.id ?? null);
      setHouseNumber(data?.house_number ?? '');
      setStreet(data?.street ?? '');
      setBarangay(data?.barangay ?? '');
      setCity(data?.city_municipality ?? '');
      setRegion(data?.region ?? '');
      setPostalCode(data?.postal_code ?? '');
    } catch (error) {
      Alert.alert('Could not load your address', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const save = async () => {
    if (!user) return;
    if (![houseNumber, street, barangay, city, region].every(value => value.trim())) {
      return Alert.alert('Address incomplete', 'Complete the house or unit number, street, barangay, city or municipality, and region.');
    }
    try {
      setSaving(true);
      const payload = {
        user_id: user.id,
        address_label: 'Home',
        house_number: houseNumber.trim(),
        street: street.trim(),
        barangay: barangay.trim(),
        city_municipality: city.trim(),
        region: region.trim(),
        country: 'Philippines',
        postal_code: postalCode.trim() || null,
        is_default: true,
      };
      const result = addressId
        ? await db.from('user_addresses').update(payload).eq('id', addressId).eq('user_id', user.id)
        : await db.from('user_addresses').insert(payload).select('id').single();
      if (result.error) throw result.error;
      if (result.data?.id) setAddressId(result.data.id);
      Alert.alert('Address saved', 'Your primary delivery address has been updated.');
    } catch (error) {
      Alert.alert('Could not save address', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, value: string, onChangeText: (v: string) => void, placeholder: string, keyboardType: 'default' | 'number-pad' = 'default') => (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9AA39D" style={s.input} keyboardType={keyboardType} />
    </View>
  );

  if (loading) return <SafeAreaView style={s.center}><ActivityIndicator color={GREEN} size="large" /></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={s.back}><Text style={s.backText}>‹  Account</Text></Pressable>
          <Text style={s.eyebrow}>DELIVERY PREFERENCES</Text>
          <Text style={s.title}>Delivery address</Text>
          <Text style={s.subtitle}>Manage the primary address used for your SELLSPACE deliveries.</Text>
          {field('House no. / Lot & block / Unit no.', houseNumber, setHouseNumber, 'e.g. Unit 4B, Lot 12 Block 3')}
          {field('Street', street, setStreet, 'Street name')}
          {field('Barangay', barangay, setBarangay, 'Barangay')}
          {field('Municipality / City', city, setCity, 'City or municipality')}
          {field('Region', region, setRegion, 'Region')}
          {field('Postal code (optional)', postalCode, setPostalCode, 'Postal code', 'number-pad')}
          <View style={s.country}><Text style={s.label}>Country</Text><Text style={s.countryValue}>Philippines</Text></View>
          <Pressable style={[s.button, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.buttonText}>Save Address</Text>}
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
  title: { color: '#171A18', fontSize: 29, fontWeight: '900' }, subtitle: { color: '#77817A', fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 22 },
  field: { marginBottom: 15 }, label: { color: '#333C36', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  input: { height: 52, borderWidth: 1, borderColor: '#E3EAE6', borderRadius: 13, paddingHorizontal: 14, color: '#171A18', fontSize: 14 },
  country: { borderWidth: 1, borderColor: '#E3EAE6', borderRadius: 13, padding: 14, marginBottom: 18 },
  countryValue: { color: '#171A18', fontSize: 14, fontWeight: '700' },
  button: { height: 54, borderRadius: 14, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  buttonText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
});
