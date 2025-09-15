import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Switch,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/apiService';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  isFeature: boolean;
  featureType?: 'branding' | 'marketing' | 'loyalty' | 'seat_rental';
}

const AdvancedFeaturesOnboardingScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  // Onboarding steps
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'Welcome to Advanced Features',
      description: 'Unlock the full potential of your Business plan with custom branding, marketing campaigns, and more!',
      icon: 'rocket-outline',
      completed: false,
      isFeature: false,
    },
    {
      id: 'branding',
      title: 'Custom Branding',
      description: 'Create a professional branded experience for your clients',
      icon: 'brush-outline',
      completed: false,
      isFeature: true,
      featureType: 'branding',
    },
    {
      id: 'marketing',
      title: 'Marketing Campaigns',
      description: 'Drive more bookings with targeted promotions and campaigns',
      icon: 'megaphone-outline',
      completed: false,
      isFeature: true,
      featureType: 'marketing',
    },
    {
      id: 'loyalty',
      title: 'Loyalty Programs',
      description: 'Increase customer retention with rewards and points',
      icon: 'gift-outline',
      completed: false,
      isFeature: true,
      featureType: 'loyalty',
    },
    {
      id: 'seat_rental',
      title: 'Seat Rental Marketplace',
      description: 'Generate additional revenue by renting out unused seats',
      icon: 'business-outline',
      completed: false,
      isFeature: true,
      featureType: 'seat_rental',
    },
    {
      id: 'complete',
      title: 'Setup Complete!',
      description: 'Your advanced features are ready to generate results',
      icon: 'checkmark-circle-outline',
      completed: false,
      isFeature: false,
    },
  ]);

  // Feature setup forms
  const [brandingForm, setBrandingForm] = useState({
    businessName: '',
    tagline: '',
    primaryColor: '#007AFF',
    secondaryColor: '#34C759',
    logoUrl: '',
    websiteUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
  });

  const [marketingForm, setMarketingForm] = useState({
    welcomeDiscount: 10,
    loyaltyDiscount: 15,
    enableAutoPromotions: true,
    enableSeasonalCampaigns: true,
  });

  const [loyaltyForm, setLoyaltyForm] = useState({
    programName: 'VIP Rewards',
    pointsPerDollar: 1,
    bronzeThreshold: 100,
    silverThreshold: 500,
    goldThreshold: 1000,
    welcomeBonus: 50,
  });

  const [seatRentalForm, setSeatRentalForm] = useState({
    enableRental: true,
    hourlyRate: 25,
    minimumHours: 1,
    maximumHours: 8,
    availableSeats: 2,
  });

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await apiService.getUserSubscription();
      setSubscriptionData(response);
      
      // Pre-fill forms with user data
      if (response.subscription?.tier >= 2) {
        setBrandingForm(prev => ({
          ...prev,
          businessName: user?.firstName + ' ' + user?.lastName || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleStepComplete = async (stepId: string) => {
    setLoading(true);
    
    try {
      let success = false;

      switch (stepId) {
        case 'branding':
          success = await setupBranding();
          break;
        case 'marketing':
          success = await setupMarketing();
          break;
        case 'loyalty':
          success = await setupLoyalty();
          break;
        case 'seat_rental':
          success = await setupSeatRental();
          break;
        default:
          success = true;
      }

      if (success) {
        // Mark step as completed
        setSteps(prev => 
          prev.map(step => 
            step.id === stepId ? { ...step, completed: true } : step
          )
        );

        // Move to next step
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        }
      }
    } catch (error) {
      console.error('Error completing step:', error);
      Alert.alert('Error', 'Failed to setup feature. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setupBranding = async (): Promise<boolean> => {
    try {
      const brandingData = {
        businessName: brandingForm.businessName,
        tagline: brandingForm.tagline,
        primaryColor: brandingForm.primaryColor,
        secondaryColor: brandingForm.secondaryColor,
        logoUrl: brandingForm.logoUrl,
        socialMedia: {
          website: brandingForm.websiteUrl,
          facebook: brandingForm.facebookUrl,
          instagram: brandingForm.instagramUrl,
          twitter: brandingForm.twitterUrl,
        },
        emailTemplate: {
          headerColor: brandingForm.primaryColor,
          footerText: `© 2025 ${brandingForm.businessName}. All rights reserved.`,
        },
      };

      await apiService.createBrandProfile(brandingData);
      return true;
    } catch (error) {
      console.error('Error setting up branding:', error);
      return false;
    }
  };

  const setupMarketing = async (): Promise<boolean> => {
    try {
      // Create welcome promotion
      const welcomePromo = {
        name: 'New Client Welcome',
        description: `Get ${marketingForm.welcomeDiscount}% off your first booking!`,
        discountType: 'percentage',
        discountValue: marketingForm.welcomeDiscount,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        isActive: true,
        targetAudience: 'new_clients',
      };

      await apiService.createPromotion(welcomePromo);

      // Create loyalty promotion
      const loyaltyPromo = {
        name: 'Loyal Client Reward',
        description: `Save ${marketingForm.loyaltyDiscount}% as a returning client!`,
        discountType: 'percentage',
        discountValue: marketingForm.loyaltyDiscount,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        targetAudience: 'returning_clients',
      };

      await apiService.createPromotion(loyaltyPromo);
      return true;
    } catch (error) {
      console.error('Error setting up marketing:', error);
      return false;
    }
  };

  const setupLoyalty = async (): Promise<boolean> => {
    try {
      const loyaltyData = {
        name: loyaltyForm.programName,
        description: 'Earn points with every booking and unlock exclusive rewards!',
        pointsPerDollar: loyaltyForm.pointsPerDollar,
        tiers: [
          {
            name: 'Bronze',
            minPoints: 0,
            maxPoints: loyaltyForm.bronzeThreshold - 1,
            benefits: ['Earn 1 point per $1 spent', 'Birthday discount'],
          },
          {
            name: 'Silver',
            minPoints: loyaltyForm.bronzeThreshold,
            maxPoints: loyaltyForm.silverThreshold - 1,
            benefits: ['Earn 1.5 points per $1 spent', 'Priority booking', '5% discount'],
          },
          {
            name: 'Gold',
            minPoints: loyaltyForm.silverThreshold,
            maxPoints: 999999,
            benefits: ['Earn 2 points per $1 spent', 'Exclusive services', '10% discount', 'Free cancellation'],
          },
        ],
        rewards: [
          {
            name: '$5 Off',
            description: 'Get $5 off your next booking',
            pointsCost: 100,
            rewardType: 'discount',
            value: 5,
          },
          {
            name: '$15 Off',
            description: 'Get $15 off your next booking',
            pointsCost: 300,
            rewardType: 'discount',
            value: 15,
          },
          {
            name: 'Free Service Upgrade',
            description: 'Upgrade to premium service at no extra cost',
            pointsCost: 500,
            rewardType: 'upgrade',
            value: 0,
          },
        ],
        welcomeBonus: loyaltyForm.welcomeBonus,
        isActive: true,
      };

      await apiService.createLoyaltyProgram(loyaltyData);
      return true;
    } catch (error) {
      console.error('Error setting up loyalty:', error);
      return false;
    }
  };

  const setupSeatRental = async (): Promise<boolean> => {
    try {
      const seatData = {
        title: 'Professional Workspace Rental',
        description: 'Rent a professional workspace by the hour in our modern facility.',
        hourlyRate: seatRentalForm.hourlyRate,
        minimumHours: seatRentalForm.minimumHours,
        maximumHours: seatRentalForm.maximumHours,
        availableSeats: seatRentalForm.availableSeats,
        amenities: [
          'High-speed WiFi',
          'Professional lighting',
          'Quiet environment',
          'Coffee/tea included',
          'Meeting room access',
        ],
        isActive: seatRentalForm.enableRental,
        operatingHours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '10:00', close: '16:00' },
          sunday: { open: 'closed', close: 'closed' },
        },
      };

      await apiService.createSeatRental(seatData);
      return true;
    } catch (error) {
      console.error('Error setting up seat rental:', error);
      return false;
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <View style={styles.stepContent}>
            <View style={styles.welcomeHeader}>
              <Ionicons name="rocket" size={60} color="#007AFF" />
              <Text style={styles.welcomeTitle}>Congratulations!</Text>
              <Text style={styles.welcomeSubtitle}>
                You've unlocked FYLA2's advanced features with your Business plan
              </Text>
            </View>

            <View style={styles.featurePreview}>
              <Text style={styles.featurePreviewTitle}>What you'll get:</Text>
              
              <View style={styles.featureItem}>
                <Ionicons name="brush" size={24} color="#007AFF" />
                <Text style={styles.featureText}>Custom branding for professional image</Text>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="megaphone" size={24} color="#007AFF" />
                <Text style={styles.featureText}>Marketing campaigns to drive bookings</Text>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="gift" size={24} color="#007AFF" />
                <Text style={styles.featureText}>Loyalty programs for customer retention</Text>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="business" size={24} color="#007AFF" />
                <Text style={styles.featureText}>Seat rental for additional revenue</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handleStepComplete('welcome')}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Loading...' : "Let's Get Started!"}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'branding':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Setup Your Brand Identity</Text>
            <Text style={styles.stepDescription}>
              Create a professional branded experience that builds trust and recognition
            </Text>

            <ScrollView style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Business Name *</Text>
                <TextInput
                  style={styles.input}
                  value={brandingForm.businessName}
                  onChangeText={(text) => setBrandingForm({...brandingForm, businessName: text})}
                  placeholder="Your Business Name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tagline</Text>
                <TextInput
                  style={styles.input}
                  value={brandingForm.tagline}
                  onChangeText={(text) => setBrandingForm({...brandingForm, tagline: text})}
                  placeholder="Your business tagline or motto"
                />
              </View>

              <View style={styles.colorRow}>
                <View style={styles.colorGroup}>
                  <Text style={styles.label}>Primary Color</Text>
                  <View style={[styles.colorPreview, { backgroundColor: brandingForm.primaryColor }]} />
                  <TextInput
                    style={styles.colorInput}
                    value={brandingForm.primaryColor}
                    onChangeText={(text) => setBrandingForm({...brandingForm, primaryColor: text})}
                    placeholder="#007AFF"
                  />
                </View>

                <View style={styles.colorGroup}>
                  <Text style={styles.label}>Secondary Color</Text>
                  <View style={[styles.colorPreview, { backgroundColor: brandingForm.secondaryColor }]} />
                  <TextInput
                    style={styles.colorInput}
                    value={brandingForm.secondaryColor}
                    onChangeText={(text) => setBrandingForm({...brandingForm, secondaryColor: text})}
                    placeholder="#34C759"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Website URL</Text>
                <TextInput
                  style={styles.input}
                  value={brandingForm.websiteUrl}
                  onChangeText={(text) => setBrandingForm({...brandingForm, websiteUrl: text})}
                  placeholder="https://yourbusiness.com"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Instagram URL</Text>
                <TextInput
                  style={styles.input}
                  value={brandingForm.instagramUrl}
                  onChangeText={(text) => setBrandingForm({...brandingForm, instagramUrl: text})}
                  placeholder="https://instagram.com/yourbusiness"
                />
              </View>
            </ScrollView>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setCurrentStep(currentStep - 1)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1, marginLeft: 10 }]}
                onPress={() => handleStepComplete('branding')}
                disabled={loading || !brandingForm.businessName}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Setting up...' : 'Setup Branding'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'marketing':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Create Marketing Campaigns</Text>
            <Text style={styles.stepDescription}>
              Drive more bookings with automated promotions and targeted offers
            </Text>

            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Welcome Discount (%)</Text>
                <View style={styles.sliderContainer}>
                  <TextInput
                    style={styles.numberInput}
                    value={marketingForm.welcomeDiscount.toString()}
                    onChangeText={(text) => setMarketingForm({...marketingForm, welcomeDiscount: parseInt(text) || 0})}
                    keyboardType="numeric"
                  />
                  <Text style={styles.sliderLabel}>% off for new clients</Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Loyalty Discount (%)</Text>
                <View style={styles.sliderContainer}>
                  <TextInput
                    style={styles.numberInput}
                    value={marketingForm.loyaltyDiscount.toString()}
                    onChangeText={(text) => setMarketingForm({...marketingForm, loyaltyDiscount: parseInt(text) || 0})}
                    keyboardType="numeric"
                  />
                  <Text style={styles.sliderLabel}>% off for returning clients</Text>
                </View>
              </View>

              <View style={styles.switchGroup}>
                <Text style={styles.label}>Auto Promotions</Text>
                <Switch
                  value={marketingForm.enableAutoPromotions}
                  onValueChange={(value) => setMarketingForm({...marketingForm, enableAutoPromotions: value})}
                />
              </View>

              <View style={styles.switchGroup}>
                <Text style={styles.label}>Seasonal Campaigns</Text>
                <Switch
                  value={marketingForm.enableSeasonalCampaigns}
                  onValueChange={(value) => setMarketingForm({...marketingForm, enableSeasonalCampaigns: value})}
                />
              </View>

              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Campaign Preview:</Text>
                <Text style={styles.previewText}>
                  "Welcome! Get {marketingForm.welcomeDiscount}% off your first booking!"
                </Text>
                <Text style={styles.previewText}>
                  "Welcome back! Save {marketingForm.loyaltyDiscount}% as a valued client!"
                </Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setCurrentStep(currentStep - 1)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1, marginLeft: 10 }]}
                onPress={() => handleStepComplete('marketing')}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Creating...' : 'Create Campaigns'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'loyalty':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Launch Loyalty Program</Text>
            <Text style={styles.stepDescription}>
              Increase customer retention and lifetime value with rewards
            </Text>

            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Program Name</Text>
                <TextInput
                  style={styles.input}
                  value={loyaltyForm.programName}
                  onChangeText={(text) => setLoyaltyForm({...loyaltyForm, programName: text})}
                  placeholder="VIP Rewards"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Points per Dollar Spent</Text>
                <TextInput
                  style={styles.numberInput}
                  value={loyaltyForm.pointsPerDollar.toString()}
                  onChangeText={(text) => setLoyaltyForm({...loyaltyForm, pointsPerDollar: parseInt(text) || 1})}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Welcome Bonus Points</Text>
                <TextInput
                  style={styles.numberInput}
                  value={loyaltyForm.welcomeBonus.toString()}
                  onChangeText={(text) => setLoyaltyForm({...loyaltyForm, welcomeBonus: parseInt(text) || 50})}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.tierPreview}>
                <Text style={styles.previewTitle}>Membership Tiers:</Text>
                <View style={styles.tierItem}>
                  <View style={[styles.tierBadge, { backgroundColor: '#CD7F32' }]} />
                  <Text style={styles.tierText}>Bronze (0-{loyaltyForm.bronzeThreshold-1} pts)</Text>
                </View>
                <View style={styles.tierItem}>
                  <View style={[styles.tierBadge, { backgroundColor: '#C0C0C0' }]} />
                  <Text style={styles.tierText}>Silver ({loyaltyForm.bronzeThreshold}-{loyaltyForm.silverThreshold-1} pts)</Text>
                </View>
                <View style={styles.tierItem}>
                  <View style={[styles.tierBadge, { backgroundColor: '#FFD700' }]} />
                  <Text style={styles.tierText}>Gold ({loyaltyForm.silverThreshold}+ pts)</Text>
                </View>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setCurrentStep(currentStep - 1)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1, marginLeft: 10 }]}
                onPress={() => handleStepComplete('loyalty')}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Creating...' : 'Launch Program'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'seat_rental':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Setup Seat Rental</Text>
            <Text style={styles.stepDescription}>
              Generate additional revenue by renting workspace to other professionals
            </Text>

            <View style={styles.formContainer}>
              <View style={styles.switchGroup}>
                <Text style={styles.label}>Enable Seat Rental</Text>
                <Switch
                  value={seatRentalForm.enableRental}
                  onValueChange={(value) => setSeatRentalForm({...seatRentalForm, enableRental: value})}
                />
              </View>

              {seatRentalForm.enableRental && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Hourly Rate ($)</Text>
                    <TextInput
                      style={styles.numberInput}
                      value={seatRentalForm.hourlyRate.toString()}
                      onChangeText={(text) => setSeatRentalForm({...seatRentalForm, hourlyRate: parseFloat(text) || 25})}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Available Seats</Text>
                    <TextInput
                      style={styles.numberInput}
                      value={seatRentalForm.availableSeats.toString()}
                      onChangeText={(text) => setSeatRentalForm({...seatRentalForm, availableSeats: parseInt(text) || 2})}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.revenuePreview}>
                    <Text style={styles.previewTitle}>Revenue Potential:</Text>
                    <Text style={styles.revenueText}>
                      ${seatRentalForm.hourlyRate * seatRentalForm.availableSeats * 8}/day
                    </Text>
                    <Text style={styles.revenueSubtext}>
                      (${seatRentalForm.hourlyRate}/hour × {seatRentalForm.availableSeats} seats × 8 hours)
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setCurrentStep(currentStep - 1)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1, marginLeft: 10 }]}
                onPress={() => handleStepComplete('seat_rental')}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Setting up...' : 'Setup Rental'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'complete':
        return (
          <View style={styles.stepContent}>
            <View style={styles.completionHeader}>
              <Ionicons name="checkmark-circle" size={80} color="#34C759" />
              <Text style={styles.completionTitle}>Setup Complete!</Text>
              <Text style={styles.completionSubtitle}>
                Your advanced features are now active and ready to drive results
              </Text>
            </View>

            <View style={styles.resultsPreview}>
              <Text style={styles.resultsTitle}>Expected Results:</Text>
              
              <View style={styles.resultItem}>
                <Ionicons name="trending-up" size={20} color="#34C759" />
                <Text style={styles.resultText}>15-25% increase in bookings</Text>
              </View>

              <View style={styles.resultItem}>
                <Ionicons name="people" size={20} color="#34C759" />
                <Text style={styles.resultText}>30-40% better customer retention</Text>
              </View>

              <View style={styles.resultItem}>
                <Ionicons name="cash" size={20} color="#34C759" />
                <Text style={styles.resultText}>Additional revenue from seat rentals</Text>
              </View>

              <View style={styles.resultItem}>
                <Ionicons name="star" size={20} color="#34C759" />
                <Text style={styles.resultText}>Professional branded experience</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('ProviderDashboard' as never)}
            >
              <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('AnalyticsDashboard' as never)}
            >
              <Text style={styles.linkButtonText}>View Analytics →</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
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
        
        <Text style={styles.headerTitle}>Advanced Features Setup</Text>
        
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>{currentStep + 1} / {steps.length}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / steps.length) * 100}%` }
            ]}
          />
        </View>
      </View>

      {/* Step Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepNavigation}>
        {steps.map((step, index) => (
          <TouchableOpacity
            key={step.id}
            style={[
              styles.stepNavItem,
              index === currentStep && styles.stepNavItemActive,
              step.completed && styles.stepNavItemCompleted,
            ]}
          >
            <Ionicons
              name={step.completed ? 'checkmark-circle' : step.icon as any}
              size={20}
              color={
                step.completed ? '#34C759' :
                index === currentStep ? '#007AFF' : 'rgba(255,255,255,0.6)'
              }
            />
            <Text
              style={[
                styles.stepNavText,
                index === currentStep && styles.stepNavTextActive,
                step.completed && styles.stepNavTextCompleted,
              ]}
            >
              {step.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main Content */}
      <View style={styles.content}>
        {renderStepContent()}
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
    justifyContent: 'space-between',
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  stepIndicator: {
    width: 60,
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  stepNavigation: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  stepNavItem: {
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: 80,
  },
  stepNavItemActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  stepNavItemCompleted: {
    backgroundColor: 'rgba(52,199,89,0.2)',
  },
  stepNavText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    textAlign: 'center',
  },
  stepNavTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  stepNavTextCompleted: {
    color: '#34C759',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  featurePreview: {
    marginBottom: 30,
  },
  featurePreviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 15,
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  colorGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  colorPreview: {
    width: '100%',
    height: 40,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  colorInput: {
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#F8F9FA',
    textAlign: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    width: 80,
    textAlign: 'center',
  },
  sliderLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 15,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  previewCard: {
    backgroundColor: '#F0F7FF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 10,
  },
  previewText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  tierPreview: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  tierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  tierText: {
    fontSize: 14,
    color: '#666',
  },
  revenuePreview: {
    backgroundColor: '#F0FFF4',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  revenueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 5,
  },
  revenueSubtext: {
    fontSize: 12,
    color: '#666',
  },
  completionHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  completionSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  resultsPreview: {
    marginBottom: 30,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 15,
  },
  linkButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdvancedFeaturesOnboardingScreen;
