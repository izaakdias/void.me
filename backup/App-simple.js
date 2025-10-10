import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>vo1d</Text>
      <Text style={styles.subtitle}>Mensagens que desaparecem</Text>
      <Text style={styles.status}>✅ App funcionando!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#a0a0a0',
    marginBottom: 30,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
