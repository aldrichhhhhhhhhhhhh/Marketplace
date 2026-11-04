import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const GREEN = '#087F68';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const name = (typeof user?.user_metadata?.display_name === 'string' && user.user_metadata.display_name.trim())
    || user?.email?.split('@')[0] || 'SELLSPACE member';

  const logout = () => Alert.alert('Sign out?', 'You can sign back in anytime.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: async () => {
      try { setBusy(true); await signOut(); }
      catch (e) { Alert.alert('Sign out failed', e instanceof Error ? e.message : 'Please try again.'); }
      finally { setBusy(false); }
    }},
  ]);

  if (loading) return <SafeAreaView style={s.center}><ActivityIndicator color={GREEN} size="large" /></SafeAreaView>;

  const row = (title: string, detail: string, action?: () => void, soon = false) => (
    <Pressable disabled={!action} onPress={action} style={s.row}>
      <View style={{ flex: 1 }}><Text style={s.rowTitle}>{title}</Text><Text style={s.rowDetail}>{detail}</Text></View>
      <Text style={s.chevron}>{soon ? 'SOON' : action ? '›' : ''}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.eyebrow}>YOUR ACCOUNT</Text>
        <Text style={s.heading}>{user ? 'Your space.' : 'Welcome to SELLSPACE.'}</Text>
        <Text style={s.intro}>{user ? 'Your marketplace activity, all in one place.' : 'Sign in or create an account to unlock the full marketplace experience.'}</Text>

        {user ? <>
          <View style={s.identity}>
            <View style={s.avatar}><Text style={s.avatarText}>{name.charAt(0).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}><Text style={s.name}>{name}</Text><Text style={s.email}>{user.email}</Text><Text style={s.active}>ACCOUNT ACTIVE</Text></View>
          </View>
          <Text style={s.section}>YOUR SELLSPACE</Text>
          <View style={s.card}>
            {row('My Orders', 'Your purchases and order updates', undefined, true)}
            <View style={s.line} />
            {row('My Listings', 'Products you have published', undefined, true)}
            <View style={s.line} />
            {row('Favorites', 'Products you have saved', () => router.push('/favorites'))}
          </View>
          <Text style={s.section}>ACCOUNT</Text>
          <View style={s.card}>
            {row('Personal information', 'Profile and contact details', undefined, true)}
            <View style={s.line} />
            {row('Privacy & security', 'Keep your account protected', undefined, true)}
          </View>
          <Pressable style={s.logout} onPress={logout} disabled={busy}>
            {busy ? <ActivityIndicator color="#B42318" /> : <Text style={s.logoutText}>Sign Out</Text>}
          </Pressable>
        </> : <>
          <View style={s.guest}>
            <Text style={s.guestTitle}>One account. Buy and sell.</Text>
            <Text style={s.guestText}>Create your SELLSPACE account to save products, contact sellers, manage orders, and publish your own listings.</Text>
            <Pressable style={s.primary} onPress={() => router.push('/auth/sign-in')}><Text style={s.primaryText}>Sign In</Text></Pressable>
            <Pressable style={s.secondary} onPress={() => router.push('/auth/sign-up')}><Text style={s.secondaryText}>Create Account</Text></Pressable>
          </View>
          <Text style={s.note}>You can continue browsing as a guest. Some actions will require you to sign in.</Text>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  body: { padding: 24, paddingBottom: 48 }, eyebrow: { color: GREEN, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  heading: { color: '#171A18', fontSize: 30, fontWeight: '800', marginBottom: 9 }, intro: { color: '#737B76', fontSize: 14, lineHeight: 21, marginBottom: 26 },
  identity: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6F8F7', borderRadius: 18, padding: 18, marginBottom: 28 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#DCEFE9', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { color: GREEN, fontSize: 22, fontWeight: '800' }, name: { color: '#171A18', fontSize: 16, fontWeight: '800' },
  email: { color: '#737B76', fontSize: 13, marginTop: 3 }, active: { color: GREEN, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 8 },
  section: { color: '#89918C', fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 10, marginTop: 4 },
  card: { borderWidth: 1, borderColor: '#E9EDEA', borderRadius: 16, paddingHorizontal: 15, marginBottom: 24 },
  row: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  rowTitle: { color: '#202522', fontSize: 14, fontWeight: '700' }, rowDetail: { color: '#858D88', fontSize: 12, marginTop: 4 },
  chevron: { color: GREEN, fontSize: 16, fontWeight: '700' }, line: { height: 1, backgroundColor: '#EEF1EF' },
  logout: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: '#F1D8D5', alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: '#B42318', fontSize: 14, fontWeight: '700' }, guest: { borderRadius: 20, backgroundColor: '#F5F8F6', padding: 20, borderWidth: 1, borderColor: '#E8EFEB' },
  guestTitle: { color: '#171A18', fontSize: 19, fontWeight: '800' }, guestText: { color: '#69736D', fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 20 },
  primary: { height: 50, borderRadius: 13, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFF', fontSize: 14, fontWeight: '800' }, secondary: { height: 50, borderRadius: 13, borderWidth: 1, borderColor: '#D8E2DC', alignItems: 'center', justifyContent: 'center', marginTop: 10, backgroundColor: '#FFF' },
  secondaryText: { color: '#202522', fontSize: 14, fontWeight: '700' }, note: { color: '#8A928D', fontSize: 12, lineHeight: 18, marginTop: 15 },
});
