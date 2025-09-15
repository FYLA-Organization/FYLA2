import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ApiService from '../../services/apiService';

// Theme constants
const MODERN_COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1D1D1F',
  gray100: '#F2F2F7',
  gray300: '#C7C7CC',
  gray400: '#AEAEB2',
  gray500: '#8E8E93',
  gray600: '#636366',
  white: '#FFFFFF',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  purple: '#AF52DE',
  indigo: '#5856D6',
  teal: '#5AC8FA',
  orange: '#FF9500',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const TYPOGRAPHY = {
  sm: 12,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
};

const BORDER_RADIUS = {
  md: 8,
  lg: 12,
};

const SHADOWS = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
};

interface MarketingCampaign {
  id: number;
  title: string;
  description: string;
  campaignType: string;
  status: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  budget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  costPerClick: number;
  isActive: boolean;
  createdAt: string;
}

interface MarketingAnalytics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalEmailsSent: number;
  totalEmailsOpened: number;
  totalEmailsClicked: number;
  averageOpenRate: number;
  averageClickRate: number;
  averageConversionRate: number;
  totalBookingsGenerated: number;
  revenueFromCampaigns: number;
  recentCampaigns: MarketingCampaign[];
}

interface MarketingToolsScreenProps {
  navigation: any;
}

