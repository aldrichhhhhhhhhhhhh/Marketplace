
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { MarketplaceProvider } from '@/context/MarketplaceContext';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

function SplashScreenController() {
  const { loading } = useAuth();
  const hidden = useRef(false);

  useEffect(() => {
    if (loading || hidden.current) return;

    hidden.current = true;
    void SplashScreen.hideAsync();
  }, [loading]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <MarketplaceProvider>
          <ThemeProvider
            value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
          >
            <SplashScreenController />

            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="account-setup" />
              <Stack.Screen name="account/personal-information" />
              <Stack.Screen name="account/delivery-address" />
              <Stack.Screen name="auth/sign-in" />
              <Stack.Screen name="auth/sign-up" />
              <Stack.Screen name="cart" />
              <Stack.Screen name="checkout" />
              <Stack.Screen name="favorites" />
              <Stack.Screen name="listing/create" />
              <Stack.Screen name="product/[id]" />
            </Stack>
          </ThemeProvider>
        </MarketplaceProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
