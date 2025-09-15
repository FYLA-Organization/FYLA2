import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressChart, BarChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

interface MarketingOverview {
  totalCampaigns: number;
  activeCampaigns: number;
  totalCustomers: number;
  totalRevenue: number;
  loyaltyMembers: number;
  activePromotions: number;
  totalReferrals: number;
}

interface Campaign {
  id: number;
  name: string;
  type: string;
  status: string;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  revenue: number;
  createdAt: string;
}

const MarketingDashboardScreen: React.FC = ({ navigation }: any) => {
  const [overview, setOverview] = useState<MarketingOverview | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewData, campaignsData] = await Promise.all([
        apiService.getMarketingOverview(),
        apiService.getCampaigns(),
      ]);

      setOverview(overviewData);
      setCampaigns(campaignsData.slice(0, 5)); // Show latest 5 campaigns
    } catch (error) {
      console.error('Error loading marketing dashboard:', error);
      Alert.alert('Error', 'Failed to load marketing dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'paused': return '#FF9800';
      case 'completed': return '#2196F3';
      default: return '#757575';
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#4CAF50',
    },
  };

  const renderStatsCard = (title: string, value: string, icon: string, color: string) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statsTitle}>{title}</Text>
      </View>
      <Text style={[styles.statsValue, { color }]}>{value}</Text>
    </View>
  );

  if (loading && !overview) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading marketing dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.header}>
          <Text style={styles.headerTitle}>Marketing Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage your marketing campaigns and analytics</Text>
        </LinearGradient>

        {/* Overview Stats */}
        {overview && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              {renderStatsCard('Total Campaigns', overview.totalCampaigns.toString(), 'megaphone-outline', '#2196F3')}
              {renderStatsCard('Active Campaigns', overview.activeCampaigns.toString(), 'play-circle-outline', '#4CAF50')}
              {renderStatsCard('Total Customers', overview.totalCustomers.toString(), 'people-outline', '#FF9800')}
              {renderStatsCard('Total Revenue', formatCurrency(overview.totalRevenue), 'cash-outline', '#9C27B0')}
              {renderStatsCard('Loyalty Members', overview.loyaltyMembers.toString(), 'star-outline', '#FF5722')}
              {renderStatsCard('Active Promotions', overview.activePromotions.toString(), 'pricetag-outline', '#795548')}
            </View>
          </View>
        )}

        {/* Campaign Performance Chart */}
        {campaigns.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Campaign Performance</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={{
                  labels: campaigns.map(c => c.name.substring(0, 8)),
                  datasets: [{
                    data: campaigns.map(c => c.revenue),
                  }],
                }}
                width={width + 50}
                height={220}
                yAxisLabel="$"
                yAxisSuffix=""
                chartConfig={chartConfig}
                style={styles.chart}
              />
            </ScrollView>
          </View>
        )}

        {/* Recent Campaigns */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Campaigns</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('CampaignsList')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {campaigns.map((campaign) => (
            <TouchableOpacity
              key={campaign.id}
              style={styles.campaignCard}
              onPress={() => navigation.navigate('CampaignDetail', { campaignId: campaign.id })}
            >
              <View style={styles.campaignHeader}>
                <Text style={styles.campaignName}>{campaign.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign.status) }]}>
                  <Text style={styles.statusText}>{campaign.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.campaignType}>{campaign.type.replace('_', ' ').toUpperCase()}</Text>
              
              <View style={styles.campaignStats}>
                <View style={styles.statItem}>
                  <Ionicons name="send-outline" size={16} color="#666" />
                  <Text style={styles.statText}>{campaign.totalSent} sent</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="eye-outline" size={16} color="#666" />
                  <Text style={styles.statText}>{campaign.totalOpened} opened</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="cash-outline" size={16} color="#666" />
                  <Text style={styles.statText}>{formatCurrency(campaign.revenue)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('CreateCampaign')}
            >
              <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.actionGradient}>
                <Ionicons name="add-circle-outline" size={32} color="#FFF" />
                <Text style={styles.actionText}>New Campaign</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('CustomerSegments')}
            >
              <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.actionGradient}>
                <Ionicons name="people-outline" size={32} color="#FFF" />
                <Text style={styles.actionText}>Customer Segments</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('LoyaltyPrograms')}
            >
              <LinearGradient colors={['#9C27B0', '#7B1FA2']} style={styles.actionGradient}>
                <Ionicons name="star-outline" size={32} color="#FFF" />
                <Text style={styles.actionText}>Loyalty Programs</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Promotions')}
            >
              <LinearGradient colors={['#4CAF50', '#388E3C']} style={styles.actionGradient}>
                <Ionicons name="pricetag-outline" size={32} color="#FFF" />
                <Text style={styles.actionText}>Promotions</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('ReferralPrograms')}
            >
              <LinearGradient colors={['#FF5722', '#D84315']} style={styles.actionGradient}>
                <Ionicons name="share-outline" size={32} color="#FFF" />
                <Text style={styles.actionText}>Referrals</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('MarketingAutomation')}
            >
              <LinearGradient colors={['#607D8B', '#455A64']} style={styles.actionGradient}>
                <Ionicons name="settings-outline" size={32} color="#FFF" />
                <Text style={styles.actionText}>Automation</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  section: {
    margin: 15,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  viewAllText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  statsValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  campaignCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  campaignType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  campaignStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  actionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});

export default MarketingDashboardScreen;
