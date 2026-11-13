
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const WELCOME_COMPLETED_KEY = 'sellspace_welcome_completed_v2';

export default function LaunchScreen() {
  const { loading } = useAuth();
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (loading || hasNavigated.current) return;

    let active = true;

    async function decideDestination() {
      try {
        const completed = await AsyncStorage.getItem(
          WELCOME_COMPLETED_KEY,
        );

        if (!active) return;

        hasNavigated.current = true;

        if (completed === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('/welcome');
        }
      } catch (error) {
        console.error('Welcome status check failed:', error);

        if (!active) return;

        hasNavigated.current = true;
        router.replace('/welcome');
      }
    }

    void decideDestination();

    return () => {
      active = false;
    };
  }, [loading, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#087F68" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
