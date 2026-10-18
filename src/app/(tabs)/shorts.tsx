
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ShortsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>SHORTS</Text>
      <Text style={styles.title}>Discover something new.</Text>
      <Text style={styles.description}>
        Product videos and shoppable content will live here.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111412',
    padding: 24,
    justifyContent: 'center',
  },
  label: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    color: '#A6AEA8',
    fontSize: 15,
    lineHeight: 23,
  },
});
