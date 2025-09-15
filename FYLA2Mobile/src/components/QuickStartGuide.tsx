import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MODERN_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/modernDesign';

const { width, height } = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  completed: boolean;
  action: () => void;
  estimatedTime?: string;
  difficulty?: 'Easy' | 'Medium' | 'Advanced';
}

interface QuickStartGuideProps {
  visible: boolean;
  onClose: () => void;
  userType: 'client' | 'provider';
  navigation?: any;
  onActionComplete?: (actionId: string) => void;
}

const QuickStartGuide: React.FC<QuickStartGuideProps> = ({
  visible,
  onClose,
  userType,
  navigation,
  onActionComplete,
}) => {
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');

  useEffect(() => {
    loadCompletedActions();
  }, []);

  const loadCompletedActions = async () => {
    try {
      const completed = await AsyncStorage.getItem(`quickstart_completed_${userType}`);
      if (completed) {
        setCompletedActions(new Set(JSON.parse(completed)));
      }
    } catch (error) {
      console.error('Error loading completed actions:', error);
    }
  };

  const markActionCompleted = async (actionId: string) => {
    const newCompleted = new Set(completedActions);
    newCompleted.add(actionId);
    setCompletedActions(newCompleted);
    
    try {
      await AsyncStorage.setItem(
        `quickstart_completed_${userType}`,
        JSON.stringify(Array.from(newCompleted))
      );
    } catch (error) {
      console.error('Error saving completed action:', error);
    }

    if (onActionComplete) {
      onActionComplete(actionId);
    }
  };

  const getClientActions = (): QuickAction[] => [
    {
      id: 'complete-profile',
      title: 'Complete Your Profile',
      description: 'Add a photo and your preferences for personalized recommendations',
      icon: 'person-circle',
      color: MODERN_COLORS.primary,
      completed: completedActions.has('complete-profile'),
      estimatedTime: '2 min',
      difficulty: 'Easy',
      action: () => {
        markActionCompleted('complete-profile');
        onClose();
        navigation?.navigate('EnhancedProfile');
      },
    },
    {
      id: 'first-search',
      title: 'Find Your First Service',
      description: 'Search for beauty services near you and explore what\'s available',
      icon: 'search',
      color: '#FF6B6B',
      completed: completedActions.has('first-search'),
      estimatedTime: '1 min',
      difficulty: 'Easy',
      action: () => {
        markActionCompleted('first-search');
        onClose();
        navigation?.navigate('Search');
      },
    },
    {
      id: 'first-booking',
      title: 'Make Your First Booking',
      description: 'Book a service and experience our seamless booking process',
      icon: 'calendar',
      color: '#4ECDC4',
      completed: completedActions.has('first-booking'),
      estimatedTime: '3 min',
      difficulty: 'Easy',
      action: () => {
        markActionCompleted('first-booking');
        onClose();
        navigation?.navigate('Search');
      },
    },
    {
      id: 'follow-providers',
      title: 'Follow Your Favorites',
      description: 'Follow providers to see their latest work and get updates',
      icon: 'heart',
      color: '#FFE66D',
      completed: completedActions.has('follow-providers'),
      estimatedTime: '2 min',
      difficulty: 'Easy',
      action: () => {
        markActionCompleted('follow-providers');
        onClose();
        navigation?.navigate('Home');
      },
    },
    {
      id: 'loyalty-program',
      title: 'Learn About Rewards',
      description: 'Discover how to earn points and get exclusive deals',
      icon: 'gift',
      color: '#A8E6CF',
      completed: completedActions.has('loyalty-program'),
      estimatedTime: '1 min',
      difficulty: 'Easy',
      action: () => {
        markActionCompleted('loyalty-program');
        // Could show a detailed loyalty explanation modal
      },
    },
  ];

  const getProviderActions = (): QuickAction[] => [
    {
      id: 'setup-profile',
      title: 'Setup Business Profile',
      description: 'Complete your business information and add a professional photo',
      icon: 'business',
      color: MODERN_COLORS.primary,
      completed: completedActions.has('setup-profile'),
      estimatedTime: '5 min',
      difficulty: 'Easy',
      action: () => {
        markActionCompleted('setup-profile');
        onClose();
        navigation?.navigate('EnhancedProfile');
      },
    },
    {
      id: 'add-services',
      title: 'Add Your Services',
      description: 'List all services you offer with prices and descriptions',
      icon: 'cut',
      color: '#8B5CF6',
      completed: completedActions.has('add-services'),
      estimatedTime: '10 min',
      difficulty: 'Medium',
      action: () => {
        markActionCompleted('add-services');
        onClose();
        navigation?.navigate('EnhancedServiceManagement');
      },
    },
    {
      id: 'set-availability',
      title: 'Set Your Schedule',
      description: 'Configure your working hours and availability for bookings',
      icon: 'time',
      color: '#FF6B6B',
      completed: completedActions.has('set-availability'),
      estimatedTime: '5 min',
      difficulty: 'Medium',
      action: () => {
        markActionCompleted('set-availability');
        onClose();
        navigation?.navigate('ProviderAvailability');
      },
    },
    {
      id: 'upload-portfolio',
      title: 'Upload Portfolio Photos',
      description: 'Showcase your best work to attract more clients',
      icon: 'camera',
      color: '#4ECDC4',
      completed: completedActions.has('upload-portfolio'),
      estimatedTime: '8 min',
      difficulty: 'Easy',
      action: () => {
        markActionCompleted('upload-portfolio');
        onClose();
        navigation?.navigate('EnhancedProfile');
      },
    },
    {
      id: 'explore-features',
      title: 'Explore Business Features',
      description: 'Learn about loyalty programs, marketing tools, and analytics',
      icon: 'trending-up',
      color: '#FFD700',
      completed: completedActions.has('explore-features'),
      estimatedTime: '3 min',
      difficulty: 'Easy',
      action: () => {
        markActionCompleted('explore-features');
        onClose();
        navigation?.navigate('SubscriptionPlans');
      },
    },
  ];

  const actions = userType === 'client' ? getClientActions() : getProviderActions();
  const completedCount = actions.filter(action => action.completed).length;
  const progressPercentage = (completedCount / actions.length) * 100;

  const groupedActions = {
    'getting-started': actions.slice(0, 3),
    'advanced': actions.slice(3),
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return MODERN_COLORS.success;
      case 'Medium': return MODERN_COLORS.warning;
      case 'Advanced': return MODERN_COLORS.error;
      default: return MODERN_COLORS.gray500;
    }
  };

  const renderActionCard = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={[
        styles.actionCard,
        action.completed && styles.actionCardCompleted,
      ]}
      onPress={action.action}
      disabled={action.completed}
    >
      <View style={styles.actionHeader}>
        <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
          <Ionicons
            name={action.completed ? 'checkmark' : (action.icon as any)}
            size={24}
            color="white"
          />
        </View>
        <View style={styles.actionInfo}>
          <Text style={[styles.actionTitle, action.completed && styles.actionTitleCompleted]}>
            {action.title}
          </Text>
          <Text style={styles.actionDescription}>{action.description}</Text>
        </View>
      </View>

      <View style={styles.actionMeta}>
        {action.estimatedTime && (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={MODERN_COLORS.gray600} />
            <Text style={styles.metaText}>{action.estimatedTime}</Text>
          </View>
        )}
        {action.difficulty && (
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(action.difficulty) }]}>
            <Text style={styles.difficultyText}>{action.difficulty}</Text>
          </View>
        )}
      </View>

      {!action.completed && (
        <View style={styles.actionArrow}>
          <Ionicons name="chevron-forward" size={20} color={MODERN_COLORS.gray400} />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSection = (title: string, sectionKey: string, sectionActions: QuickAction[]) => {
    const isExpanded = expandedSection === sectionKey;
    const sectionCompleted = sectionActions.filter(action => action.completed).length;

    return (
      <View key={sectionKey} style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setExpandedSection(isExpanded ? null : sectionKey)}
        >
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.sectionMeta}>
            <Text style={styles.sectionProgress}>
              {sectionCompleted}/{sectionActions.length}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={MODERN_COLORS.gray600}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {sectionActions.map(renderActionCard)}
          </View>
        )}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Quick Start Guide</Text>
            <View style={styles.placeholder} />
          </View>

          <Text style={styles.headerSubtitle}>
            {userType === 'client' 
              ? 'Get the most out of FYLA2 in just a few steps'
              : 'Set up your business and start getting bookings'
            }
          </Text>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {completedCount} of {actions.length} completed
            </Text>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderSection('Getting Started', 'getting-started', groupedActions['getting-started'])}
          {renderSection('Take It Further', 'advanced', groupedActions['advanced'])}

          {/* Completion Message */}
          {completedCount === actions.length && (
            <View style={styles.completionCard}>
              <View style={styles.completionIcon}>
                <Ionicons name="trophy" size={40} color="#FFD700" />
              </View>
              <Text style={styles.completionTitle}>Congratulations!</Text>
              <Text style={styles.completionMessage}>
                {userType === 'client'
                  ? 'You\'re all set up! Start exploring and booking amazing services.'
                  : 'Your business is ready to accept bookings! Check your dashboard for insights.'
                }
              </Text>
              <TouchableOpacity
                style={styles.completionButton}
                onPress={() => {
                  onClose();
                  navigation?.navigate(userType === 'client' ? 'Search' : 'ProviderDashboard');
                }}
              >
                <Text style={styles.completionButtonText}>
                  {userType === 'client' ? 'Start Exploring' : 'Go to Dashboard'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </Modal>
  );
};

// Hook to manage quick start guide visibility
export const useQuickStartGuide = (userType: 'client' | 'provider') => {
  const [shouldShow, setShouldShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkQuickStartStatus();
  }, [userType]);

  const checkQuickStartStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(`quickstart_completed_${userType}`);
      const dismissed = await AsyncStorage.getItem(`quickstart_dismissed_${userType}`);
      
      // Show if not all actions completed and not dismissed
      if (!dismissed) {
        const completedActions = completed ? JSON.parse(completed) : [];
        const totalActions = userType === 'client' ? 5 : 5; // Same for both for now
        
        if (completedActions.length < totalActions) {
          setShouldShow(true);
        }
      }
    } catch (error) {
      console.error('Error checking quick start status:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissGuide = async () => {
    try {
      await AsyncStorage.setItem(`quickstart_dismissed_${userType}`, 'true');
      setShouldShow(false);
    } catch (error) {
      console.error('Error dismissing guide:', error);
    }
  };

  const resetGuide = async () => {
    try {
      await AsyncStorage.removeItem(`quickstart_completed_${userType}`);
      await AsyncStorage.removeItem(`quickstart_dismissed_${userType}`);
      setShouldShow(true);
    } catch (error) {
      console.error('Error resetting guide:', error);
    }
  };

  return {
    shouldShow,
    setShouldShow,
    loading,
    dismissGuide,
    resetGuide,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  closeButton: {
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
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: 8,
    backgroundColor: 'white',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: MODERN_COLORS.gray50,
    borderRadius: BORDER_RADIUS.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: MODERN_COLORS.gray900,
  },
  sectionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionProgress: {
    fontSize: 14,
    color: MODERN_COLORS.gray600,
    marginRight: SPACING.sm,
    fontWeight: '600',
  },
  sectionContent: {
    paddingTop: SPACING.md,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCardCompleted: {
    backgroundColor: MODERN_COLORS.gray50,
    opacity: 0.7,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MODERN_COLORS.gray900,
    marginBottom: SPACING.xs,
  },
  actionTitleCompleted: {
    textDecorationLine: 'line-through',
    color: MODERN_COLORS.gray600,
  },
  actionDescription: {
    fontSize: 14,
    color: MODERN_COLORS.gray600,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  actionMeta: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginRight: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  metaText: {
    fontSize: 12,
    color: MODERN_COLORS.gray600,
    marginLeft: SPACING.xs,
  },
  difficultyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  actionArrow: {
    marginLeft: SPACING.sm,
  },
  completionCard: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginVertical: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  completionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: MODERN_COLORS.gray900,
    marginBottom: SPACING.md,
  },
  completionMessage: {
    fontSize: 16,
    color: MODERN_COLORS.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  completionButton: {
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  completionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  bottomPadding: {
    height: 40,
  },
});

export default QuickStartGuide;
