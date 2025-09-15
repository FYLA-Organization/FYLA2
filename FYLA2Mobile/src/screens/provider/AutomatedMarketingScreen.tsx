import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, COMMON_STYLES } from '../../constants/colors';
import FeatureGatingService from '../../services/featureGatingService';

interface MarketingCampaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'social';
  status: 'active' | 'paused' | 'draft';
  targetAudience: string;
  sentCount: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  isActive: boolean;
  description: string;
}

const AutomatedMarketingScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [canUseAutomatedMarketing, setCanUseAutomatedMarketing] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'automation' | 'analytics'>('campaigns');
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);

  useEffect(() => {
    checkPermissionsAndLoadData();
  }, []);

  const checkPermissionsAndLoadData = async () => {
    try {
      const marketingCheck = await FeatureGatingService.canUseAutomatedMarketing();
      setCanUseAutomatedMarketing(marketingCheck.allowed);
      
      if (marketingCheck.allowed) {
        loadMarketingData();
      }
    } catch (error) {
      console.error('Error checking marketing permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMarketingData = async () => {
    // Simulate loading from API
    setCampaigns([
      {
        id: '1',
        name: 'Welcome New Clients',
        type: 'email',
        status: 'active',
        targetAudience: 'New clients',
        sentCount: 145,
        openRate: 68.5,
        clickRate: 12.3,
        createdAt: '2025-09-01',
      },
      {
        id: '2',
        name: 'Birthday Specials',
        type: 'sms',
        status: 'active',
        targetAudience: 'Birthday clients',
        sentCount: 89,
        openRate: 92.1,
        clickRate: 34.6,
        createdAt: '2025-08-15',
      },
      {
        id: '3',
        name: 'Appointment Reminders',
        type: 'push',
        status: 'active',
        targetAudience: 'All clients',
        sentCount: 1250,
        openRate: 87.3,
        clickRate: 45.8,
        createdAt: '2025-08-01',
      },
    ]);

    setAutomationRules([
      {
        id: '1',
        name: 'Welcome Series',
        trigger: 'New client registration',
        action: 'Send welcome email sequence',
        isActive: true,
        description: 'Automatically send a 3-email welcome series to new clients',
      },
      {
        id: '2',
        name: 'Appointment Reminders',
        trigger: '24 hours before appointment',
        action: 'Send SMS reminder',
        isActive: true,
        description: 'Send automatic SMS reminders 24 hours before appointments',
      },
      {
        id: '3',
        name: 'Review Requests',
        trigger: '2 hours after appointment',
        action: 'Send review request email',
        isActive: false,
        description: 'Request reviews from clients after completed appointments',
      },
      {
        id: '4',
        name: 'Re-engagement Campaign',
        trigger: '30 days since last visit',
        action: 'Send special offer email',
        isActive: true,
        description: 'Win back clients who haven\'t visited in 30 days',
      },
    ]);
  };

  const handleUpgrade = () => {
    navigation.navigate('SubscriptionPlans' as any);
  };

  const toggleAutomationRule = (id: string) => {
    setAutomationRules(prev => 
      prev.map(rule => 
        rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  const renderCampaignCard = (campaign: MarketingCampaign) => (
    <View key={campaign.id} style={styles.campaignCard}>
      <View style={styles.campaignHeader}>
        <View style={styles.campaignInfo}>
          <Text style={styles.campaignName}>{campaign.name}</Text>
          <View style={styles.campaignMeta}>
            <View style={[styles.campaignType, getTypeStyle(campaign.type)]}>
              <Ionicons name={getTypeIcon(campaign.type)} size={12} color="#FFFFFF" />
              <Text style={styles.campaignTypeText}>{campaign.type.toUpperCase()}</Text>
            </View>
            <View style={[styles.campaignStatus, getStatusStyle(campaign.status)]}>
              <Text style={styles.campaignStatusText}>{campaign.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.campaignAction}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.campaignStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{campaign.sentCount}</Text>
          <Text style={styles.statLabel}>Sent</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{campaign.openRate}%</Text>
          <Text style={styles.statLabel}>Opens</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{campaign.clickRate}%</Text>
          <Text style={styles.statLabel}>Clicks</Text>
        </View>
      </View>
    </View>
  );

  const renderAutomationRule = (rule: AutomationRule) => (
    <View key={rule.id} style={styles.automationCard}>
      <View style={styles.automationHeader}>
        <View style={styles.automationInfo}>
          <Text style={styles.automationName}>{rule.name}</Text>
          <Text style={styles.automationDescription}>{rule.description}</Text>
        </View>
        <Switch
          value={rule.isActive}
          onValueChange={() => toggleAutomationRule(rule.id)}
          trackColor={{ false: COLORS.border, true: COLORS.success + '50' }}
          thumbColor={rule.isActive ? COLORS.success : COLORS.textSecondary}
        />
      </View>
      
      <View style={styles.automationFlow}>
        <View style={styles.flowStep}>
          <View style={[styles.flowStepIcon, { backgroundColor: COLORS.warning }]}>
            <Ionicons name="flash" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.flowStepText}>{rule.trigger}</Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} />
        <View style={styles.flowStep}>
          <View style={[styles.flowStepIcon, { backgroundColor: COLORS.success }]}>
            <Ionicons name="send" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.flowStepText}>{rule.action}</Text>
        </View>
      </View>
    </View>
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return 'mail';
      case 'sms': return 'chatbubble';
      case 'push': return 'notifications';
      case 'social': return 'share-social';
      default: return 'mail';
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'email': return { backgroundColor: '#3B82F6' };
      case 'sms': return { backgroundColor: '#10B981' };
      case 'push': return { backgroundColor: '#8B5CF6' };
      case 'social': return { backgroundColor: '#F59E0B' };
      default: return { backgroundColor: COLORS.textSecondary };
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return { backgroundColor: COLORS.success };
      case 'paused': return { backgroundColor: COLORS.warning };
      case 'draft': return { backgroundColor: COLORS.textSecondary };
      default: return { backgroundColor: COLORS.textSecondary };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading marketing tools...</Text>
      </View>
    );
  }

  if (!canUseAutomatedMarketing) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.upgradeContainer}>
          <View style={styles.upgradeContent}>
            <Ionicons name="megaphone" size={48} color="#FFFFFF" style={styles.upgradeIcon} />
            <Text style={styles.upgradeTitle}>Automated Marketing</Text>
            <Text style={styles.upgradeSubtitle}>
              Grow your business with powerful automated marketing campaigns and client engagement tools.
            </Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.featureText}>Email marketing campaigns</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.featureText}>SMS automation</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.featureText}>Client retention tools</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.featureText}>Analytics & reporting</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Text style={styles.upgradeButtonText}>Upgrade to Business Plan</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marketing Hub</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'campaigns' && styles.activeTab]}
          onPress={() => setActiveTab('campaigns')}
        >
          <Text style={[styles.tabText, activeTab === 'campaigns' && styles.activeTabText]}>
            Campaigns
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'automation' && styles.activeTab]}
          onPress={() => setActiveTab('automation')}
        >
          <Text style={[styles.tabText, activeTab === 'automation' && styles.activeTabText]}>
            Automation
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'campaigns' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Campaigns</Text>
              <TouchableOpacity style={styles.createButton}>
                <Text style={styles.createButtonText}>Create Campaign</Text>
              </TouchableOpacity>
            </View>
            {campaigns.map(renderCampaignCard)}
          </View>
        )}

        {activeTab === 'automation' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Automation Rules</Text>
              <TouchableOpacity style={styles.createButton}>
                <Text style={styles.createButtonText}>Add Rule</Text>
              </TouchableOpacity>
            </View>
            {automationRules.map(renderAutomationRule)}
          </View>
        )}

        {activeTab === 'analytics' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Marketing Analytics</Text>
            
            {/* Summary Stats */}
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsValue}>2,847</Text>
                <Text style={styles.analyticsLabel}>Total Sent</Text>
                <Text style={styles.analyticsChange}>+12% this month</Text>
              </View>
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsValue}>78.5%</Text>
                <Text style={styles.analyticsLabel}>Avg Open Rate</Text>
                <Text style={styles.analyticsChange}>+5.2% this month</Text>
              </View>
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsValue}>28.4%</Text>
                <Text style={styles.analyticsLabel}>Avg Click Rate</Text>
                <Text style={styles.analyticsChange}>+3.1% this month</Text>
              </View>
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsValue}>$3,290</Text>
                <Text style={styles.analyticsLabel}>Revenue Generated</Text>
                <Text style={styles.analyticsChange}>+18% this month</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  addButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
  campaignCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...COMMON_STYLES.shadow,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  campaignMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  campaignType: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  campaignTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  campaignStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  campaignStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  campaignAction: {
    padding: 4,
  },
  campaignStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  automationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...COMMON_STYLES.shadow,
  },
  automationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  automationInfo: {
    flex: 1,
    marginRight: 16,
  },
  automationName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  automationDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  automationFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flowStep: {
    flex: 1,
    alignItems: 'center',
  },
  flowStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  flowStepText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  analyticsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    ...COMMON_STYLES.shadow,
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  analyticsChange: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  
  // Upgrade screen styles
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  upgradeContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
  },
  upgradeIcon: {
    marginBottom: 16,
  },
  upgradeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  upgradeSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 24,
    lineHeight: 24,
  },
  featuresList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
});

export default AutomatedMarketingScreen;
