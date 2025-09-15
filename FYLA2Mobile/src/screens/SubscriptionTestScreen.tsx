import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../constants/colors';
import ApiService from '../services/apiService';
import FeatureGatingService from '../services/featureGatingService';

export default function SubscriptionTestScreen() {
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleDebugSubscription = async () => {
    try {
      setLoading(true);
      const info = await FeatureGatingService.debugCurrentSubscription();
      setDebugInfo(info);
      Alert.alert('Debug Info', JSON.stringify(info, null, 2));
    } catch (error) {
      Alert.alert('Error', `Debug failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSubscription = async () => {
    try {
      setLoading(true);
      const result = await FeatureGatingService.activateSubscriptionAfterPayment();
      Alert.alert('Activation Result', result ? 'Success!' : 'Failed or already active');
      
      // Refresh debug info
      const info = await FeatureGatingService.debugCurrentSubscription();
      setDebugInfo(info);
    } catch (error) {
      Alert.alert('Error', `Activation failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSubscription = async () => {
    try {
      setLoading(true);
      await FeatureGatingService.refreshSubscription();
      
      // Get updated debug info
      const info = await FeatureGatingService.debugCurrentSubscription();
      setDebugInfo(info);
      
      Alert.alert('Success', 'Subscription data refreshed');
    } catch (error) {
      Alert.alert('Error', `Refresh failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestSubscription = async (tier: string) => {
    try {
      setLoading(true);
      const result = await ApiService.createSubscription({
        tier: tier === 'premium' ? 2 : 1,
        billingInterval: 'month',
        successUrl: 'fyla://subscription-success',
        cancelUrl: 'fyla://subscription-cancel'
      });
      
      Alert.alert('Subscription Created', JSON.stringify(result, null, 2));
    } catch (error) {
      Alert.alert('Error', `Creation failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Subscription Testing</Text>
      
      {debugInfo && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>{JSON.stringify(debugInfo, null, 2)}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={handleDebugSubscription}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Debug Subscription</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.successButton]}
          onPress={handleActivateSubscription}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Activate Subscription</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.warningButton]}
          onPress={handleRefreshSubscription}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Refresh Subscription</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => handleCreateTestSubscription('basic')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Create Basic Subscription</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => handleCreateTestSubscription('premium')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Create Premium Subscription</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  debugContainer: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: COLORS.text,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  successButton: {
    backgroundColor: '#28a745',
  },
  warningButton: {
    backgroundColor: '#ffc107',
  },
  secondaryButton: {
    backgroundColor: COLORS.business,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 16,
  },
});
