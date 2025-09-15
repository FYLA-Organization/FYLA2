import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiService from '../../services/apiService';

const TestIntegrationScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  const runIntegrationTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'Public Brand Profile',
        test: async () => {
          const response = await apiService.getPublicBrandProfile('test-provider-id');
          return { success: true, data: response };
        }
      },
      {
        name: 'Client Loyalty Status',
        test: async () => {
          const response = await apiService.getClientLoyaltyStatus('test-provider-id', 'test-client-id');
          return { success: true, data: response };
        }
      },
      {
        name: 'Public Promotions',
        test: async () => {
          const response = await apiService.getPublicPromotions('test-provider-id');
          return { success: true, data: response };
        }
      },
      {
        name: 'User Subscription',
        test: async () => {
          const response = await apiService.getUserSubscription();
          return { success: true, data: response };
        }
      },
    ];

    const results = [];
    for (const test of tests) {
      try {
        const result = await test.test();
        results.push({
          name: test.name,
          success: true,
          message: 'Test passed',
          data: result.data
        });
      } catch (error: any) {
        results.push({
          name: test.name,
          success: false,
          message: error.message || 'Test failed',
          error: error
        });
      }
    }

    setTestResults(results);
    setLoading(false);
  };

  const testSubscriptionPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5224/api/payment/test-multi-location-access', {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN_HERE'
        }
      });
      
      const result = await response.json();
      
      Alert.alert(
        'Subscription Test Result',
        JSON.stringify(result, null, 2),
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Integration Testing</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Test Advanced Features Integration</Text>
        <Text style={styles.description}>
          Test the client-side integration with real provider data
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={runIntegrationTests}
            disabled={loading}
          >
            <Ionicons name="flask-outline" size={24} color="white" />
            <Text style={styles.buttonText}>
              {loading ? 'Running Tests...' : 'Run API Tests'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subscriptionButton}
            onPress={testSubscriptionPermissions}
            disabled={loading}
          >
            <Ionicons name="card-outline" size={24} color="white" />
            <Text style={styles.buttonText}>Test Subscription</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.resultsContainer}>
          {testResults.map((result, index) => (
            <View key={index} style={[
              styles.resultCard,
              result.success ? styles.successCard : styles.errorCard
            ]}>
              <View style={styles.resultHeader}>
                <Ionicons
                  name={result.success ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={result.success ? '#34C759' : '#FF3B30'}
                />
                <Text style={styles.resultName}>{result.name}</Text>
              </View>
              
              <Text style={styles.resultMessage}>{result.message}</Text>
              
              {result.data && (
                <Text style={styles.resultData}>
                  {JSON.stringify(result.data, null, 2)}
                </Text>
              )}
              
              {result.error && (
                <Text style={styles.errorText}>
                  {JSON.stringify(result.error, null, 2)}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Integration Checklist:</Text>
          <Text style={styles.infoItem}>✅ Custom Branding Components</Text>
          <Text style={styles.infoItem}>✅ Loyalty Points Widget</Text>
          <Text style={styles.infoItem}>✅ Promotion Display</Text>
          <Text style={styles.infoItem}>✅ Enhanced Booking Screen</Text>
          <Text style={styles.infoItem}>🔧 Backend API Endpoints</Text>
          <Text style={styles.infoItem}>🔧 Authentication Flow</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    lineHeight: 22,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  testButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  subscriptionButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  resultsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  resultCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  successCard: {
    backgroundColor: '#F0FFF4',
    borderColor: '#34C759',
  },
  errorCard: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF3B30',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  resultMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resultData: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    fontFamily: 'monospace',
    backgroundColor: '#FFF5F5',
    padding: 8,
    borderRadius: 4,
  },
  infoContainer: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default TestIntegrationScreen;
