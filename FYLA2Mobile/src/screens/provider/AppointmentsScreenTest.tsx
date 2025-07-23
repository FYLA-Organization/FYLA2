import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AppointmentsScreen() {
  return (
    <View style={styles.container}>
      <Text>Appointments Screen - Test</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
