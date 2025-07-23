import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { RevenueAnalytics, ClientAnalytics } from '../../types';

const { width } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
  const [clientData, setClientData] = useState<ClientAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const periods = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ];

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [revenue, clients] = await Promise.all([
        api.getRevenueAnalytics(selectedPeriod),
        api.getClientAnalytics(selectedPeriod)
      ]);
      setRevenueData(revenue);
      setClientData(clients);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const renderRevenuChart = () => {
    if (!revenueData?.dailyRevenue || revenueData.dailyRevenue.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>No revenue data available</Text>
        </View>
      );
    }

    const maxRevenue = Math.max(...revenueData.dailyRevenue.map(d => d.revenue));
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Daily Revenue Trend</Text>
        <View style={styles.chart}>
          {revenueData.dailyRevenue.map((item, index) => {
            const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
            return (
              <View key={index} style={styles.chartBarContainer}>
                <View 
                  style={[
                    styles.chartBar, 
                    { 
                      height: `${height}%`,
                      backgroundColor: height > 70 ? '#4ECDC4' : height > 40 ? '#45B7D1' : '#96CEB4'
                    }
                  ]} 
                />
                <Text style={styles.chartLabel}>
                  {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric' })}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTopServices = () => {
    if (!revenueData?.topServices || revenueData.topServices.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>No service data available</Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Performing Services</Text>
        {revenueData.topServices.slice(0, 5).map((service, index) => (
          <View key={service.serviceId} style={styles.serviceItem}>
            <View style={styles.serviceRank}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.serviceName}</Text>
              <Text style={styles.serviceStats}>
                {service.bookingCount} bookings • {formatCurrency(service.averagePrice)} avg
              </Text>
            </View>
            <View style={styles.serviceRevenue}>
              <Text style={styles.revenueAmount}>{formatCurrency(service.totalRevenue)}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderClientMetrics = () => {
    if (!clientData) {
      return (
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>No client data available</Text>
        </View>
      );
    }

    const newClientPercentage = clientData.newClientPercentage;
    const returningClientPercentage = 100 - newClientPercentage;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client Analytics</Text>
        
        {/* Client Distribution */}
        <View style={styles.clientDistribution}>
          <View style={styles.clientTypeCard}>
            <Text style={styles.clientTypeNumber}>{clientData.newClients}</Text>
            <Text style={styles.clientTypeLabel}>New Clients</Text>
            <Text style={styles.clientTypePercentage}>{newClientPercentage.toFixed(1)}%</Text>
          </View>
          <View style={styles.clientTypeCard}>
            <Text style={styles.clientTypeNumber}>{clientData.returningClients}</Text>
            <Text style={styles.clientTypeLabel}>Returning</Text>
            <Text style={styles.clientTypePercentage}>{returningClientPercentage.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Top Clients */}
        {clientData.topClients && clientData.topClients.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Top Clients</Text>
            {clientData.topClients.slice(0, 3).map((client, index) => (
              <View key={client.userId} style={styles.clientItem}>
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientInitials}>
                    {client.clientName.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{client.clientName}</Text>
                  <Text style={styles.clientStats}>
                    {client.bookingCount} bookings • Last: {new Date(client.lastBooking).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.clientSpent}>
                  <Text style={styles.spentAmount}>{formatCurrency(client.totalSpent)}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </View>
    );
  };

  const renderTimeSlotAnalysis = () => {
    if (!clientData?.popularTimeSlots || clientData.popularTimeSlots.length === 0) {
      return null;
    }

    const maxBookings = Math.max(...clientData.popularTimeSlots.map(slot => slot.bookingCount));

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Time Slots</Text>
        {clientData.popularTimeSlots.map((slot) => {
          const percentage = maxBookings > 0 ? (slot.bookingCount / maxBookings) * 100 : 0;
          return (
            <View key={slot.hour} style={styles.timeSlotItem}>
              <Text style={styles.timeSlotLabel}>{slot.timeSlot}</Text>
              <View style={styles.timeSlotBar}>
                <View 
                  style={[
                    styles.timeSlotFill, 
                    { 
                      width: `${percentage}%`,
                      backgroundColor: percentage > 80 ? '#FF6B6B' : percentage > 60 ? '#4ECDC4' : '#96CEB4'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.timeSlotCount}>{slot.bookingCount}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading && !revenueData && !clientData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Business Analytics</Text>
        <Text style={styles.headerSubtitle}>Track your performance</Text>
      </LinearGradient>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.activePeriodButton,
            ]}
            onPress={() => setSelectedPeriod(period.key as any)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.activePeriodButtonText,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Revenue Overview */}
      {revenueData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{formatCurrency(revenueData.totalRevenue)}</Text>
              <Text style={styles.overviewLabel}>Total Revenue</Text>
              <Text style={[
                styles.overviewGrowth,
                { color: revenueData.growthPercentage >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {formatPercentage(revenueData.growthPercentage)}
              </Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{revenueData.totalBookings}</Text>
              <Text style={styles.overviewLabel}>Total Bookings</Text>
              <Text style={styles.overviewExtra}>
                {formatCurrency(revenueData.averageBookingValue)} avg
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Revenue Chart */}
      {renderRevenuChart()}

      {/* Top Services */}
      {renderTopServices()}

      {/* Client Analytics */}
      {renderClientMetrics()}

      {/* Time Slot Analysis */}
      {renderTimeSlotAnalysis()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    marginTop: 5,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -15,
    borderRadius: 25,
    padding: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  activePeriodButton: {
    backgroundColor: '#667eea',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activePeriodButtonText: {
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  overviewGrowth: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  overviewExtra: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    justifyContent: 'space-between',
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  chartBar: {
    width: '80%',
    backgroundColor: '#4ECDC4',
    borderRadius: 2,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  serviceStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  serviceRevenue: {
    alignItems: 'flex-end',
  },
  revenueAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  clientDistribution: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  clientTypeCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  clientTypeNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  clientTypeLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  clientTypePercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
    marginTop: 2,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientInitials: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  clientStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  clientSpent: {
    alignItems: 'flex-end',
  },
  spentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  timeSlotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  timeSlotLabel: {
    width: 80,
    fontSize: 12,
    color: '#666',
  },
  timeSlotBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  timeSlotFill: {
    height: '100%',
    borderRadius: 4,
  },
  timeSlotCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    width: 30,
    textAlign: 'right',
  },
  emptyChart: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    color: '#666',
  },
  emptySection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptySectionText: {
    fontSize: 14,
    color: '#666',
  },
});

export default AnalyticsScreen;
