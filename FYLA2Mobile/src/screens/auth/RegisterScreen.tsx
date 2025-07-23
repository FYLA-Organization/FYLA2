import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../types';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    isServiceProvider: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, error, clearError } = useAuth();
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.dateOfBirth) {
      return 'Please fill in all required fields';
    }
    
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    
    return null;
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber || undefined,
        isServiceProvider: formData.isServiceProvider,
        dateOfBirth: formData.dateOfBirth,
      });
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginNavigation = () => {
    clearError();
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#4ECDC4', '#FF6B6B']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Join FYLA2</Text>
            <Text style={styles.subtitle}>Create your beauty network</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <TextInput
                  style={styles.input}
                  placeholder="First Name *"
                  placeholderTextColor="#999"
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  autoCapitalize="words"
                />
              </View>
              
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name *"
                  placeholderTextColor="#999"
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email *"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#999"
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Date of Birth (YYYY-MM-DD) *"
                placeholderTextColor="#999"
                value={formData.dateOfBirth}
                onChangeText={(value) => handleInputChange('dateOfBirth', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password *"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password *"
                placeholderTextColor="#999"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>I am a service provider</Text>
              <Switch
                value={formData.isServiceProvider}
                onValueChange={(value) => handleInputChange('isServiceProvider', value)}
                trackColor={{ false: '#767577', true: '#4ECDC4' }}
                thumbColor={formData.isServiceProvider ? '#f4f3f4' : '#f4f3f4'}
              />
            </View>

            {formData.isServiceProvider && (
              <View style={styles.providerInfo}>
                <Text style={styles.providerInfoText}>
                  As a service provider, you'll be able to offer services, manage bookings, and grow your business on FYLA2.
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleLoginNavigation}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    margin: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 15,
  },
  halfWidth: {
    width: '48%',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  providerInfo: {
    backgroundColor: '#e8f8f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  providerInfoText: {
    fontSize: 14,
    color: '#2d6b5d',
    textAlign: 'center',
  },
  errorContainer: {
    marginBottom: 15,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    fontSize: 14,
  },
  registerButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 16,
  },
  loginLink: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
