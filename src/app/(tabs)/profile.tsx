
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>YOUR ACCOUNT</Text>
      <Text style={styles.title}>Your space.</Text>
      <Text style={styles.description}>
        Your profile, orders, account settings, and security will live here.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    justifyContent: 'center',
  },
  label: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    color: '#171717',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    color: '#737873',
    fontSize: 15,
    lineHeight: 23,
  },
});
