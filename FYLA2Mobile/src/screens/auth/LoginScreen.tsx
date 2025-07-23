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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../types';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, error, clearError, devLoginClient, devLoginProvider } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterNavigation = () => {
    clearError();
    navigation.navigate('Register');
  };

  const handleDevLoginClient = async () => {
    setIsLoading(true);
    try {
      await devLoginClient();
    } catch (error) {
      Alert.alert('Error', 'Dev login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLoginProvider = async () => {
    setIsLoading(true);
    try {
      await devLoginProvider();
    } catch (error) {
      Alert.alert('Error', 'Dev login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#FF6B6B', '#4ECDC4']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>FYLA2</Text>
            <Text style={styles.subtitle}>Find Your Look & Appointment</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleRegisterNavigation}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Dev Login Buttons */}
            <View style={styles.devButtonsContainer}>
              <Text style={styles.devTitle}>Development Quick Login</Text>
              
              <TouchableOpacity
                style={[styles.devButton, styles.clientButton, isLoading && styles.disabledButton]}
                onPress={handleDevLoginClient}
                disabled={isLoading}
              >
                <Text style={styles.devButtonText}>Login as Client</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.devButton, styles.providerButton, isLoading && styles.disabledButton]}
                onPress={handleDevLoginProvider}
                disabled={isLoading}
              >
                <Text style={styles.devButtonText}>Login as Provider</Text>
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
    marginBottom: 50,
  },
  title: {
    fontSize: 48,
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
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  errorContainer: {
    marginBottom: 15,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#666',
    fontSize: 16,
  },
  registerLink: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    color: '#4ECDC4',
    fontSize: 16,
  },
  devButtonsContainer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  devTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    opacity: 0.8,
  },
  devButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 10,
    alignItems: 'center',
  },
  clientButton: {
    backgroundColor: 'rgba(76, 205, 196, 0.8)',
  },
  providerButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
  },
  devButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
