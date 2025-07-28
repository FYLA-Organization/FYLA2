import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  RefreshControl,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiService } from '../../services/apiService';

const { width } = Dimensions.get('window');

const ProviderAnalyticsScreen = ({ navigation, route }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [selectedTab, setSelectedTab] = useState('overview');

  const periods = [
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
    { label: '1 Year', value: 365 },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'revenue', label: 'Revenue', icon: 'attach-money' },
    { id: 'bookings', label: 'Bookings', icon: 'event' },
    { id: 'clients', label: 'Clients', icon: 'people' },
  ];

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProviderAnalytics(route.params?.providerId, selectedPeriod);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(139, 69, 199, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#8b45c7',
    },
  };

  const renderStatsCard = (title, value, icon, color, subtitle = '') => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsHeader}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.statsTitle}>{title}</Text>
      </View>
      <Text style={styles.statsValue}>{value}</Text>
      {subtitle ? <Text style={styles.statsSubtitle}>{subtitle}</Text> : null}
    </View>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        {renderStatsCard(
          'Total Revenue',
          `$${analytics?.totalRevenue?.toFixed(2) || '0.00'}`,
          'attach-money',
          '#4CAF50',
          `${analytics?.revenueGrowth?.toFixed(1) || '0'}% growth`
        )}
        {renderStatsCard(
          'Total Bookings',
          analytics?.totalBookings?.toString() || '0',
          'event',
          '#2196F3',
          `${analytics?.bookingGrowth?.toFixed(1) || '0'}% growth`
        )}
        {renderStatsCard(
          'Avg Rating',
          analytics?.averageRating?.toFixed(1) || '0.0',
          'star',
          '#FF9800',
          `${analytics?.totalReviews || 0} reviews`
        )}
        {renderStatsCard(
          'Completion Rate',
          `${((analytics?.completedBookings / analytics?.totalBookings) * 100 || 0).toFixed(1)}%`,
          'check-circle',
          '#9C27B0'
        )}
      </View>

      {/* Top Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Services</Text>
        {analytics?.topServices?.map((service, index) => (
          <View key={service.serviceId} style={styles.serviceItem}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.serviceName}</Text>
              <Text style={styles.serviceStats}>
                {service.bookingCount} bookings • ${service.revenue.toFixed(2)}
              </Text>
            </View>
            <View style={styles.serviceRating}>
              <Icon name="star" size={16} color="#FF9800" />
              <Text style={styles.ratingText}>{service.averageRating.toFixed(1)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRevenueTab = () => (
    <View style={styles.tabContent}>
      {analytics?.revenueHistory?.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Revenue Trend</Text>
          <LineChart
            data={{
              labels: analytics.revenueHistory.slice(-7).map(item => 
                new Date(item.date).getDate().toString()
              ),
              datasets: [{
                data: analytics.revenueHistory.slice(-7).map(item => item.amount),
              }],
            }}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Revenue by Service */}
      {analytics?.topServices?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue by Service</Text>
          <BarChart
            data={{
              labels: analytics.topServices.slice(0, 5).map(s => s.serviceName.substring(0, 8)),
              datasets: [{
                data: analytics.topServices.slice(0, 5).map(s => s.revenue),
              }],
            }}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>
      )}
    </View>
  );

  const renderBookingsTab = () => (
    <View style={styles.tabContent}>
      {analytics?.bookingHistory?.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Booking Trend</Text>
          <LineChart
            data={{
              labels: analytics.bookingHistory.slice(-7).map(item => 
                new Date(item.date).getDate().toString()
              ),
              datasets: [{
                data: analytics.bookingHistory.slice(-7).map(item => item.count),
              }],
            }}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Booking Status Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Status</Text>
        <View style={styles.statusGrid}>
          <View style={[styles.statusCard, { backgroundColor: '#E8F5E8' }]}>
            <Text style={styles.statusValue}>{analytics?.completedBookings || 0}</Text>
            <Text style={styles.statusLabel}>Completed</Text>
          </View>
          <View style={[styles.statusCard, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.statusValue}>
              {(analytics?.totalBookings || 0) - (analytics?.completedBookings || 0) - (analytics?.cancelledBookings || 0)}
            </Text>
            <Text style={styles.statusLabel}>Pending</Text>
          </View>
          <View style={[styles.statusCard, { backgroundColor: '#FFEBEE' }]}>
            <Text style={styles.statusValue}>{analytics?.cancelledBookings || 0}</Text>
            <Text style={styles.statusLabel}>Cancelled</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderClientsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Clients</Text>
        {analytics?.topClients?.map((client, index) => (
          <View key={client.clientId} style={styles.clientItem}>
            <View style={styles.clientInfo}>
              <View style={styles.clientAvatar}>
                <Text style={styles.clientInitial}>
                  {client.clientName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.clientDetails}>
                <Text style={styles.clientName}>{client.clientName}</Text>
                <Text style={styles.clientStats}>
                  {client.totalBookings} bookings • ${client.totalSpent.toFixed(2)}
                </Text>
                <Text style={styles.clientPreference}>
                  Prefers: {client.preferredService}
                </Text>
              </View>
            </View>
            <View style={styles.clientRank}>
              <Text style={styles.rankNumber}>#{index + 1}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverviewTab();
      case 'revenue':
        return renderRevenueTab();
      case 'bookings':
        return renderBookingsTab();
      case 'clients':
        return renderClientsTab();
      default:
        return renderOverviewTab();
    }
  };

  if (loading && !analytics) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Icon name="refresh" size={24} color="#8b45c7" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.value}
              style={[
                styles.periodButton,
                selectedPeriod === period.value && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.value)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.value && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                selectedTab === tab.id && styles.tabButtonActive,
              ]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Icon
                name={tab.icon}
                size={20}
                color={selectedTab === tab.id ? '#8b45c7' : '#666'}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  selectedTab === tab.id && styles.tabButtonTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  periodSelector: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  periodButtonActive: {
    backgroundColor: '#8b45c7',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  tabNavigation: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 15,
    borderRadius: 25,
    backgroundColor: '#f8f8f8',
  },
  tabButtonActive: {
    backgroundColor: '#f3e5f5',
  },
  tabButtonText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#8b45c7',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsTitle: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statsSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  serviceStats: {
    fontSize: 14,
    color: '#666',
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  chart: {
    borderRadius: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusCard: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8b45c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  clientInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  clientStats: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  clientPreference: {
    fontSize: 12,
    color: '#888',
  },
  clientRank: {
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8b45c7',
  },
});

export default ProviderAnalyticsScreen;
