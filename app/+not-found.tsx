import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.primary} />
        <Text style={styles.title}>Page Not Found</Text>
        <Link href="/(tabs)" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.dark.background, gap: 16, padding: 20,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.dark.text },
  button: {
    backgroundColor: Colors.primaryGlow, paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 12, marginTop: 8,
  },
  buttonText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
});
