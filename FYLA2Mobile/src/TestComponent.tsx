import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TestComponent: React.FC = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Icon Test</Text>
      <Ionicons name="home" size={24} color="black" />
    </View>
  );
};

export default TestComponent;
