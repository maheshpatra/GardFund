import { Stack, router, useSegments } from 'expo-router';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { AlertProvider } from '../contexts/AlertContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth group
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to home if authenticated and in auth group
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.dark.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <AlertProvider>
          <AuthGuard>
            <View style={{ flex: 1, backgroundColor: Colors.dark.background, paddingTop: statusBarHeight }}>
              <ExpoStatusBar style="light" translucent={true} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: Colors.dark.background },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="loans"
                  options={{
                    headerShown: true,
                    title: 'Loans',
                    headerStyle: { backgroundColor: Colors.dark.surface },
                    headerTintColor: Colors.dark.text,
                    headerTitleStyle: { fontWeight: '700' },
                    headerTitleAlign: 'center',
                  }}
                />
                <Stack.Screen
                  name="hospitals"
                  options={{
                    headerShown: true,
                    title: 'Hospital Directory',
                    headerStyle: { backgroundColor: Colors.dark.surface },
                    headerTintColor: Colors.dark.text,
                    headerTitleStyle: { fontWeight: '700' },
                    headerTitleAlign: 'center',
                  }}
                />
                <Stack.Screen
                  name="notifications"
                  options={{
                    headerShown: true,
                    title: 'Notifications',
                    headerStyle: { backgroundColor: Colors.dark.surface },
                    headerTintColor: Colors.dark.text,
                    headerTitleStyle: { fontWeight: '700' },
                    headerTitleAlign: 'center',
                  }}
                />
                <Stack.Screen
                  name="levels"
                  options={{
                    headerShown: true,
                    title: 'Level & Rewards',
                    headerStyle: { backgroundColor: Colors.dark.surface },
                    headerTintColor: Colors.dark.text,
                    headerTitleStyle: { fontWeight: '700' },
                    headerTitleAlign: 'center',
                  }}
                />
                <Stack.Screen
                  name="admin"
                  options={{
                    headerShown: true,
                    title: 'Admin Panel',
                    headerStyle: { backgroundColor: Colors.dark.surface },
                    headerTintColor: Colors.dark.text,
                    headerTitleStyle: { fontWeight: '700' },
                    headerTitleAlign: 'center',
                  }}
                />
              </Stack>
            </View>
          </AuthGuard>
        </AlertProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
