import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GREEN = '#087F68';
const INK = '#171A18';
const MUTED = '#77817A';
const LINE = '#E3EAE6';

const POLICY_ITEMS = [
  {
    key: 'age_eligibility',
    label: 'I confirm that I am 18 years of age or older and legally eligible to use SELLSPACE.',
    url: 'https://sellspace-corporate.vercel.app/terms',
  },
  {
    key: 'terms',
    label: 'I understand and agree to follow SELLSPACE Policies, Terms and Conditions.',
    url: 'https://sellspace-corporate.vercel.app/terms',
  },
  {
    key: 'community_rules',
    label: 'I understand and agree to follow SELLSPACE Community Rules.',
    url: 'https://sellspace-corporate.vercel.app/community-rules',
  },
  {
    key: 'privacy',
    label: 'I acknowledge that my personal information will be collected and processed in accordance with the SELLSPACE Privacy Policy.',
    url: 'https://sellspace-corporate.vercel.app/privacy',
  },
] as const;

// The new onboarding tables are intentionally not yet in generated database.types.ts.
// Keep this narrow cast until the migration is applied and types are regenerated.
const db = supabase as any;

type Step = 'welcome' | 'personal' | 'address' | 'privacy' | 'complete';

export default function AccountSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('welcome');
  const [busy, setBusy] = useState(false);

  const [fullName, setFullName] = useState(
    typeof user?.user_metadata?.display_name === 'string'
      ? user.user_metadata.display_name
      : ''
  );
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState(
    typeof user?.phone === 'string' ? user.phone : ''
  );
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [barangay, setBarangay] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [accepted, setAccepted] = useState<boolean[]>([false, false, false, false]);

  const progress = useMemo(() => {
    const index = ({ welcome: 0, personal: 1, address: 2, privacy: 3, complete: 4 } as const)[step];
    return Math.min(index, 3);
  }, [step]);

  const ageIsValid = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const beforeBirthday =
      today.getMonth() < date.getMonth() ||
      (today.getMonth() === date.getMonth() && today.getDate() < date.getDate());
    if (beforeBirthday) age -= 1;
    return age >= 18 && date <= today;
  };

  const saveProgress = async (currentStep: string) => {
    if (!user) throw new Error('Please sign in to set up your account.');
    const { error } = await db.from('account_setup').upsert({
      user_id: user.id,
      birth_date: birthDate || null,
      current_step: currentStep,
      skipped_at: null,
    }, { onConflict: 'user_id' });
    if (error) throw error;
  };

  const startSetup = () => setStep('personal');

  const skipForNow = async () => {
    if (!user) {
      router.replace('/(tabs)');
      return;
    }
    try {
      setBusy(true);
      const { error } = await db.from('account_setup').upsert({
        user_id: user.id,
        current_step: 'welcome',
        skipped_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Could not save your progress', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const continuePersonal = async () => {
    if (!fullName.trim()) return Alert.alert('Full name required', 'Enter your full name to continue.');
    if (!ageIsValid(birthDate)) return Alert.alert('Check your birth date', 'Enter a valid date in YYYY-MM-DD format. You must be at least 18 years old.');
    if (!/^\+?[0-9\s()-]{8,20}$/.test(phone.trim())) return Alert.alert('Check your contact number', 'Enter a valid phone number, including country code if available.');
    try {
      setBusy(true);
      const { error: profileError } = await db.from('profiles').upsert({
        id: user?.id,
        display_name: fullName.trim(),
        phone: phone.trim(),
      }, { onConflict: 'id' });
      if (profileError) throw profileError;
      await saveProgress('address');
      setStep('address');
    } catch (error) {
      Alert.alert('Could not save personal information', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const continueAddress = async () => {
    if (!houseNumber.trim() || !street.trim() || !barangay.trim() || !city.trim() || !region.trim()) {
      return Alert.alert('Address incomplete', 'Complete the house or unit number, street, barangay, city or municipality, and region.');
    }
    try {
      setBusy(true);
      const { data: existing, error: lookupError } = await db.from('user_addresses')
        .select('id')
        .eq('user_id', user?.id)
        .eq('is_default', true)
        .maybeSingle();
      if (lookupError) throw lookupError;

      const address = {
        user_id: user?.id,
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

      const result = existing?.id
        ? await db.from('user_addresses').update(address).eq('id', existing.id).eq('user_id', user?.id)
        : await db.from('user_addresses').insert(address);
      if (result.error) throw result.error;

      await saveProgress('privacy');
      setStep('privacy');
    } catch (error) {
      Alert.alert('Could not save delivery address', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const finishSetup = async () => {
    if (!accepted.every(Boolean)) return;
    try {
      setBusy(true);

      const { data: documents, error: docsError } = await db
        .from('account_setup_policy_documents')
        .select('policy_key, version, active')
        .eq('active', true);
      if (docsError) throw docsError;

      const activeDocs = new Map((documents ?? []).map((doc: any) => [doc.policy_key, doc]));
      const missing = POLICY_ITEMS.filter(item => !activeDocs.has(item.key));
      if (missing.length) {
        throw new Error('SELLSPACE policy documents are not published and activated yet. Your information is saved, but setup cannot be finalized until the current policies are available.');
      }

      const records = POLICY_ITEMS.map(item => {
        const doc = activeDocs.get(item.key) as { version: string };
        return {
          user_id: user?.id,
          policy_key: item.key,
          policy_version: doc.version,
        };
      });
      const { error: acceptanceError } = await db.from('policy_acceptances').upsert(records, {
        onConflict: 'user_id,policy_key,policy_version',
        ignoreDuplicates: true,
      });
      if (acceptanceError) throw acceptanceError;

      await saveProgress('privacy');
      const { data, error } = await db.rpc('finalize_account_setup');
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.completed) throw new Error('SELLSPACE could not confirm account setup completion.');

      setStep('complete');
    } catch (error) {
      Alert.alert('Setup not completed yet', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const goHome = () => router.replace('/(tabs)');

  const field = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    placeholder: string,
    options?: { keyboardType?: 'default' | 'phone-pad' | 'number-pad'; autoCapitalize?: 'none' | 'words' | 'sentences'; maxLength?: number }
  ) => (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A0AAA4"
        style={s.input}
        keyboardType={options?.keyboardType ?? 'default'}
        autoCapitalize={options?.autoCapitalize ?? 'words'}
        maxLength={options?.maxLength}
      />
    </View>
  );

  const primary = (label: string, action: () => void, disabled = false) => (
    <Pressable onPress={action} disabled={disabled || busy} style={[s.primary, (disabled || busy) && s.disabled]}>
      {busy ? <ActivityIndicator color="#FFF" /> : <Text style={s.primaryText}>{label}</Text>}
    </Pressable>
  );

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
          <View style={s.brandRow}>
            <View style={s.brandMark}><Text style={s.brandMarkText}>S</Text></View>
            <Text style={s.brand}>SELLSPACE</Text>
            <Text style={s.brandCaption}>ACCOUNT SETUP</Text>
          </View>

          {step !== 'welcome' && step !== 'complete' && (
            <View style={s.progressWrap}>
              <View style={s.progressTrack}><View style={[s.progressFill, { width: `${(progress / 3) * 100}%` }]} /></View>
              <Text style={s.progressText}>STEP {progress} OF 3</Text>
            </View>
          )}

          {step === 'welcome' && (
            <View style={s.content}>
              <Text style={s.eyebrow}>LET'S GET YOU STARTED</Text>
              <Text style={s.title}>Welcome to SELLSPACE.</Text>
              <Text style={s.subtitle}>A few details will help us make your buying and selling experience smoother, safer, and more personal.</Text>
              <View style={s.welcomeCard}>
                <Text style={s.welcomeIcon}>✳</Text>
                <Text style={s.cardTitle}>Your account, ready for business.</Text>
                <Text style={s.cardBody}>Set up your personal information, delivery address, and account preferences. You can review and update your details later.</Text>
              </View>
              {primary('Start Setup', startSetup)}
              <Pressable style={s.skip} onPress={skipForNow} disabled={busy}>
                <Text style={s.skipText}>Skip for Now</Text>
              </Pressable>
              <Text style={s.footnote}>You can continue browsing SELLSPACE if you choose to finish setup later.</Text>
            </View>
          )}

          {step === 'personal' && (
            <View style={s.content}>
              <Text style={s.eyebrow}>PERSONAL INFORMATION</Text>
              <Text style={s.title}>Let's get to know you.</Text>
              <Text style={s.subtitle}>Use your real details so your account and deliveries can be handled accurately.</Text>
              {field('Full name', fullName, setFullName, 'Enter your full name')}
              {field('Birth date', birthDate, setBirthDate, 'YYYY-MM-DD', { autoCapitalize: 'none', maxLength: 10 })}
              <Text style={s.helper}>You must be at least 18 years old to create a SELLSPACE account.</Text>
              {field('Contact number', phone, setPhone, '+63 9XX XXX XXXX', { keyboardType: 'phone-pad', autoCapitalize: 'none', maxLength: 20 })}
              <View style={s.notice}>
                <Text style={s.noticeTitle}>Phone verification pending</Text>
                <Text style={s.noticeBody}>Your number will be saved, but it is not verified yet. SMS verification will be enabled once the provider is configured.</Text>
              </View>
              {primary('Continue to Delivery Address', continuePersonal)}
              <Pressable style={s.back} onPress={() => setStep('welcome')}><Text style={s.backText}>Back</Text></Pressable>
            </View>
          )}

          {step === 'address' && (
            <View style={s.content}>
              <Text style={s.eyebrow}>DELIVERY ADDRESS</Text>
              <Text style={s.title}>Where should we deliver?</Text>
              <Text style={s.subtitle}>Add your primary delivery address. You can update it from your account later.</Text>
              {field('House no. / Lot & block / Unit no.', houseNumber, setHouseNumber, 'e.g. Unit 4B, Lot 12 Block 3')}
              {field('Street', street, setStreet, 'Street name')}
              {field('Barangay', barangay, setBarangay, 'Barangay')}
              {field('Municipality / City', city, setCity, 'City or municipality')}
              {field('Region', region, setRegion, 'Region')}
              {field('Postal code (optional)', postalCode, setPostalCode, 'Postal code', { keyboardType: 'number-pad', autoCapitalize: 'none', maxLength: 10 })}
              <View style={s.country}><Text style={s.label}>Country</Text><Text style={s.countryValue}>Philippines</Text></View>
              {primary('Continue to Privacy', continueAddress)}
              <Pressable style={s.back} onPress={() => setStep('personal')}><Text style={s.backText}>Back</Text></Pressable>
            </View>
          )}

          {step === 'privacy' && (
            <View style={s.content}>
              <Text style={s.eyebrow}>YOUR PRIVACY MATTERS</Text>
              <Text style={s.title}>A few important things.</Text>
              <Text style={s.subtitle}>Please review the documents and confirm each statement before continuing.</Text>
              <View style={s.policyLinks}>
                <Pressable onPress={() => Linking.openURL(POLICY_ITEMS[1].url)} style={s.policyLink}><Text style={s.policyLinkText}>Terms & Conditions ↗</Text></Pressable>
                <Pressable onPress={() => Linking.openURL(POLICY_ITEMS[2].url)} style={s.policyLink}><Text style={s.policyLinkText}>Community Rules ↗</Text></Pressable>
                <Pressable onPress={() => Linking.openURL(POLICY_ITEMS[3].url)} style={s.policyLink}><Text style={s.policyLinkText}>Privacy Policy ↗</Text></Pressable>
              </View>
              <View style={s.checkList}>
                {POLICY_ITEMS.map((item, index) => (
                  <Pressable key={item.key} style={s.checkRow} onPress={() => setAccepted(current => current.map((value, i) => i === index ? !value : value))}>
                    <View style={[s.checkbox, accepted[index] && s.checkboxChecked]}>
                      {accepted[index] && <Text style={s.checkmark}>✓</Text>}
                    </View>
                    <Text style={s.checkText}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={s.helper}>All four acknowledgments are required. Your choices are recorded against the active policy versions.</Text>
              {primary('Complete Setup', finishSetup, !accepted.every(Boolean))}
              <Pressable style={s.back} onPress={() => setStep('address')}><Text style={s.backText}>Back</Text></Pressable>
            </View>
          )}

          {step === 'complete' && (
            <View style={s.content}>
              <View style={s.successMark}><Text style={s.successCheck}>✓</Text></View>
              <Text style={[s.eyebrow, { textAlign: 'center' }]}>YOU'RE ALL SET</Text>
              <Text style={[s.title, { textAlign: 'center' }]}>Welcome aboard.</Text>
              <Text style={[s.subtitle, { textAlign: 'center' }]}>Your SELLSPACE account setup has been completed successfully.</Text>
              <View style={s.notice}>
                <Text style={s.noticeTitle}>One last note</Text>
                <Text style={s.noticeBody}>Your contact number may still need SMS verification. We will clearly show its status in your account until verification is available.</Text>
              </View>
              {primary('Go to Home', goHome)}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  page: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 44 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  brandMark: { width: 30, height: 30, borderRadius: 9, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  brandMarkText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  brand: { color: INK, fontSize: 13, fontWeight: '900', letterSpacing: 1.4 },
  brandCaption: { marginLeft: 'auto', color: '#929B95', fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  progressWrap: { marginBottom: 30 },
  progressTrack: { height: 4, borderRadius: 5, backgroundColor: '#EAF0EC', overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: GREEN, borderRadius: 5 },
  progressText: { color: '#929B95', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginTop: 9 },
  content: { flex: 1 },
  eyebrow: { color: GREEN, fontSize: 10, fontWeight: '900', letterSpacing: 1.8, marginBottom: 11 },
  title: { color: INK, fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { color: MUTED, fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 25 },
  welcomeCard: { padding: 21, borderRadius: 19, backgroundColor: '#F4F8F5', borderWidth: 1, borderColor: '#E5EEE8', marginTop: 8, marginBottom: 24 },
  welcomeIcon: { color: GREEN, fontSize: 26, marginBottom: 13 },
  cardTitle: { color: INK, fontSize: 17, fontWeight: '800' },
  cardBody: { color: MUTED, fontSize: 13, lineHeight: 20, marginTop: 8 },
  field: { marginBottom: 16 },
  label: { color: '#333C36', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  input: { minHeight: 52, borderWidth: 1, borderColor: LINE, borderRadius: 13, paddingHorizontal: 14, color: INK, fontSize: 14, backgroundColor: '#FFFFFF' },
  helper: { color: '#8A948E', fontSize: 11, lineHeight: 17, marginTop: -7, marginBottom: 17 },
  notice: { padding: 15, backgroundColor: '#F5F8F6', borderRadius: 14, borderWidth: 1, borderColor: '#E5ECE7', marginBottom: 22 },
  noticeTitle: { color: '#34433A', fontSize: 12, fontWeight: '800' },
  noticeBody: { color: '#77817A', fontSize: 12, lineHeight: 18, marginTop: 5 },
  primary: { minHeight: 54, borderRadius: 14, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 7 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  skip: { alignItems: 'center', paddingVertical: 17 },
  skipText: { color: GREEN, fontSize: 13, fontWeight: '800' },
  footnote: { color: '#9AA39D', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 4 },
  back: { alignSelf: 'center', paddingVertical: 16, paddingHorizontal: 22 },
  backText: { color: '#6F7A73', fontSize: 13, fontWeight: '700' },
  country: { borderWidth: 1, borderColor: LINE, borderRadius: 13, padding: 13, marginBottom: 17 },
  countryValue: { color: INK, fontSize: 14, fontWeight: '600' },
  policyLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 20 },
  policyLink: { borderRadius: 10, borderWidth: 1, borderColor: '#DCE8E1', paddingHorizontal: 11, paddingVertical: 9, backgroundColor: '#FAFCFA' },
  policyLinkText: { color: GREEN, fontSize: 11, fontWeight: '800' },
  checkList: { borderWidth: 1, borderColor: LINE, borderRadius: 16, paddingHorizontal: 14, marginBottom: 18 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 15, gap: 11 },
  checkbox: { width: 21, height: 21, borderRadius: 6, borderWidth: 1.5, borderColor: '#B9C6BE', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxChecked: { backgroundColor: GREEN, borderColor: GREEN },
  checkmark: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  checkText: { flex: 1, color: '#3F4943', fontSize: 12, lineHeight: 18 },
  successMark: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#E7F4ED', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 44, marginBottom: 25 },
  successCheck: { color: GREEN, fontSize: 36, fontWeight: '800' },
});
