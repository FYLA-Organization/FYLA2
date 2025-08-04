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
import { LinearGradient } from 'expo-linear-gradient';
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
    <View style={styles.couponCard}>
      <LinearGradient 
        colors={coupon.isActive ? COLORS.gradientSuccess : ['#ccc', '#999']} 
        style={styles.couponGradient}
      >
        <View style={styles.couponHeader}>
          <Text style={styles.couponTitle}>{coupon.title}</Text>
          <Switch
            value={coupon.isActive}
            onValueChange={(value) => handleToggleCoupon(coupon.id, value)}
            trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.5)' }}
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
      </LinearGradient>
    </View>
  );

  const renderLoyaltyCard = ({ item: program }: { item: LoyaltyProgram }) => (
    <View style={styles.loyaltyCard}>
      <LinearGradient colors={COLORS.gradient} style={styles.loyaltyGradient}>
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
      </LinearGradient>
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
        <LinearGradient colors={COLORS.gradient} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.container}>
        <LinearGradient colors={COLORS.gradient} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Marketing Hub</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>

        {/* Tabs */}
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
                  <LinearGradient colors={COLORS.gradientSecondary} style={styles.createButtonGradient}>
                    <Ionicons name="add" size={24} color="white" />
                    <Text style={styles.createButtonText}>Create New Coupon</Text>
                  </LinearGradient>
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
                  <LinearGradient colors={COLORS.gradientSecondary} style={styles.createButtonGradient}>
                    <Ionicons name="add" size={24} color="white" />
                    <Text style={styles.createButtonText}>Create Loyalty Program</Text>
                  </LinearGradient>
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
                  <LinearGradient colors={COLORS.gradientSecondary} style={styles.createButtonGradient}>
                    <Ionicons name="add" size={24} color="white" />
                    <Text style={styles.createButtonText}>Create Auto Message</Text>
                  </LinearGradient>
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
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
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
  },
  listContainer: {
    padding: 20,
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  couponCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  couponGradient: {
    padding: 20,
    position: 'relative',
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  couponTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    flex: 1,
  },
  couponDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  couponDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  couponCode: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  couponCodeText: {
    color: 'white',
    fontWeight: '700',
    letterSpacing: 1,
  },
  couponDiscount: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  couponStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  couponStat: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  editButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loyaltyCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loyaltyGradient: {
    padding: 20,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  loyaltyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  loyaltyDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  loyaltyDetails: {
    marginBottom: 16,
  },
  loyaltyDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  loyaltyDetailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loyaltyDetailValue: {
    fontSize: 14,
    fontWeight: '600',
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageInfo: {
    flex: 1,
  },
  messageName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  messageTrigger: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messageEditButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  messageStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  messageStat: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default CouponsLoyaltyScreen;