const MarketingToolsScreen: React.FC<MarketingToolsScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [analytics, setAnalytics] = useState<MarketingAnalytics | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'analytics' | 'automation'>('overview');
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    campaignType: 'social_media',
    targetAudience: '',
    startDate: '',
    endDate: '',
    budget: '',
  });

  const [automationSettings, setAutomationSettings] = useState({
    socialMediaPosting: false,
    emailMarketing: false,
    customerRetention: false,
    reviewRequests: false,
    appointmentReminders: false,
    birthdayOffers: false,
    loyaltyProgram: false,
    referralProgram: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignsResponse, analyticsResponse] = await Promise.all([
        ApiService.getMarketingCampaigns(),
        ApiService.getMarketingAnalytics()
      ]);
      
      setCampaigns(campaignsResponse || []);
      setAnalytics(analyticsResponse);
    } catch (error: any) {
      console.error('Error loading marketing data:', error);
      if (error.response?.status === 400) {
        Alert.alert('Access Denied', 'Marketing tools require a Business plan subscription.');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to load marketing data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!newCampaign.title || !newCampaign.campaignType || !newCampaign.targetAudience) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      setSaving(true);
      await ApiService.createMarketingCampaign({
        title: newCampaign.title,
        description: newCampaign.description,
        campaignType: newCampaign.campaignType,
        targetAudience: newCampaign.targetAudience,
        startDate: newCampaign.startDate || new Date().toISOString(),
        endDate: newCampaign.endDate,
        budget: parseFloat(newCampaign.budget) || 0,
      });
      
      Alert.alert('Success', 'Marketing campaign created successfully!');
      setShowCreateModal(false);
      setNewCampaign({
        title: '',
        description: '',
        campaignType: 'social_media',
        targetAudience: '',
        startDate: '',
        endDate: '',
        budget: '',
      });
      loadData();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      Alert.alert('Error', 'Failed to create marketing campaign.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (number: number | undefined) => {
    if (number === undefined || number === null) {
      return '0';
    }
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K';
    }
    return number.toString();
  };

  const getCampaignTypeColor = (type: string) => {
    switch (type) {
      case 'social_media': return MODERN_COLORS.purple;
      case 'email': return MODERN_COLORS.indigo;
      case 'sms': return MODERN_COLORS.teal;
      case 'google_ads': return MODERN_COLORS.orange;
      default: return MODERN_COLORS.gray500;
    }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return MODERN_COLORS.success;
      case 'paused': return MODERN_COLORS.warning;
      case 'completed': return MODERN_COLORS.gray500;
      case 'draft': return MODERN_COLORS.gray400;
      default: return MODERN_COLORS.gray500;
    }
  };

  const CampaignCard: React.FC<{ campaign: MarketingCampaign }> = ({ campaign }) => (
    <View style={styles.campaignCard}>
      <View style={styles.campaignHeader}>
        <View style={styles.campaignInfo}>
          <Text style={styles.campaignTitle}>{campaign.title}</Text>
          <Text style={styles.campaignDescription}>{campaign.description}</Text>
        </View>
        <View style={styles.campaignBadges}>
          <View style={[styles.typeBadge, { backgroundColor: getCampaignTypeColor(campaign.campaignType) + '20' }]}>
            <Text style={[styles.typeText, { color: getCampaignTypeColor(campaign.campaignType) }]}>
              {campaign.campaignType.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getCampaignStatusColor(campaign.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getCampaignStatusColor(campaign.status) }]}>
              {campaign.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.campaignMetrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{formatNumber(campaign.impressions)}</Text>
          <Text style={styles.metricLabel}>Impressions</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{formatNumber(campaign.clicks)}</Text>
          <Text style={styles.metricLabel}>Clicks</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{campaign.conversions}</Text>
          <Text style={styles.metricLabel}>Conversions</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{(campaign.conversionRate * 100).toFixed(1)}%</Text>
          <Text style={styles.metricLabel}>Conv. Rate</Text>
        </View>
      </View>

      <View style={styles.campaignFooter}>
        <View style={styles.budgetInfo}>
          <Text style={styles.budgetText}>Budget: {formatCurrency(campaign.budget)}</Text>
          <Text style={styles.cpcText}>CPC: {formatCurrency(campaign.costPerClick)}</Text>
        </View>
        <View style={styles.campaignActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="analytics" size={16} color={MODERN_COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="pencil" size={16} color={MODERN_COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                campaign.isActive ? 'Pause Campaign' : 'Resume Campaign',
                `${campaign.isActive ? 'Pause' : 'Resume'} this campaign?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: campaign.isActive ? 'Pause' : 'Resume', 
                    onPress: async () => {
                      try {
                        await ApiService.toggleMarketingCampaign(campaign.id);
                        loadData();
                      } catch (error) {
                        Alert.alert('Error', 'Failed to update campaign.');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons 
              name={campaign.isActive ? "pause" : "play"} 
              size={16} 
              color={campaign.isActive ? MODERN_COLORS.warning : MODERN_COLORS.success} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const AutomationToggle: React.FC<{ 
    title: string; 
    description: string; 
    value: boolean; 
    onToggle: () => void;
    icon: string;
  }> = ({ title, description, value, onToggle, icon }) => (
    <View style={styles.automationItem}>
      <View style={styles.automationIcon}>
        <Ionicons name={icon as any} size={24} color={value ? MODERN_COLORS.primary : MODERN_COLORS.gray400} />
      </View>
      <View style={styles.automationContent}>
        <Text style={styles.automationTitle}>{title}</Text>
        <Text style={styles.automationDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: MODERN_COLORS.gray300, true: MODERN_COLORS.primary + '40' }}
        thumbColor={value ? MODERN_COLORS.primary : MODERN_COLORS.white}
      />
    </View>
  );

  const OverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      {analytics && (
        <>
          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.totalCampaigns}</Text>
              <Text style={styles.statLabel}>Total Campaigns</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.activeCampaigns}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatNumber(analytics.totalEmailsOpened)}</Text>
              <Text style={styles.statLabel}>Emails Opened</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatNumber(analytics.totalEmailsClicked)}</Text>
              <Text style={styles.statLabel}>Emails Clicked</Text>
            </View>
          </View>

          {/* Performance Overview */}
          <View style={styles.performanceCard}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <View style={styles.performanceMetrics}>
              <View style={styles.performanceMetric}>
                <Text style={styles.performanceValue}>{analytics.totalBookingsGenerated}</Text>
                <Text style={styles.performanceLabel}>Bookings Generated</Text>
              </View>
              <View style={styles.performanceMetric}>
                <Text style={styles.performanceValue}>{(analytics.averageConversionRate * 100).toFixed(1)}%</Text>
                <Text style={styles.performanceLabel}>Avg. Conv. Rate</Text>
              </View>
              <View style={styles.performanceMetric}>
                <Text style={styles.performanceValue}>{formatCurrency(analytics.revenueFromCampaigns)}</Text>
                <Text style={styles.performanceLabel}>Revenue Generated</Text>
              </View>
              <View style={styles.performanceMetric}>
                <Text style={styles.performanceValue}>{(analytics.averageOpenRate * 100).toFixed(1)}%</Text>
                <Text style={styles.performanceLabel}>Avg. Open Rate</Text>
              </View>
            </View>
          </View>

          {/* Recent Campaigns */}
          {analytics.recentCampaigns && analytics.recentCampaigns.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Campaigns</Text>
              {analytics.recentCampaigns.map((campaign: MarketingCampaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActionsCard}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add-circle" size={32} color={MODERN_COLORS.primary} />
                <Text style={styles.quickActionText}>New Campaign</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction}>
                <Ionicons name="analytics" size={32} color={MODERN_COLORS.secondary} />
                <Text style={styles.quickActionText}>View Analytics</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction}>
                <Ionicons name="settings" size={32} color={MODERN_COLORS.success} />
                <Text style={styles.quickActionText}>Automation</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction}>
                <Ionicons name="mail" size={32} color={MODERN_COLORS.orange} />
                <Text style={styles.quickActionText}>Email Builder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );

  const CampaignsTab = () => (
    <ScrollView style={styles.tabContent}>
      {campaigns.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="megaphone" size={64} color={MODERN_COLORS.gray400} />
          <Text style={styles.emptyStateTitle}>No campaigns yet</Text>
          <Text style={styles.emptyStateText}>
            Create your first marketing campaign to start reaching customers
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.emptyStateButtonText}>Create Campaign</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.campaignsList}>
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </View>
      )}
    </ScrollView>
  );

  const AutomationTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.automationSection}>
        <Text style={styles.sectionTitle}>Marketing Automation</Text>
        <Text style={styles.sectionDescription}>
          Automate your marketing to save time and increase customer engagement
        </Text>

        <View style={styles.automationList}>
          <AutomationToggle
            title="Social Media Posting"
            description="Automatically post to social media platforms"
            value={automationSettings.socialMediaPosting}
            onToggle={() => setAutomationSettings(prev => ({ 
              ...prev, 
              socialMediaPosting: !prev.socialMediaPosting 
            }))}
            icon="logo-instagram"
          />
          
          <AutomationToggle
            title="Email Marketing"
            description="Send automated email campaigns to customers"
            value={automationSettings.emailMarketing}
            onToggle={() => setAutomationSettings(prev => ({ 
              ...prev, 
              emailMarketing: !prev.emailMarketing 
            }))}
            icon="mail"
          />
          
          <AutomationToggle
            title="Customer Retention"
            description="Re-engage customers who haven't booked recently"
            value={automationSettings.customerRetention}
            onToggle={() => setAutomationSettings(prev => ({ 
              ...prev, 
              customerRetention: !prev.customerRetention 
            }))}
            icon="heart"
          />
          
          <AutomationToggle
            title="Review Requests"
            description="Automatically request reviews after appointments"
            value={automationSettings.reviewRequests}
            onToggle={() => setAutomationSettings(prev => ({ 
              ...prev, 
              reviewRequests: !prev.reviewRequests 
            }))}
            icon="star"
          />
          
          <AutomationToggle
            title="Appointment Reminders"
            description="Send automatic appointment reminders"
            value={automationSettings.appointmentReminders}
            onToggle={() => setAutomationSettings(prev => ({ 
              ...prev, 
              appointmentReminders: !prev.appointmentReminders 
            }))}
            icon="alarm"
          />
          
          <AutomationToggle
            title="Birthday Offers"
            description="Send special offers on customer birthdays"
            value={automationSettings.birthdayOffers}
            onToggle={() => setAutomationSettings(prev => ({ 
              ...prev, 
              birthdayOffers: !prev.birthdayOffers 
            }))}
            icon="gift"
          />
          
          <AutomationToggle
            title="Loyalty Program"
            description="Automatically track and reward loyal customers"
            value={automationSettings.loyaltyProgram}
            onToggle={() => setAutomationSettings(prev => ({ 
              ...prev, 
              loyaltyProgram: !prev.loyaltyProgram 
            }))}
            icon="trophy"
          />
          
          <AutomationToggle
            title="Referral Program"
            description="Automate referral tracking and rewards"
            value={automationSettings.referralProgram}
            onToggle={() => setAutomationSettings(prev => ({ 
              ...prev, 
              referralProgram: !prev.referralProgram 
            }))}
            icon="people"
          />
        </View>

        <TouchableOpacity 
          style={styles.saveAutomationButton}
          onPress={async () => {
            try {
              await ApiService.updateMarketingAutomation(automationSettings);
              Alert.alert('Success', 'Automation settings saved!');
            } catch (error) {
              Alert.alert('Error', 'Failed to save automation settings.');
            }
          }}
        >
          <Text style={styles.saveAutomationText}>Save Automation Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
          <Text style={styles.loadingText}>Loading marketing tools...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={MODERN_COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marketing Tools</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color={MODERN_COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
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
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'campaigns' && <CampaignsTab />}
      {activeTab === 'automation' && <AutomationTab />}

      {/* Create Campaign Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Campaign</Text>
            <TouchableOpacity
              style={[styles.modalSaveButton, saving && styles.savingButton]}
              onPress={createCampaign}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={MODERN_COLORS.white} />
              ) : (
                <Text style={styles.modalSaveText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Campaign Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Campaign Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCampaign.title}
                  onChangeText={(text) => setNewCampaign(prev => ({ ...prev, title: text }))}
                  placeholder="e.g., Summer Special Promotion"
                  placeholderTextColor={MODERN_COLORS.gray400}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newCampaign.description}
                  onChangeText={(text) => setNewCampaign(prev => ({ ...prev, description: text }))}
                  placeholder="Describe your campaign..."
                  placeholderTextColor={MODERN_COLORS.gray400}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Campaign Type *</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity style={styles.picker}>
                    <Text style={styles.pickerText}>
                      {newCampaign.campaignType.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={MODERN_COLORS.gray500} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Target Audience *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCampaign.targetAudience}
                  onChangeText={(text) => setNewCampaign(prev => ({ ...prev, targetAudience: text }))}
                  placeholder="e.g., New customers, Returning clients"
                  placeholderTextColor={MODERN_COLORS.gray400}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Budget</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCampaign.budget}
                  onChangeText={(text) => setNewCampaign(prev => ({ ...prev, budget: text }))}
                  placeholder="0"
                  placeholderTextColor={MODERN_COLORS.gray400}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.md,
    color: MODERN_COLORS.gray600,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.gray100,
    backgroundColor: MODERN_COLORS.surface,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '600',
    color: MODERN_COLORS.text,
  },
  addButton: {
    backgroundColor: MODERN_COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: MODERN_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.gray100,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: MODERN_COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.md,
    color: MODERN_COLORS.gray600,
  },
  activeTabText: {
    color: MODERN_COLORS.primary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: MODERN_COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
    color: MODERN_COLORS.primary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginTop: SPACING.xs,
  },
  performanceCard: {
    backgroundColor: MODERN_COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  performanceMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  performanceMetric: {
    width: '48%',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  performanceValue: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: MODERN_COLORS.success,
  },
  performanceLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginTop: SPACING.xs,
  },
  section: {
    margin: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: MODERN_COLORS.text,
    marginBottom: SPACING.md,
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.md,
    color: MODERN_COLORS.gray600,
    marginBottom: SPACING.lg,
  },
  quickActionsCard: {
    backgroundColor: MODERN_COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  quickAction: {
    width: '48%',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  quickActionText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.text,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  campaignsList: {
    padding: SPACING.md,
  },
  campaignCard: {
    backgroundColor: MODERN_COLORS.surface,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  campaignInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  campaignTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: MODERN_COLORS.text,
  },
  campaignDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginTop: SPACING.xs,
  },
  campaignBadges: {
    gap: SPACING.xs,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-end',
  },
  typeText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
  campaignMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: MODERN_COLORS.gray100,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
    color: MODERN_COLORS.text,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginTop: SPACING.xs,
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetInfo: {
    flex: 1,
  },
  budgetText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.text,
    fontWeight: '600',
  },
  cpcText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginTop: SPACING.xs,
  },
  campaignActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray300,
  },
  automationSection: {
    padding: SPACING.md,
  },
  automationList: {
    backgroundColor: MODERN_COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  automationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.gray100,
  },
  automationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MODERN_COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  automationContent: {
    flex: 1,
  },
  automationTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    color: MODERN_COLORS.text,
  },
  automationDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginTop: SPACING.xs,
  },
  saveAutomationButton: {
    backgroundColor: MODERN_COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.sm,
  },
  saveAutomationText: {
    color: MODERN_COLORS.white,
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    margin: SPACING.md,
    backgroundColor: MODERN_COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  emptyStateTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '600',
    color: MODERN_COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.md,
    color: MODERN_COLORS.gray600,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyStateButton: {
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyStateButtonText: {
    color: MODERN_COLORS.white,
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.gray100,
    backgroundColor: MODERN_COLORS.surface,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalCloseText: {
    fontSize: TYPOGRAPHY.md,
    color: MODERN_COLORS.primary,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '600',
    color: MODERN_COLORS.text,
  },
  modalSaveButton: {
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 60,
    alignItems: 'center',
  },
  savingButton: {
    opacity: 0.7,
  },
  modalSaveText: {
    color: MODERN_COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
  modalScrollView: {
    flex: 1,
  },
  formSection: {
    backgroundColor: MODERN_COLORS.surface,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  formSectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: MODERN_COLORS.text,
    marginBottom: SPACING.md,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    color: MODERN_COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.md,
    color: MODERN_COLORS.text,
    backgroundColor: MODERN_COLORS.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: MODERN_COLORS.white,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  pickerText: {
    fontSize: TYPOGRAPHY.md,
    color: MODERN_COLORS.text,
  },
});

export default MarketingToolsScreen;
