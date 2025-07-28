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
import { BlurView } from 'expo-blur';
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
                      backgroundColor: height > 70 ? 'rgba(255, 255, 255, 0.9)' : height > 40 ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.5)'
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
            <View style={[
              styles.serviceRank,
              { backgroundColor: index === 0 ? 'rgba(255, 215, 0, 0.3)' : index === 1 ? 'rgba(192, 192, 192, 0.3)' : index === 2 ? 'rgba(205, 127, 50, 0.3)' : 'rgba(255, 255, 255, 0.2)' }
            ]}>
              <Text style={[
                styles.rankNumber,
                { color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'white' }
              ]}>{index + 1}</Text>
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.serviceName}</Text>
              <Text style={styles.serviceStats}>
                {service.bookingCount} bookings • {formatCurrency(service.averagePrice)} avg
              </Text>
            </View>
            <View style={styles.serviceRevenue}>
              <Text style={[styles.revenueAmount, { color: '#4ECDC4' }]}>{formatCurrency(service.totalRevenue)}</Text>
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
            <Text style={[styles.clientTypeNumber, { color: '#45B7D1' }]}>{clientData.newClients}</Text>
            <Text style={styles.clientTypeLabel}>New Clients</Text>
            <Text style={[styles.clientTypePercentage, { color: '#96CEB4' }]}>{newClientPercentage.toFixed(1)}%</Text>
          </View>
          <View style={styles.clientTypeCard}>
            <Text style={[styles.clientTypeNumber, { color: '#667eea' }]}>{clientData.returningClients}</Text>
            <Text style={styles.clientTypeLabel}>Returning</Text>
            <Text style={[styles.clientTypePercentage, { color: '#96CEB4' }]}>{returningClientPercentage.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Top Clients */}
        {clientData.topClients && clientData.topClients.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Top Clients</Text>
            {clientData.topClients.slice(0, 3).map((client, index) => (
              <View key={client.userId} style={styles.clientItem}>
                <View style={[
                  styles.clientAvatar,
                  { backgroundColor: index === 0 ? 'rgba(255, 215, 0, 0.2)' : index === 1 ? 'rgba(192, 192, 192, 0.2)' : 'rgba(205, 127, 50, 0.2)' }
                ]}>
                  <Text style={[
                    styles.clientInitials,
                    { color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }
                  ]}>
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
                  <Text style={[styles.spentAmount, { color: '#4ECDC4' }]}>{formatCurrency(client.totalSpent)}</Text>
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
          
          // Dynamic color based on popularity
          const getBarColor = (percentage: number) => {
            if (percentage > 80) return '#4ECDC4'; // Highest demand - Teal
            if (percentage > 60) return '#45B7D1'; // High demand - Blue  
            if (percentage > 40) return '#FFD93D'; // Medium demand - Yellow
            return '#96CEB4'; // Lower demand - Mint
          };

          return (
            <View key={slot.hour} style={styles.timeSlotItem}>
              <Text style={styles.timeSlotLabel}>{slot.timeSlot}</Text>
              <View style={styles.timeSlotBar}>
                <View 
                  style={[
                    styles.timeSlotFill, 
                    { 
                      width: `${percentage}%`,
                      backgroundColor: getBarColor(percentage)
                    }
                  ]} 
                />
              </View>
              <Text style={[
                styles.timeSlotCount,
                { color: getBarColor(percentage) }
              ]}>{slot.bookingCount}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading && !revenueData && !clientData) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={[styles.container, styles.centered]}>
        <BlurView intensity={20} style={styles.loadingCard}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </BlurView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Business Analytics</Text>
          <Text style={styles.headerSubtitle}>Track your performance</Text>
        </View>

        {/* Period Selector */}
        <BlurView intensity={80} style={styles.periodSelector}>
          <View style={styles.periodButtonContainer}>
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
        </BlurView>      {/* Revenue Overview */}
      {revenueData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Text style={[styles.overviewValue, { color: '#4ECDC4' }]}>{formatCurrency(revenueData.totalRevenue)}</Text>
              <Text style={styles.overviewLabel}>Total Revenue</Text>
              <Text style={[
                styles.overviewGrowth,
                { color: revenueData.growthPercentage >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {formatPercentage(revenueData.growthPercentage)}
              </Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={[styles.overviewValue, { color: '#45B7D1' }]}>{revenueData.totalBookings}</Text>
              <Text style={styles.overviewLabel}>Total Bookings</Text>
              <Text style={[styles.overviewExtra, { color: '#96CEB4' }]}>
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
    </LinearGradient>
  );
};const styles = StyleSheet.create({
  // Base Layout
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 100,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  
  // Header Section
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    letterSpacing: -0.2,
  },
  
  // Period Selector
  periodSelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  periodButtonContainer: {
    flexDirection: 'row',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  activePeriodButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: -0.2,
  },
  activePeriodButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  
  // Section Containers
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 24,
    marginVertical: 12,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginTop: 20,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  
  // Overview Cards
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  overviewValue: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.3,
  },
  overviewLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  overviewGrowth: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: -0.2,
  },
  overviewExtra: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    fontWeight: '500',
  },
  
  // Chart Styles
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 24,
    marginVertical: 12,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 20,
    letterSpacing: -0.2,
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
    borderRadius: 4,
    minHeight: 6,
  },
  chartLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    fontWeight: '500',
  },
  
  // Service Items
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  serviceRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  rankNumber: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.2,
  },
  serviceStats: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    fontWeight: '500',
  },
  serviceRevenue: {
    alignItems: 'flex-end',
  },
  revenueAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.2,
  },
  
  // Client Analytics
  clientDistribution: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  clientTypeCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  clientTypeNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.4,
  },
  clientTypeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  clientTypePercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginTop: 4,
    letterSpacing: -0.2,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  clientInitials: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.2,
  },
  clientStats: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    fontWeight: '500',
  },
  clientSpent: {
    alignItems: 'flex-end',
  },
  spentAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.2,
  },
  
  // Time Slot Analysis
  timeSlotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  timeSlotLabel: {
    width: 80,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  timeSlotBar: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    marginHorizontal: 12,
  },
  timeSlotFill: {
    height: '100%',
    borderRadius: 5,
  },
  timeSlotCount: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
    width: 30,
    textAlign: 'right',
    letterSpacing: -0.2,
  },
  
  // Empty States
  emptyChart: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 24,
    marginVertical: 12,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emptyChartText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  emptySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 24,
    marginVertical: 12,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emptySectionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

export default AnalyticsScreen;
