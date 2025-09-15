import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import FeatureGatingService from '../../services/featureGatingService';
import { MODERN_COLORS, SPACING } from '../../constants/modernDesign';

const { width } = Dimensions.get('window');

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  totalBookings: number;
  lastVisit: string;
  firstVisit: string;
  tags: string[];
  notes: string;
  status: 'active' | 'inactive' | 'vip';
  preferences: {
    services: string[];
    preferredTime: string;
    notifications: boolean;
  };
}

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  averageBookingValue: number;
  totalCustomers: number;
  repeatCustomers: number;
  revenueGrowth: number;
  customerRetentionRate: number;
}

const RevenueCRMScreen = () => {
  const navigation = useNavigation();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'revenue' | 'customers'>('revenue');
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'vip'>('all');

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      setLoading(true);
      const accessCheck = await FeatureGatingService.canUseCRM();
      setHasAccess(accessCheck.allowed);
      
      if (accessCheck.allowed) {
        await loadData();
      }
    } catch (error) {
      console.error('Error checking CRM access:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Mock data for demonstration
      const mockRevenueData: RevenueData = {
        totalRevenue: 45250,
        monthlyRevenue: 8450,
        weeklyRevenue: 2100,
        averageBookingValue: 125,
        totalCustomers: 234,
        repeatCustomers: 156,
        revenueGrowth: 12.5,
        customerRetentionRate: 78.2,
      };

      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah@email.com',
          phone: '(555) 123-4567',
          totalSpent: 1250,
          totalBookings: 12,
          lastVisit: '2024-01-15T14:30:00Z',
          firstVisit: '2023-06-15T10:00:00Z',
          tags: ['VIP', 'Regular'],
          notes: 'Prefers afternoon appointments',
          status: 'vip',
          preferences: {
            services: ['Hair Styling', 'Hair Coloring'],
            preferredTime: 'afternoon',
            notifications: true,
          },
        },
        {
          id: '2',
          name: 'Emily Davis',
          email: 'emily@email.com',
          phone: '(555) 987-6543',
          totalSpent: 650,
          totalBookings: 6,
          lastVisit: '2024-01-10T16:00:00Z',
          firstVisit: '2023-09-20T11:30:00Z',
          tags: ['Regular'],
          notes: 'Allergic to certain hair products',
          status: 'active',
          preferences: {
            services: ['Manicure', 'Pedicure'],
            preferredTime: 'morning',
            notifications: true,
          },
        },
        {
          id: '3',
          name: 'Jennifer Wilson',
          email: 'jennifer@email.com',
          phone: '(555) 456-7890',
          totalSpent: 320,
          totalBookings: 3,
          lastVisit: '2023-12-05T13:15:00Z',
          firstVisit: '2023-10-15T15:45:00Z',
          tags: ['New'],
          notes: '',
          status: 'inactive',
          preferences: {
            services: ['Facial'],
            preferredTime: 'evening',
            notifications: false,
          },
        },
      ];

      setRevenueData(mockRevenueData);
      setCustomers(mockCustomers);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return MODERN_COLORS.accent;
      case 'active': return MODERN_COLORS.success;
      case 'inactive': return MODERN_COLORS.gray500;
      default: return MODERN_COLORS.gray500;
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || customer.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const renderRevenueTab = () => {
    if (!revenueData) return null;

    return (
      <View style={styles.tabContent}>
        <View style={styles.metricsGrid}>
          <BlurView intensity={20} style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatCurrency(revenueData.totalRevenue)}</Text>
            <Text style={styles.metricLabel}>Total Revenue</Text>
          </BlurView>
          <BlurView intensity={20} style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatCurrency(revenueData.monthlyRevenue)}</Text>
            <Text style={styles.metricLabel}>This Month</Text>
          </BlurView>
          <BlurView intensity={20} style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatCurrency(revenueData.weeklyRevenue)}</Text>
            <Text style={styles.metricLabel}>This Week</Text>
          </BlurView>
          <BlurView intensity={20} style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatCurrency(revenueData.averageBookingValue)}</Text>
            <Text style={styles.metricLabel}>Avg. Booking</Text>
          </BlurView>
        </View>

        <BlurView intensity={20} style={styles.growthCard}>
          <View style={styles.growthHeader}>
            <Ionicons name="trending-up" size={24} color={MODERN_COLORS.success} />
            <Text style={styles.growthTitle}>Revenue Growth</Text>
          </View>
          <Text style={styles.growthValue}>+{revenueData.revenueGrowth}%</Text>
          <Text style={styles.growthDescription}>Compared to last month</Text>
        </BlurView>

        <BlurView intensity={20} style={styles.customerMetricsCard}>
          <Text style={styles.cardTitle}>Customer Metrics</Text>
          <View style={styles.customerMetricsRow}>
            <View style={styles.customerMetric}>
              <Text style={styles.customerMetricValue}>{revenueData.totalCustomers}</Text>
              <Text style={styles.customerMetricLabel}>Total Customers</Text>
            </View>
            <View style={styles.customerMetric}>
              <Text style={styles.customerMetricValue}>{revenueData.repeatCustomers}</Text>
              <Text style={styles.customerMetricLabel}>Repeat Customers</Text>
            </View>
            <View style={styles.customerMetric}>
              <Text style={styles.customerMetricValue}>{revenueData.customerRetentionRate}%</Text>
              <Text style={styles.customerMetricLabel}>Retention Rate</Text>
            </View>
          </View>
        </BlurView>
      </View>
    );
  };

  const renderCustomerTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchAndFilter}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.7)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'active', 'inactive', 'vip'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                { backgroundColor: filterStatus === status ? MODERN_COLORS.primary : 'rgba(255, 255, 255, 0.1)' }
              ]}
              onPress={() => setFilterStatus(status as any)}
            >
              <Text style={styles.filterButtonText}>{status.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.customersList}>
        {filteredCustomers.map((customer) => (
          <BlurView key={customer.id} intensity={20} style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerEmail}>{customer.email}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(customer.status) }]}>
                <Text style={styles.statusText}>{customer.status.toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.customerStats}>
              <View style={styles.customerStat}>
                <Text style={styles.customerStatValue}>{formatCurrency(customer.totalSpent)}</Text>
                <Text style={styles.customerStatLabel}>Total Spent</Text>
              </View>
              <View style={styles.customerStat}>
                <Text style={styles.customerStatValue}>{customer.totalBookings}</Text>
                <Text style={styles.customerStatLabel}>Bookings</Text>
              </View>
              <View style={styles.customerStat}>
                <Text style={styles.customerStatValue}>{formatDate(customer.lastVisit)}</Text>
                <Text style={styles.customerStatLabel}>Last Visit</Text>
              </View>
            </View>

            {customer.tags.length > 0 && (
              <View style={styles.customerTags}>
                {customer.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {customer.notes && (
              <Text style={styles.customerNotes}>{customer.notes}</Text>
            )}
          </BlurView>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryDark]} style={[styles.container, styles.centered]}>
        <BlurView intensity={20} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading CRM...</Text>
        </BlurView>
      </LinearGradient>
    );
  }

  if (!hasAccess) {
    return (
      <LinearGradient colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryDark]} style={[styles.container, styles.centered]}>
        <BlurView intensity={20} style={styles.upgradeCard}>
          <Ionicons name="analytics-outline" size={64} color="white" style={{ opacity: 0.7 }} />
          <Text style={styles.upgradeTitle}>Revenue Tracking & CRM</Text>
          <Text style={styles.upgradeDescription}>
            Advanced revenue analytics and customer relationship management tools for growing your business.
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={MODERN_COLORS.success} />
              <Text style={styles.featureText}>Advanced revenue tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={MODERN_COLORS.success} />
              <Text style={styles.featureText}>Customer relationship management</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={MODERN_COLORS.success} />
              <Text style={styles.featureText}>Retention analytics</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('SubscriptionPlans' as never)}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Business</Text>
          </TouchableOpacity>
        </BlurView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryDark]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Revenue & CRM</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'revenue' && styles.activeTab]}
          onPress={() => setActiveTab('revenue')}
        >
          <Ionicons 
            name="analytics-outline" 
            size={20} 
            color={activeTab === 'revenue' ? 'white' : 'rgba(255, 255, 255, 0.6)'} 
          />
          <Text style={[styles.tabText, activeTab === 'revenue' && styles.activeTabText]}>Revenue</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'customers' && styles.activeTab]}
          onPress={() => setActiveTab('customers')}
        >
          <Ionicons 
            name="people-outline" 
            size={20} 
            color={activeTab === 'customers' ? 'white' : 'rgba(255, 255, 255, 0.6)'} 
          />
          <Text style={[styles.tabText, activeTab === 'customers' && styles.activeTabText]}>Customers</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
        }
      >
        {activeTab === 'revenue' ? renderRevenueTab() : renderCustomerTab()}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  loadingContainer: {
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: SPACING.md,
  },
  upgradeCard: {
    padding: SPACING.xl,
    borderRadius: 20,
    alignItems: 'center',
    margin: SPACING.lg,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  upgradeDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  featureList: {
    marginBottom: SPACING.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featureText: {
    color: 'white',
    fontSize: 16,
    marginLeft: SPACING.sm,
  },
  upgradeButton: {
    backgroundColor: MODERN_COLORS.success,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: SPACING.lg,
    paddingBottom: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginHorizontal: SPACING.xs,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: SPACING.sm,
  },
  activeTabText: {
    color: 'white',
  },
  tabContent: {
    gap: SPACING.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  metricCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  metricLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  growthCard: {
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
  },
  growthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  growthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: SPACING.sm,
  },
  growthValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: MODERN_COLORS.success,
  },
  growthDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: SPACING.xs,
  },
  customerMetricsCard: {
    padding: SPACING.lg,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: SPACING.md,
  },
  customerMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customerMetric: {
    alignItems: 'center',
  },
  customerMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  customerMetricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  searchAndFilter: {
    gap: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    marginLeft: SPACING.sm,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginRight: SPACING.sm,
  },
  filterButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  customersList: {
    gap: SPACING.md,
  },
  customerCard: {
    padding: SPACING.lg,
    borderRadius: 16,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  customerEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  customerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  customerStat: {
    alignItems: 'center',
  },
  customerStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  customerStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: SPACING.xs,
  },
  customerTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  customerNotes: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
});

export default RevenueCRMScreen;
