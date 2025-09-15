import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  FadeIn, 
  SlideInRight 
} from 'react-native-reanimated';
import { MODERN_COLORS } from '../../constants/modernDesign';
import { useAuth } from '../../context/AuthContext';

interface NotificationPreferences {
  bookingReminders: boolean;
  promotionalOffers: boolean;
  newProviderAlerts: boolean;
  priceDropAlerts: boolean;
}

interface LocationData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface BudgetPreferences {
  minBudget: number;
  maxBudget: number;
  preferredCategories: string[];
  preferredDistance: number;
}

const ClientOnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Notifications
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    bookingReminders: true,
    promotionalOffers: false,
    newProviderAlerts: true,
    priceDropAlerts: false,
  });

  // Step 2: Location
  const [location, setLocation] = useState<LocationData>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Step 3: Budget & Preferences
  const [budget, setBudget] = useState<BudgetPreferences>({
    minBudget: 50,
    maxBudget: 300,
    preferredCategories: [],
    preferredDistance: 15,
  });

  const serviceCategories = [
    'Hair Services',
    'Nail Services',
    'Skincare',
    'Makeup',
    'Massage',
    'Waxing',
    'Eyebrows & Lashes',
    'Spa Services',
  ];

  const steps = [
    { title: 'Notifications', subtitle: 'Stay updated with your preferences' },
    { title: 'Location', subtitle: 'Help us find services near you' },
    { title: 'Budget & Preferences', subtitle: 'Customize your experience' },
    { title: 'Complete', subtitle: 'You\'re all set!' },
  ];

  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(100);

  React.useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 500 });
    slideAnim.value = withTiming(0, { duration: 500 });
  }, [currentStep]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateX: slideAnim.value }],
  }));

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      if (currentStep === 1 && !validateLocation()) {
        Alert.alert('Required Fields', 'Please fill in your city, state, and ZIP code.');
        return;
      }
      fadeAnim.value = withTiming(0, { duration: 300 });
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        fadeAnim.value = withTiming(1, { duration: 300 });
      }, 300);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      fadeAnim.value = withTiming(0, { duration: 300 });
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        fadeAnim.value = withTiming(1, { duration: 300 });
      }, 300);
    }
  };

  const validateLocation = () => {
    return location.city.trim() && location.state.trim() && location.zipCode.trim();
  };

  const toggleCategory = (category: string) => {
    setBudget(prev => ({
      ...prev,
      preferredCategories: prev.preferredCategories.includes(category)
        ? prev.preferredCategories.filter(c => c !== category)
        : [...prev.preferredCategories, category]
    }));
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      const onboardingData = {
        preferences: {
          budgetRange: { min: budget.minBudget, max: budget.maxBudget },
          serviceCategories: budget.preferredCategories,
          preferredDistance: budget.preferredDistance,
          preferredTimeSlots: [],
          notifications,
          accessibility: {
            wheelchairAccessible: false,
            hearingImpaired: false,
            visuallyImpaired: false,
          },
        },
        location,
        onboardingCompleted: true,
      };

      await updateUser(onboardingData);
      // Navigation will be handled by the app navigator based on user state
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.slice(0, -1).map((_, index) => (
        <View key={index} style={styles.stepContainer}>
          <View style={[
            styles.stepDot,
            index <= currentStep && styles.stepDotActive
          ]}>
            {index < currentStep && (
              <Ionicons name="checkmark" size={12} color="white" />
            )}
          </View>
          {index < steps.length - 2 && (
            <View style={[
              styles.stepLine,
              index < currentStep && styles.stepLineActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderNotificationsStep = () => (
    <Animated.View style={[styles.stepContent, animatedStyle]} entering={FadeIn}>
      <Text style={styles.stepTitle}>Notification Preferences</Text>
      <Text style={styles.stepDescription}>
        Choose how you'd like to stay updated about your bookings and new services.
      </Text>

      <View style={styles.preferencesContainer}>
        {Object.entries(notifications).map(([key, value]) => (
          <View key={key} style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>
                {key === 'bookingReminders' && 'Booking Reminders'}
                {key === 'promotionalOffers' && 'Promotional Offers'}
                {key === 'newProviderAlerts' && 'New Provider Alerts'}
                {key === 'priceDropAlerts' && 'Price Drop Alerts'}
              </Text>
              <Text style={styles.preferenceDescription}>
                {key === 'bookingReminders' && 'Get reminded about upcoming appointments'}
                {key === 'promotionalOffers' && 'Receive special offers and discounts'}
                {key === 'newProviderAlerts' && 'Be notified when new providers join'}
                {key === 'priceDropAlerts' && 'Get alerts when service prices drop'}
              </Text>
            </View>
            <Switch
              value={value}
              onValueChange={(newValue) => 
                setNotifications(prev => ({ ...prev, [key]: newValue }))
              }
              trackColor={{ false: MODERN_COLORS.gray300, true: MODERN_COLORS.primary }}
              thumbColor={value ? MODERN_COLORS.white : MODERN_COLORS.gray400}
            />
          </View>
        ))}
      </View>
    </Animated.View>
  );

  const renderLocationStep = () => (
    <Animated.View style={[styles.stepContent, animatedStyle]} entering={SlideInRight}>
      <Text style={styles.stepTitle}>Your Location</Text>
      <Text style={styles.stepDescription}>
        Help us find the best service providers in your area.
      </Text>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Street Address (Optional)</Text>
          <TextInput
            style={styles.input}
            value={location.address}
            onChangeText={(text) => setLocation(prev => ({ ...prev, address: text }))}
            placeholder="123 Main Street"
            placeholderTextColor={MODERN_COLORS.gray400}
          />
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputLabel}>City *</Text>
            <TextInput
              style={styles.input}
              value={location.city}
              onChangeText={(text) => setLocation(prev => ({ ...prev, city: text }))}
              placeholder="Los Angeles"
              placeholderTextColor={MODERN_COLORS.gray400}
            />
          </View>
          <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>State *</Text>
            <TextInput
              style={styles.input}
              value={location.state}
              onChangeText={(text) => setLocation(prev => ({ ...prev, state: text }))}
              placeholder="CA"
              placeholderTextColor={MODERN_COLORS.gray400}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>ZIP Code *</Text>
          <TextInput
            style={styles.input}
            value={location.zipCode}
            onChangeText={(text) => setLocation(prev => ({ ...prev, zipCode: text }))}
            placeholder="90210"
            placeholderTextColor={MODERN_COLORS.gray400}
            keyboardType="numeric"
          />
        </View>
      </View>
    </Animated.View>
  );

  const renderBudgetStep = () => (
    <Animated.View style={[styles.stepContent, animatedStyle]} entering={SlideInRight}>
      <Text style={styles.stepTitle}>Budget & Preferences</Text>
      <Text style={styles.stepDescription}>
        Set your budget range and select services you're interested in.
      </Text>

      <View style={styles.formContainer}>
        <View style={styles.budgetContainer}>
          <Text style={styles.inputLabel}>Budget Range</Text>
          <View style={styles.budgetRow}>
            <View style={styles.budgetInput}>
              <Text style={styles.budgetLabel}>Min</Text>
              <TextInput
                style={styles.budgetField}
                value={`$${budget.minBudget}`}
                onChangeText={(text) => {
                  const num = parseInt(text.replace('$', '')) || 0;
                  setBudget(prev => ({ ...prev, minBudget: num }));
                }}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.budgetSeparator}>to</Text>
            <View style={styles.budgetInput}>
              <Text style={styles.budgetLabel}>Max</Text>
              <TextInput
                style={styles.budgetField}
                value={`$${budget.maxBudget}`}
                onChangeText={(text) => {
                  const num = parseInt(text.replace('$', '')) || 0;
                  setBudget(prev => ({ ...prev, maxBudget: num }));
                }}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.categoriesContainer}>
          <Text style={styles.inputLabel}>Interested Services</Text>
          <View style={styles.categoriesGrid}>
            {serviceCategories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  budget.preferredCategories.includes(category) && styles.categoryChipSelected
                ]}
                onPress={() => toggleCategory(category)}
              >
                <Text style={[
                  styles.categoryChipText,
                  budget.preferredCategories.includes(category) && styles.categoryChipTextSelected
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Preferred Distance: {budget.preferredDistance} miles</Text>
          <View style={styles.distanceContainer}>
            <TouchableOpacity
              style={styles.distanceButton}
              onPress={() => setBudget(prev => ({ 
                ...prev, 
                preferredDistance: Math.max(5, prev.preferredDistance - 5) 
              }))}
            >
              <Ionicons name="remove" size={20} color={MODERN_COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.distanceValue}>{budget.preferredDistance} mi</Text>
            <TouchableOpacity
              style={styles.distanceButton}
              onPress={() => setBudget(prev => ({ 
                ...prev, 
                preferredDistance: Math.min(50, prev.preferredDistance + 5) 
              }))}
            >
              <Ionicons name="add" size={20} color={MODERN_COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderCompleteStep = () => (
    <Animated.View style={[styles.stepContent, styles.completeContent]} entering={FadeIn}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={80} color={MODERN_COLORS.success} />
      </View>
      <Text style={styles.completeTitle}>Welcome to FYLA2!</Text>
      <Text style={styles.completeDescription}>
        Your profile is now set up. You can start discovering amazing beauty services in your area.
      </Text>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={MODERN_COLORS.white} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>{steps[currentStep].title}</Text>
          <Text style={styles.headerSubtitle}>{steps[currentStep].subtitle}</Text>
        </View>
        {currentStep < steps.length - 1 && renderStepIndicator()}
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 0 && renderNotificationsStep()}
        {currentStep === 1 && renderLocationStep()}
        {currentStep === 2 && renderBudgetStep()}
        {currentStep === 3 && renderCompleteStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={isLoading}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          {isLoading ? (
            <Ionicons name="hourglass" size={20} color={MODERN_COLORS.white} />
          ) : (
            <Ionicons name="arrow-forward" size={20} color={MODERN_COLORS.white} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.white,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 5,
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: MODERN_COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: MODERN_COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: MODERN_COLORS.white,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: MODERN_COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContent: {
    paddingTop: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: MODERN_COLORS.textPrimary,
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: MODERN_COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: 32,
  },
  preferencesContainer: {
    gap: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: MODERN_COLORS.background,
    borderRadius: 16,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MODERN_COLORS.textPrimary,
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: MODERN_COLORS.textSecondary,
    lineHeight: 20,
  },
  formContainer: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: MODERN_COLORS.textPrimary,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray300,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: MODERN_COLORS.textPrimary,
    backgroundColor: MODERN_COLORS.white,
  },
  inputRow: {
    flexDirection: 'row',
  },
  budgetContainer: {
    gap: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  budgetInput: {
    flex: 1,
    gap: 8,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: MODERN_COLORS.textSecondary,
  },
  budgetField: {
    height: 56,
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray300,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: MODERN_COLORS.textPrimary,
    backgroundColor: MODERN_COLORS.white,
    textAlign: 'center',
  },
  budgetSeparator: {
    fontSize: 16,
    color: MODERN_COLORS.textSecondary,
    fontWeight: '500',
  },
  categoriesContainer: {
    gap: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray300,
    backgroundColor: MODERN_COLORS.white,
  },
  categoryChipSelected: {
    backgroundColor: MODERN_COLORS.primary,
    borderColor: MODERN_COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: MODERN_COLORS.textPrimary,
  },
  categoryChipTextSelected: {
    color: MODERN_COLORS.white,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
  },
  distanceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: MODERN_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray300,
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: MODERN_COLORS.textPrimary,
    minWidth: 60,
    textAlign: 'center',
  },
  completeContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  successIcon: {
    marginBottom: 32,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: MODERN_COLORS.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  completeDescription: {
    fontSize: 16,
    color: MODERN_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    padding: 24,
    backgroundColor: MODERN_COLORS.white,
    borderTopWidth: 1,
    borderTopColor: MODERN_COLORS.gray200,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MODERN_COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: MODERN_COLORS.white,
  },
});

export default ClientOnboardingScreen;
