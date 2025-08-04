import React from 'react';
import { View, Text, StyleSheet, StatusBar, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';

const TestProviderProfileScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <Text style={styles.text}>Test Provider Profile Screen</Text>
      <Text style={styles.subtext}>This is a temporary test component</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  subtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});

export default TestProviderProfileScreen;
