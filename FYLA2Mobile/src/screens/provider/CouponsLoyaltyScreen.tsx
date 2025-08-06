import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  Switch,
  ActivityIndicator,
  StatusBar,
  FlatList,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/colors';
import { demoCoupons, demoLoyaltyPrograms, demoAutoMessages } from '../../data/providerDemoData';
import ApiService from '../../services/api';
import { RootStackParamList } from '../../types';

const { width } = Dimensions.get('window');

type CouponsLoyaltyNavigationProp = StackNavigationProp<RootStackParamList>;

interface Coupon {
  id: string;
  title: string;
  description: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumAmount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  targetClientIds?: string[];
  serviceIds?: string[];
}

interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  pointsPerDollar: number;
  pointsForRedemption: number;
  rewardValue: number;
  rewardType: 'discount' | 'service' | 'product';
  isActive: boolean;
  totalMembers: number;
  totalPointsIssued: number;
}

interface AutoMessage {
  id: string;
  name: string;
  message: string;
  trigger: 'birthday' | 'anniversary' | 'reminder' | 'promotion';
  isActive: boolean;
  lastSent?: Date;
  sentCount: number;
}

const CouponsLoyaltyScreen: React.FC = () => {
  const navigation = useNavigation<CouponsLoyaltyNavigationProp>();
  
  const [activeTab, setActiveTab] = useState<'coupons' | 'loyalty' | 'messages'>('coupons');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  
  // Loyalty state
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyProgram[]>([]);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [editingLoyalty, setEditingLoyalty] = useState<LoyaltyProgram | null>(null);
  
  // Auto messages state
  const [autoMessages, setAutoMessages] = useState<AutoMessage[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<AutoMessage | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load mock data - in real app, this would be API calls
      setCoupons([
        {
          id: '1',
          title: 'New Client Special',
          description: '20% off first service for new clients',
          code: 'WELCOME20',
          discountType: 'percentage',
          discountValue: 20,
          minimumAmount: 50,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          usageLimit: 100,
          usedCount: 15,
          isActive: true,
        },
        {
          id: '2',
          title: 'Holiday Promotion',
          description: '$25 off any service over $100',
          code: 'HOLIDAY25',
          discountType: 'fixed',
          discountValue: 25,
          minimumAmount: 100,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          usageLimit: 50,
          usedCount: 8,
          isActive: true,
        },
      ]);

      setLoyaltyPrograms([
        {
          id: '1',
          name: 'Beauty Points',
          description: 'Earn points with every dollar spent',
          pointsPerDollar: 1,
          pointsForRedemption: 100,
          rewardValue: 10,
          rewardType: 'discount',
          isActive: true,
          totalMembers: 127,
          totalPointsIssued: 12500,
        },
      ]);

      setAutoMessages([
        {
          id: '1',
          name: 'Birthday Wishes',
          message: 'Happy Birthday! 🎉 Enjoy 25% off your next service with code BIRTHDAY25',
          trigger: 'birthday',
          isActive: true,
          sentCount: 23,
        },
        {
          id: '2',
          name: 'Appointment Reminder',
          message: 'Don\'t forget your appointment tomorrow at {time}. Looking forward to seeing you!',
          trigger: 'reminder',
          isActive: true,
          sentCount: 156,
        },
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Coupon functions
  const handleCreateCoupon = () => {
    setEditingCoupon(null);
    setShowCouponModal(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setShowCouponModal(true);
  };

  const handleToggleCoupon = async (couponId: string, isActive: boolean) => {
    try {
      // Toggle coupon status via API
      setCoupons(prev => prev.map(c => 
        c.id === couponId ? { ...c, isActive } : c
      ));
    } catch (error) {
      Alert.alert('Error', 'Failed to update coupon status');
    }
  };

  // Loyalty functions
  const handleCreateLoyalty = () => {
    setEditingLoyalty(null);
    setShowLoyaltyModal(true);
  };

  const handleEditLoyalty = (program: LoyaltyProgram) => {
    setEditingLoyalty(program);
    setShowLoyaltyModal(true);
  };

  // Message functions
  const handleCreateMessage = () => {
    setEditingMessage(null);
    setShowMessageModal(true);
  };

  const handleEditMessage = (message: AutoMessage) => {
    setEditingMessage(message);
    setShowMessageModal(true);
  };

  const renderCouponCard = ({ item: coupon }: { item: Coupon }) => (
    <View style={[styles.couponCard, { backgroundColor: coupon.isActive ? COLORS.primary : COLORS.textSecondary }]}>
      <View style={styles.couponGradient}>
        <View style={styles.couponHeader}>
          <Text style={styles.couponTitle}>{coupon.title}</Text>
          <Switch
            value={coupon.isActive}
            onValueChange={(value) => handleToggleCoupon(coupon.id, value)}
            trackColor={{ false: COLORS.borderLight, true: 'rgba(255,255,255,0.3)' }}
            thumbColor="white"
          />
        </View>
        
        <Text style={styles.couponDescription}>{coupon.description}</Text>
        
        <View style={styles.couponDetails}>
          <View style={styles.couponCode}>
            <Text style={styles.couponCodeText}>{coupon.code}</Text>
          </View>
          <Text style={styles.couponDiscount}>
            {coupon.discountType === 'percentage' 
              ? `${coupon.discountValue}% OFF`
              : `${formatCurrency(coupon.discountValue)} OFF`
            }
          </Text>
        </View>
        
        <View style={styles.couponStats}>
          <Text style={styles.couponStat}>
            Used: {coupon.usedCount}/{coupon.usageLimit}
          </Text>
          <Text style={styles.couponStat}>
            Expires: {formatDate(coupon.validUntil)}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditCoupon(coupon)}
        >
          <Ionicons name="create-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoyaltyCard = ({ item: program }: { item: LoyaltyProgram }) => (
    <View style={[styles.loyaltyCard, { backgroundColor: COLORS.accent }]}>
      <View style={styles.loyaltyGradient}>
        <View style={styles.loyaltyHeader}>
          <Text style={styles.loyaltyTitle}>{program.name}</Text>
          <TouchableOpacity onPress={() => handleEditLoyalty(program)}>
            <Ionicons name="create-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.loyaltyDescription}>{program.description}</Text>
        
        <View style={styles.loyaltyDetails}>
          <View style={styles.loyaltyDetailItem}>
            <Text style={styles.loyaltyDetailLabel}>Points per $1</Text>
            <Text style={styles.loyaltyDetailValue}>{program.pointsPerDollar}</Text>
          </View>
          <View style={styles.loyaltyDetailItem}>
            <Text style={styles.loyaltyDetailLabel}>Redemption</Text>
            <Text style={styles.loyaltyDetailValue}>
              {program.pointsForRedemption} pts = {formatCurrency(program.rewardValue)}
            </Text>
          </View>
        </View>
        
        <View style={styles.loyaltyStats}>
          <View style={styles.loyaltyStatItem}>
            <Text style={styles.loyaltyStatValue}>{program.totalMembers}</Text>
            <Text style={styles.loyaltyStatLabel}>Members</Text>
          </View>
          <View style={styles.loyaltyStatItem}>
            <Text style={styles.loyaltyStatValue}>{program.totalPointsIssued.toLocaleString()}</Text>
            <Text style={styles.loyaltyStatLabel}>Points Issued</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderMessageCard = ({ item: message }: { item: AutoMessage }) => (
    <View style={styles.messageCard}>
      <View style={styles.messageHeader}>
        <View style={styles.messageInfo}>
          <Text style={styles.messageName}>{message.name}</Text>
          <Text style={styles.messageTrigger}>{message.trigger.toUpperCase()}</Text>
        </View>
        <View style={styles.messageActions}>
          <Switch
            value={message.isActive}
            onValueChange={(value) => {
              setAutoMessages(prev => prev.map(m => 
                m.id === message.id ? { ...m, isActive: value } : m
              ));
            }}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor="white"
          />
          <TouchableOpacity 
            style={styles.messageEditButton}
            onPress={() => handleEditMessage(message)}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.messageText}>{message.message}</Text>
      
      <View style={styles.messageStats}>
        <Text style={styles.messageStat}>Sent: {message.sentCount} times</Text>
        {message.lastSent && (
          <Text style={styles.messageStat}>Last: {formatDate(message.lastSent)}</Text>
        )}
      </View>
    </View>
  );

  const TabButton = ({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingGradient}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.container}>
        {/* Clean Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Marketing Hub</Text>
            <View style={styles.headerRight} />
          </View>
        </View>

        {/* Modern Tab Bar */}
        <View style={styles.tabsContainer}>
          <TabButton 
            title="Coupons" 
            isActive={activeTab === 'coupons'} 
            onPress={() => setActiveTab('coupons')} 
          />
          <TabButton 
            title="Loyalty" 
            isActive={activeTab === 'loyalty'} 
            onPress={() => setActiveTab('loyalty')} 
          />
          <TabButton 
            title="Auto Messages" 
            isActive={activeTab === 'messages'} 
            onPress={() => setActiveTab('messages')} 
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'coupons' && (
            <FlatList
              data={coupons}
              renderItem={renderCouponCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListHeaderComponent={
                <TouchableOpacity style={styles.createButton} onPress={handleCreateCoupon}>
                  <View style={styles.createButtonGradient}>
                    <Ionicons name="add" size={24} color="white" />
                    <Text style={styles.createButtonText}>Create New Coupon</Text>
                  </View>
                </TouchableOpacity>
              }
              showsVerticalScrollIndicator={false}
            />
          )}

          {activeTab === 'loyalty' && (
            <FlatList
              data={loyaltyPrograms}
              renderItem={renderLoyaltyCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListHeaderComponent={
                <TouchableOpacity style={styles.createButton} onPress={handleCreateLoyalty}>
                  <View style={styles.createButtonGradient}>
                    <Ionicons name="add" size={24} color="white" />
                    <Text style={styles.createButtonText}>Create Loyalty Program</Text>
                  </View>
                </TouchableOpacity>
              }
              showsVerticalScrollIndicator={false}
            />
          )}

          {activeTab === 'messages' && (
            <FlatList
              data={autoMessages}
              renderItem={renderMessageCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListHeaderComponent={
                <TouchableOpacity style={styles.createButton} onPress={handleCreateMessage}>
                  <View style={styles.createButtonGradient}>
                    <Ionicons name="add" size={24} color="white" />
                    <Text style={styles.createButtonText}>Create Auto Message</Text>
                  </View>
                </TouchableOpacity>
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 25,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabButtonText: {
    color: 'white',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  createButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  couponCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: COLORS.surface,
  },
  couponGradient: {
    padding: 24,
    position: 'relative',
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  couponTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    marginRight: 12,
  },
  couponDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 18,
    lineHeight: 20,
  },
  couponDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  couponCode: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  couponCodeText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  couponDiscount: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  couponStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  couponStat: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  loyaltyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  loyaltyGradient: {
    padding: 24,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loyaltyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    marginRight: 12,
  },
  loyaltyDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 18,
    lineHeight: 20,
  },
  loyaltyDetails: {
    marginBottom: 16,
  },
  loyaltyDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 2,
  },
  loyaltyDetailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  loyaltyDetailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  loyaltyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  loyaltyStatItem: {
    alignItems: 'center',
  },
  loyaltyStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  loyaltyStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  messageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  messageInfo: {
    flex: 1,
    marginRight: 12,
  },
  messageName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  messageTrigger: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageEditButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  messageStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  messageStat: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

export default CouponsLoyaltyScreen;
