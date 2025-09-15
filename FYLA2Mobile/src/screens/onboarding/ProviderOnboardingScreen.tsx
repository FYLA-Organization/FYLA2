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
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { MODERN_COLORS } from '../../constants/modernDesign';
import { useAuth } from '../../context/AuthContext';

interface ServiceData {
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
}

interface PromotionData {
  title: string;
  description: string;
  discountPercentage: number;
  validUntil: string;
  isActive: boolean;
}

interface AvailabilityData {
  monday: { start: string; end: string; available: boolean };
  tuesday: { start: string; end: string; available: boolean };
  wednesday: { start: string; end: string; available: boolean };
  thursday: { start: string; end: string; available: boolean };
  friday: { start: string; end: string; available: boolean };
  saturday: { start: string; end: string; available: boolean };
  sunday: { start: string; end: string; available: boolean };
}

const ProviderOnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Business Profile
  const [businessProfile, setBusinessProfile] = useState({
    businessName: '',
    bio: '',
    profileImage: null as string | null,
    specializations: [] as string[],
    yearsOfExperience: '',
  });

  // Step 2: Services
  const [services, setServices] = useState<ServiceData[]>([
    {
      name: '',
      description: '',
      duration: 60,
      price: 100,
      category: 'Hair Services',
    }
  ]);

  // Step 3: Promotions
  const [promotions, setPromotions] = useState<PromotionData[]>([
    {
      title: 'New Client Special',
      description: '20% off your first appointment',
      discountPercentage: 20,
      validUntil: '',
      isActive: true,
    }
  ]);

  // Step 4: Availability
  const [availability, setAvailability] = useState<AvailabilityData>({
    monday: { start: '09:00', end: '17:00', available: true },
    tuesday: { start: '09:00', end: '17:00', available: true },
    wednesday: { start: '09:00', end: '17:00', available: true },
    thursday: { start: '09:00', end: '17:00', available: true },
    friday: { start: '09:00', end: '17:00', available: true },
    saturday: { start: '10:00', end: '16:00', available: true },
    sunday: { start: '10:00', end: '16:00', available: false },
  });

  // Step 5: Subscription
  const [selectedSubscription, setSelectedSubscription] = useState('free');

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

  const specializations = [
    'Color Specialist',
    'Cutting Expert',
    'Curly Hair',
    'Extensions',
    'Bridal',
    'Men\'s Grooming',
    'Organic Products',
    'Anti-Aging',
  ];

  const subscriptionTiers = [
    {
      id: 'free',
      name: 'Free',
      price: 'Free',
      features: [
        'Basic profile setup',
        'Up to 3 services',
        '5 photos per service', 
        'Basic booking management',
        'Client messaging',
        'Basic portfolio showcase'
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19.99/month',
      features: [
        'Up to 25 services',
        '20 photos per service',
        'Online payment processing',
        'Advanced analytics & insights',
        'Client reviews & ratings',
        'Social media integration'
      ],
    },
    {
      id: 'business',
      name: 'Business', 
      price: '$49.99/month',
      features: [
        'Unlimited services',
        'Unlimited photos',
        'Custom branding',
        'Automated marketing tools',
        'Priority customer support',
        'Multi-location support'
      ],
    },
  ];

  const steps = [
    { title: 'Business Profile', subtitle: 'Tell us about your business' },
    { title: 'Services', subtitle: 'What services do you offer?' },
    { title: 'Promotions', subtitle: 'Attract new clients' },
    { title: 'Availability', subtitle: 'Set your working hours' },
    { title: 'Subscription', subtitle: 'Choose your plan' },
    { title: 'Complete', subtitle: 'You\'re ready to go!' },
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
      if (!validateCurrentStep()) {
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

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        if (!businessProfile.businessName.trim()) {
          Alert.alert('Required', 'Please enter your business name.');
          return false;
        }
        break;
      case 1:
        if (services.length === 0 || !services[0].name.trim()) {
          Alert.alert('Required', 'Please add at least one service.');
          return false;
        }
        break;
      case 3:
        const hasAvailability = Object.values(availability).some(day => day.available);
        if (!hasAvailability) {
          Alert.alert('Required', 'Please set your availability for at least one day.');
          return false;
        }
        break;
    }
    return true;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setBusinessProfile(prev => ({ ...prev, profileImage: result.assets[0].uri }));
    }
  };

  const toggleSpecialization = (specialization: string) => {
    setBusinessProfile(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  const addService = () => {
    setServices(prev => [...prev, {
      name: '',
      description: '',
      duration: 60,
      price: 100,
      category: 'Hair Services',
    }]);
  };

  const updateService = (index: number, field: keyof ServiceData, value: string | number) => {
    setServices(prev => prev.map((service, i) => 
      i === index ? { ...service, [field]: value } : service
    ));
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateAvailability = (day: keyof AvailabilityData, field: 'start' | 'end' | 'available', value: string | boolean) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      const onboardingData = {
        businessProfile,
        services,
        promotions,
        availability,
        subscriptionTier: selectedSubscription,
        onboardingCompleted: true,
      };

      await updateUser(onboardingData);
      // Navigation will be handled by the app navigator based on user state
    } catch (error) {
      Alert.alert('Error', 'Failed to save business profile. Please try again.');
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

  const renderBusinessProfileStep = () => (
    <Animated.View style={[styles.stepContent, animatedStyle]} entering={FadeIn}>
      <Text style={styles.stepTitle}>Business Profile</Text>
      <Text style={styles.stepDescription}>
        Create your professional profile to attract clients and showcase your expertise.
      </Text>

      <View style={styles.formContainer}>
        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <TouchableOpacity style={styles.profileImageButton} onPress={pickImage}>
            {businessProfile.profileImage ? (
              <Image source={{ uri: businessProfile.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="camera" size={32} color={MODERN_COLORS.gray400} />
                <Text style={styles.profileImageText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Business Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Business Name *</Text>
          <TextInput
            style={styles.input}
            value={businessProfile.businessName}
            onChangeText={(text) => setBusinessProfile(prev => ({ ...prev, businessName: text }))}
            placeholder="Your business name"
            placeholderTextColor={MODERN_COLORS.gray400}
          />
        </View>

        {/* Bio */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={businessProfile.bio}
            onChangeText={(text) => setBusinessProfile(prev => ({ ...prev, bio: text }))}
            placeholder="Tell clients about your experience and what makes you special..."
            placeholderTextColor={MODERN_COLORS.gray400}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Years of Experience */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Years of Experience</Text>
          <TextInput
            style={styles.input}
            value={businessProfile.yearsOfExperience}
            onChangeText={(text) => setBusinessProfile(prev => ({ ...prev, yearsOfExperience: text }))}
            placeholder="5"
            placeholderTextColor={MODERN_COLORS.gray400}
            keyboardType="numeric"
          />
        </View>

        {/* Specializations */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Specializations</Text>
          <View style={styles.specializationsGrid}>
            {specializations.map((specialization) => (
              <TouchableOpacity
                key={specialization}
                style={[
                  styles.specializationChip,
                  businessProfile.specializations.includes(specialization) && styles.specializationChipSelected
                ]}
                onPress={() => toggleSpecialization(specialization)}
              >
                <Text style={[
                  styles.specializationChipText,
                  businessProfile.specializations.includes(specialization) && styles.specializationChipTextSelected
                ]}>
                  {specialization}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderServicesStep = () => (
    <Animated.View style={[styles.stepContent, animatedStyle]} entering={SlideInRight}>
      <Text style={styles.stepTitle}>Your Services</Text>
      <Text style={styles.stepDescription}>
        Add the services you offer. You can always add more later in your dashboard.
      </Text>

      <View style={styles.servicesContainer}>
        {services.map((service, index) => (
          <View key={index} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceCardTitle}>Service {index + 1}</Text>
              {services.length > 1 && (
                <TouchableOpacity onPress={() => removeService(index)}>
                  <Ionicons name="trash-outline" size={20} color={MODERN_COLORS.error} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Service Name *</Text>
              <TextInput
                style={styles.input}
                value={service.name}
                onChangeText={(text) => updateService(index, 'name', text)}
                placeholder="e.g., Women's Haircut"
                placeholderTextColor={MODERN_COLORS.gray400}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={service.description}
                onChangeText={(text) => updateService(index, 'description', text)}
                placeholder="Describe what's included in this service..."
                placeholderTextColor={MODERN_COLORS.gray400}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.serviceRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Duration (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={service.duration.toString()}
                  onChangeText={(text) => updateService(index, 'duration', parseInt(text) || 0)}
                  placeholder="60"
                  placeholderTextColor={MODERN_COLORS.gray400}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Price ($)</Text>
                <TextInput
                  style={styles.input}
                  value={service.price.toString()}
                  onChangeText={(text) => updateService(index, 'price', parseFloat(text) || 0)}
                  placeholder="100"
                  placeholderTextColor={MODERN_COLORS.gray400}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addServiceButton} onPress={addService}>
          <Ionicons name="add" size={20} color={MODERN_COLORS.primary} />
          <Text style={styles.addServiceText}>Add Another Service</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderPromotionsStep = () => (
    <Animated.View style={[styles.stepContent, animatedStyle]} entering={SlideInRight}>
      <Text style={styles.stepTitle}>Promotions</Text>
      <Text style={styles.stepDescription}>
        Create special offers to attract new clients. This is optional - you can skip this step.
      </Text>

      <View style={styles.promotionCard}>
        <View style={styles.promotionHeader}>
          <Text style={styles.promotionTitle}>New Client Special</Text>
          <Switch
            value={promotions[0]?.isActive || false}
            onValueChange={(value) => setPromotions(prev => 
              prev.map((promo, i) => i === 0 ? { ...promo, isActive: value } : promo)
            )}
            trackColor={{ false: MODERN_COLORS.gray300, true: MODERN_COLORS.primary }}
            thumbColor={MODERN_COLORS.white}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Promotion Title</Text>
          <TextInput
            style={styles.input}
            value={promotions[0]?.title || ''}
            onChangeText={(text) => setPromotions(prev => 
              prev.map((promo, i) => i === 0 ? { ...promo, title: text } : promo)
            )}
            placeholder="New Client Special"
            placeholderTextColor={MODERN_COLORS.gray400}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={styles.input}
            value={promotions[0]?.description || ''}
            onChangeText={(text) => setPromotions(prev => 
              prev.map((promo, i) => i === 0 ? { ...promo, description: text } : promo)
            )}
            placeholder="20% off your first appointment"
            placeholderTextColor={MODERN_COLORS.gray400}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Discount Percentage</Text>
          <TextInput
            style={styles.input}
            value={promotions[0]?.discountPercentage?.toString() || ''}
            onChangeText={(text) => setPromotions(prev => 
              prev.map((promo, i) => i === 0 ? { ...promo, discountPercentage: parseInt(text) || 0 } : promo)
            )}
            placeholder="20"
            placeholderTextColor={MODERN_COLORS.gray400}
            keyboardType="numeric"
          />
        </View>
      </View>
    </Animated.View>
  );

  const renderAvailabilityStep = () => (
    <Animated.View style={[styles.stepContent, animatedStyle]} entering={SlideInRight}>
      <Text style={styles.stepTitle}>Working Hours</Text>
      <Text style={styles.stepDescription}>
        Set your availability. Clients will only be able to book during these hours.
      </Text>

      <View style={styles.availabilityContainer}>
        {Object.entries(availability).map(([day, schedule]) => (
          <View key={day} style={styles.dayContainer}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
              <Switch
                value={schedule.available}
                onValueChange={(value) => updateAvailability(day as keyof AvailabilityData, 'available', value)}
                trackColor={{ false: MODERN_COLORS.gray300, true: MODERN_COLORS.primary }}
                thumbColor={MODERN_COLORS.white}
              />
            </View>
            
            {schedule.available && (
              <View style={styles.timeContainer}>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>Start</Text>
                  <TextInput
                    style={styles.timeField}
                    value={schedule.start}
                    onChangeText={(text) => updateAvailability(day as keyof AvailabilityData, 'start', text)}
                    placeholder="09:00"
                    placeholderTextColor={MODERN_COLORS.gray400}
                  />
                </View>
                <Text style={styles.timeSeparator}>to</Text>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>End</Text>
                  <TextInput
                    style={styles.timeField}
                    value={schedule.end}
                    onChangeText={(text) => updateAvailability(day as keyof AvailabilityData, 'end', text)}
                    placeholder="17:00"
                    placeholderTextColor={MODERN_COLORS.gray400}
                  />
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
    </Animated.View>
  );

  const renderSubscriptionStep = () => (
    <Animated.View style={[styles.stepContent, animatedStyle]} entering={SlideInRight}>
      <Text style={styles.stepTitle}>Choose Your Plan</Text>
      <Text style={styles.stepDescription}>
        Select the subscription that best fits your business needs. You can upgrade anytime.
      </Text>

      <View style={styles.subscriptionContainer}>
        {subscriptionTiers.map((tier) => (
          <TouchableOpacity
            key={tier.id}
            style={[
              styles.subscriptionCard,
              selectedSubscription === tier.id && styles.subscriptionCardSelected
            ]}
            onPress={() => setSelectedSubscription(tier.id)}
          >
            <View style={styles.subscriptionHeader}>
              <Text style={styles.subscriptionName}>{tier.name}</Text>
              <Text style={styles.subscriptionPrice}>{tier.price}</Text>
            </View>
            <View style={styles.featuresContainer}>
              {tier.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={MODERN_COLORS.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
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
        Your business profile is set up and ready. Start accepting bookings and growing your business today.
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

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 0 && renderBusinessProfileStep()}
        {currentStep === 1 && renderServicesStep()}
        {currentStep === 2 && renderPromotionsStep()}
        {currentStep === 3 && renderAvailabilityStep()}
        {currentStep === 4 && renderSubscriptionStep()}
        {currentStep === 5 && renderCompleteStep()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep === 2 && (
          <TouchableOpacity
            style={[styles.skipButton]}
            onPress={handleNext}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={isLoading}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? 'Start Earning' : 'Continue'}
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
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Extra space for footer
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
  formContainer: {
    gap: 24,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  profileImageButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: MODERN_COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: MODERN_COLORS.gray300,
    borderStyle: 'dashed',
  },
  profileImageText: {
    marginTop: 8,
    fontSize: 14,
    color: MODERN_COLORS.gray400,
    fontWeight: '500',
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
  textArea: {
    height: 100,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  specializationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specializationChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray300,
    backgroundColor: MODERN_COLORS.white,
  },
  specializationChipSelected: {
    backgroundColor: MODERN_COLORS.primary,
    borderColor: MODERN_COLORS.primary,
  },
  specializationChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: MODERN_COLORS.textPrimary,
  },
  specializationChipTextSelected: {
    color: MODERN_COLORS.white,
  },
  servicesContainer: {
    flex: 1,
  },
  serviceCard: {
    backgroundColor: MODERN_COLORS.gray50,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: MODERN_COLORS.textPrimary,
  },
  serviceRow: {
    flexDirection: 'row',
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: MODERN_COLORS.primary,
    borderRadius: 16,
    borderStyle: 'dashed',
    gap: 8,
  },
  addServiceText: {
    fontSize: 16,
    fontWeight: '600',
    color: MODERN_COLORS.primary,
  },
  promotionCard: {
    backgroundColor: MODERN_COLORS.gray50,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: MODERN_COLORS.textPrimary,
  },
  availabilityContainer: {
    gap: 16,
  },
  dayContainer: {
    backgroundColor: MODERN_COLORS.gray50,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: MODERN_COLORS.textPrimary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  timeInput: {
    flex: 1,
    gap: 4,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: MODERN_COLORS.textSecondary,
  },
  timeField: {
    height: 44,
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray300,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: MODERN_COLORS.textPrimary,
    backgroundColor: MODERN_COLORS.white,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 16,
    color: MODERN_COLORS.textSecondary,
    fontWeight: '500',
  },
  subscriptionContainer: {
    gap: 16,
  },
  subscriptionCard: {
    backgroundColor: MODERN_COLORS.white,
    borderWidth: 2,
    borderColor: MODERN_COLORS.gray300,
    borderRadius: 16,
    padding: 20,
  },
  subscriptionCardSelected: {
    borderColor: MODERN_COLORS.primary,
    backgroundColor: MODERN_COLORS.gray50,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionName: {
    fontSize: 20,
    fontWeight: '700',
    color: MODERN_COLORS.textPrimary,
  },
  subscriptionPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: MODERN_COLORS.primary,
  },
  featuresContainer: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: MODERN_COLORS.textSecondary,
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
    gap: 12,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: MODERN_COLORS.textSecondary,
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

export default ProviderOnboardingScreen;
