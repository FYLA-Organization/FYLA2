import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import FirstTimeUserGuide, { useFirstTimeUserGuide } from '../../components/FirstTimeUserGuide';
import QuickStartGuide, { useQuickStartGuide } from '../../components/QuickStartGuide';
import InteractiveTutorial, { TutorialConfigs } from '../../components/InteractiveTutorial';
import { MODERN_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/modernDesign';

const { width } = Dimensions.get('window');

interface HelpItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  action: () => void;
  category: 'getting-started' | 'features' | 'tutorials' | 'support';
}

const HelpCenterScreen: React.FC = () => {
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('getting-started');

  const navigation = useNavigation();
  const { user } = useAuth();
  
  const userType = user?.isServiceProvider ? 'provider' : 'client';
  const firstTimeGuide = useFirstTimeUserGuide(userType);
  const quickStartGuide = useQuickStartGuide(userType);

  const getHelpItems = (): HelpItem[] => {
    const baseItems: HelpItem[] = [
      {
        id: 'first-time-guide',
        title: 'First Time Using FYLA2?',
        description: 'Complete walkthrough of all features and how to get started',
        icon: 'rocket',
        color: MODERN_COLORS.primary,
        category: 'getting-started',
        action: () => setShowFirstTimeGuide(true),
      },
      {
        id: 'quick-start',
        title: 'Quick Start Checklist',
        description: 'Step-by-step tasks to get you up and running quickly',
        icon: 'checkmark-circle',
        color: '#4ECDC4',
        category: 'getting-started',
        action: () => setShowQuickStart(true),
      },
      {
        id: 'search-tutorial',
        title: 'How to Search',
        description: 'Learn to find services and providers effectively',
        icon: 'search',
        color: '#FF6B6B',
        category: 'tutorials',
        action: () => {
          setCurrentTutorial(TutorialConfigs.searchScreen);
          setShowTutorial(true);
        },
      },
    ];

    if (userType === 'client') {
      baseItems.push(
        {
          id: 'booking-help',
          title: 'Making Your First Booking',
          description: 'Step-by-step guide to booking appointments',
          icon: 'calendar',
          color: '#A8E6CF',
          category: 'tutorials',
          action: () => {
            setCurrentTutorial(TutorialConfigs.bookingFlow);
            setShowTutorial(true);
          },
        },
        {
          id: 'loyalty-rewards',
          title: 'Understanding Rewards',
          description: 'How to earn and redeem loyalty points',
          icon: 'gift',
          color: '#FFE66D',
          category: 'features',
          action: () => {
            setCurrentTutorial(TutorialConfigs.loyaltyRewards);
            setShowTutorial(true);
          },
        },
        {
          id: 'profile-setup',
          title: 'Complete Your Profile',
          description: 'Set up your profile for personalized recommendations',
          icon: 'person-circle',
          color: '#8B5CF6',
          category: 'getting-started',
          action: () => navigation.navigate('EnhancedProfile' as never),
        }
      );
    } else {
      baseItems.push(
        {
          id: 'business-setup',
          title: 'Setting Up Your Business',
          description: 'Complete guide to business profile setup',
          icon: 'business',
          color: '#8B5CF6',
          category: 'getting-started',
          action: () => navigation.navigate('EnhancedProfile' as never),
        },
        {
          id: 'service-management',
          title: 'Managing Your Services',
          description: 'Add, edit, and organize your service offerings',
          icon: 'cut',
          color: '#FF6B6B',
          category: 'features',
          action: () => navigation.navigate('EnhancedServiceManagement' as never),
        },
        {
          id: 'schedule-setup',
          title: 'Managing Your Schedule',
          description: 'Set availability and manage appointments',
          icon: 'time',
          color: '#4ECDC4',
          category: 'features',
          action: () => navigation.navigate('ProviderAvailability' as never),
        },
        {
          id: 'business-features',
          title: 'Advanced Business Features',
          description: 'Explore marketing, branding, and analytics tools',
          icon: 'trending-up',
          color: '#FFD700',
          category: 'features',
          action: () => navigation.navigate('SubscriptionPlans' as never),
        }
      );
    }

    // Support items for everyone
    baseItems.push(
      {
        id: 'contact-support',
        title: 'Contact Support',
        description: 'Get help from our support team',
        icon: 'headset',
        color: MODERN_COLORS.success,
        category: 'support',
        action: () => {
          // Could open email, chat, or support form
        },
      },
      {
        id: 'faq',
        title: 'Frequently Asked Questions',
        description: 'Find answers to common questions',
        icon: 'help-buoy',
        color: MODERN_COLORS.info,
        category: 'support',
        action: () => {
          // Navigate to FAQ screen
        },
      }
    );

    return baseItems;
  };

  const helpItems = getHelpItems();
  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: 'rocket' },
    { id: 'features', name: 'Features', icon: 'star' },
    { id: 'tutorials', name: 'Tutorials', icon: 'school' },
    { id: 'support', name: 'Support', icon: 'headset' },
  ];

  const filteredItems = helpItems.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  );

  const renderCategoryTab = (category: any) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryTab,
        selectedCategory === category.id && styles.categoryTabActive,
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Ionicons 
        name={category.icon as any} 
        size={20} 
        color={selectedCategory === category.id ? 'white' : MODERN_COLORS.gray600} 
      />
      <Text style={[
        styles.categoryTabText,
        selectedCategory === category.id && styles.categoryTabTextActive,
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const renderHelpItem = (item: HelpItem) => (
    <TouchableOpacity key={item.id} style={styles.helpItem} onPress={item.action}>
      <View style={[styles.helpIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={24} color="white" />
      </View>
      <View style={styles.helpContent}>
        <Text style={styles.helpTitle}>{item.title}</Text>
        <Text style={styles.helpDescription}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={MODERN_COLORS.gray400} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help Center</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.headerSubtitle}>
          {userType === 'client' 
            ? 'Get help with booking and using FYLA2'
            : 'Learn how to grow your business with FYLA2'
          }
        </Text>
      </LinearGradient>

      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {categories.map(renderCategoryTab)}
      </ScrollView>

      {/* Help Items */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.helpItems}>
          {filteredItems.map(renderHelpItem)}
        </View>
      </ScrollView>

      {/* Modals */}
      <FirstTimeUserGuide
        visible={showFirstTimeGuide}
        onClose={() => setShowFirstTimeGuide(false)}
        userType={userType}
        navigation={navigation}
      />

      <QuickStartGuide
        visible={showQuickStart}
        onClose={() => setShowQuickStart(false)}
        userType={userType}
        navigation={navigation}
      />

      <InteractiveTutorial
        visible={showTutorial}
        onClose={() => setShowTutorial(false)}
        steps={currentTutorial}
        tutorialType="help"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  categoryTabs: {
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.gray200,
  },
  categoryTabsContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginRight: SPACING.sm,
    backgroundColor: MODERN_COLORS.gray100,
  },
  categoryTabActive: {
    backgroundColor: MODERN_COLORS.primary,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: MODERN_COLORS.gray600,
    marginLeft: SPACING.sm,
  },
  categoryTabTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  helpItems: {
    padding: SPACING.lg,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  helpIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MODERN_COLORS.gray900,
    marginBottom: SPACING.xs,
  },
  helpDescription: {
    fontSize: 14,
    color: MODERN_COLORS.gray600,
    lineHeight: 20,
  },
});

export default HelpCenterScreen;
