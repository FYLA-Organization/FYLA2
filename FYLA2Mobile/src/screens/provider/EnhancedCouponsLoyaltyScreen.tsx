import React, { useState, useEffect, useCallback } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/colors';
import ApiService from '../../services/api';
import FeatureGatingService, { SubscriptionTier } from '../../services/featureGatingService';
import { RootStackParamList } from '../../types';

const { width } = Dimensions.get('window');

type CouponsLoyaltyNavigationProp = StackNavigationProp<RootStackParamList>;

interface Promotion {
  id: number;
  name: string;
  title?: string;
  description: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount' | 'fixed';
  discountValue: number;
  value?: number;
  startDate: string;
  endDate: string;
  maxUses: number;
  currentUses: number;
  minimumSpend: number;
  isActive: boolean;
  isPublic: boolean;
  applicableServiceIds: number[];
}

interface LoyaltyProgram {
  id: number;
  name: string;
  type: string;
  description: string;
  pointsPerDollar: number;
  earnRate: number;
  welcomeBonus: number;
  minimumEarn: number;
  minimumRedeem: number;
  rewardType: string;
  isActive: boolean;
  activeMembers: number;
  memberCount: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  createdAt: string;
}

interface LoyaltyTier {
  name: string;
  minPoints: number;
  maxPoints: number;
  pointsMultiplier: number;
  benefits: string[];
}

interface LoyaltyReward {
  name: string;
  description: string;
  pointsCost: number;
  rewardType: string;
  value: number;
}

const EnhancedCouponsLoyaltyScreen: React.FC = () => {
  const navigation = useNavigation<CouponsLoyaltyNavigationProp>();
  
  const [activeTab, setActiveTab] = useState<'promotions' | 'loyalty' | 'analytics'>('promotions');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Promotions state
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  
  // Loyalty state
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyProgram[]>([]);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [editingLoyalty, setEditingLoyalty] = useState<LoyaltyProgram | null>(null);
  
  // Services state for targeting specific services
  const [userServices, setUserServices] = useState<any[]>([]);
  
  // Form states for promotion
  const [promotionForm, setPromotionForm] = useState({
    name: '',
    description: '',
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed_amount',
    discountValue: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxUses: 100,
    minimumSpend: 0,
    isPublic: true,
    applicableServiceIds: [] as number[],
  });

  // Form states for loyalty program
  const [loyaltyForm, setLoyaltyForm] = useState({
    name: '',
    type: 'points',
    description: '',
    pointsPerDollar: 1,
    earnRate: 1,
    welcomeBonus: 50,
    minimumEarn: 0,
    minimumRedeem: 100,
    rewardType: 'discount',
    tiers: [] as LoyaltyTier[],
    rewards: [] as LoyaltyReward[],
  });

  // Subscription access state
  const [canUsePromotions, setCanUsePromotions] = useState(false);
  const [canUseLoyalty, setCanUseLoyalty] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState('Free');

  useEffect(() => {
    loadData();
    checkSubscriptionAccess();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [promotionsData, loyaltyData, servicesData] = await Promise.all([
        ApiService.getPromotions(),
        ApiService.getLoyaltyPrograms(),
        ApiService.getServices(), // Load user's services for targeting
      ]);
      
      setPromotions(promotionsData);
      setLoyaltyPrograms(loyaltyData);
      setUserServices(servicesData?.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load promotions and loyalty data');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSubscriptionAccess = useCallback(async () => {
    try {
      const [promotionsAccess, loyaltyAccess, subscriptionInfo] = await Promise.all([
        FeatureGatingService.canUsePromotions(),
        FeatureGatingService.canUseLoyaltyPrograms(),
        FeatureGatingService.getSubscriptionInfo()
      ]);
      
      setCanUsePromotions(promotionsAccess);
      setCanUseLoyalty(loyaltyAccess);
      setSubscriptionTier(FeatureGatingService.getTierDisplayName(subscriptionInfo.tier));
    } catch (error) {
      console.error('Error checking subscription access:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    await checkSubscriptionAccess();
    setRefreshing(false);
  }, [loadData]);

  const handleCreatePromotion = async () => {
    try {
      const promotionData = {
        ...promotionForm,
        startDate: new Date(promotionForm.startDate).toISOString(),
        endDate: new Date(promotionForm.endDate).toISOString(),
      };

      if (editingPromotion) {
        await ApiService.updatePromotion(editingPromotion.id.toString(), promotionData);
      } else {
        await ApiService.createPromotion(promotionData);
      }
      
      setShowPromotionModal(false);
      resetPromotionForm();
      await loadData();
      
      Alert.alert('Success', `Promotion ${editingPromotion ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving promotion:', error);
      Alert.alert('Error', 'Failed to save promotion');
    }
  };

  const handleCreateLoyaltyProgram = async () => {
    try {
      if (editingLoyalty) {
        await ApiService.updateLoyaltyProgram(editingLoyalty.id.toString(), loyaltyForm);
      } else {
        await ApiService.createLoyaltyProgram(loyaltyForm);
      }
      
      setShowLoyaltyModal(false);
      resetLoyaltyForm();
      await loadData();
      
      Alert.alert('Success', `Loyalty program ${editingLoyalty ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving loyalty program:', error);
      Alert.alert('Error', 'Failed to save loyalty program');
    }
  };

  const togglePromotion = async (promotion: Promotion) => {
    try {
      await ApiService.togglePromotion(promotion.id.toString(), !promotion.isActive);
      await loadData();
    } catch (error) {
      console.error('Error toggling promotion:', error);
      Alert.alert('Error', 'Failed to toggle promotion');
    }
  };

  const toggleLoyaltyProgram = async (program: LoyaltyProgram) => {
    try {
      await ApiService.toggleLoyaltyProgram(program.id.toString(), !program.isActive);
      await loadData();
    } catch (error) {
      console.error('Error toggling loyalty program:', error);
      Alert.alert('Error', 'Failed to toggle loyalty program');
    }
  };

  const resetPromotionForm = () => {
    setPromotionForm({
      name: '',
      description: '',
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maxUses: 100,
      minimumSpend: 0,
      isPublic: true,
      applicableServiceIds: [],
    });
    setEditingPromotion(null);
  };

  const resetLoyaltyForm = () => {
    setLoyaltyForm({
      name: '',
      type: 'points',
      description: '',
      pointsPerDollar: 1,
      earnRate: 1,
      welcomeBonus: 50,
      minimumEarn: 0,
      minimumRedeem: 100,
      rewardType: 'discount',
      tiers: [],
      rewards: [],
    });
    setEditingLoyalty(null);
  };

  const editPromotion = (promotion: Promotion) => {
    setPromotionForm({
      name: promotion.name,
      description: promotion.description,
      code: promotion.code,
      discountType: promotion.discountType as 'percentage' | 'fixed_amount',
      discountValue: promotion.discountValue,
      startDate: new Date(promotion.startDate).toISOString().split('T')[0],
      endDate: new Date(promotion.endDate).toISOString().split('T')[0],
      maxUses: promotion.maxUses,
      minimumSpend: promotion.minimumSpend,
      isPublic: promotion.isPublic,
      applicableServiceIds: promotion.applicableServiceIds,
    });
    setEditingPromotion(promotion);
    setShowPromotionModal(true);
  };

  const editLoyaltyProgram = (program: LoyaltyProgram) => {
    setLoyaltyForm({
      name: program.name,
      type: program.type,
      description: program.description,
      pointsPerDollar: program.pointsPerDollar,
      earnRate: program.earnRate,
      welcomeBonus: program.welcomeBonus,
      minimumEarn: program.minimumEarn,
      minimumRedeem: program.minimumRedeem,
      rewardType: program.rewardType,
      tiers: [],
      rewards: [],
    });
    setEditingLoyalty(program);
    setShowLoyaltyModal(true);
  };

  const renderPromotionCard = ({ item: promotion }: { item: Promotion }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{promotion.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: promotion.isActive ? COLORS.success : COLORS.textSecondary }]}>
            <Text style={styles.statusText}>{promotion.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
        <Text style={styles.cardCode}>Code: {promotion.code}</Text>
      </View>
      
      <Text style={styles.cardDescription}>{promotion.description}</Text>
      
      {/* Show applicable services */}
      <View style={styles.applicableServicesSection}>
        <Text style={styles.applicableServicesLabel}>
          {promotion.applicableServiceIds.length === 0 
            ? 'Applies to: All Services' 
            : `Applies to: ${promotion.applicableServiceIds.length} service${promotion.applicableServiceIds.length > 1 ? 's' : ''}`
          }
        </Text>
        {promotion.applicableServiceIds.length > 0 && (
          <View style={styles.serviceTagsContainer}>
            {promotion.applicableServiceIds.map(serviceId => {
              const service = userServices.find(s => parseInt(s.id) === serviceId);
              return service ? (
                <View key={serviceId} style={styles.serviceTag}>
                  <Text style={styles.serviceTagText}>{service.name}</Text>
                </View>
              ) : null;
            })}
          </View>
        )}
      </View>
      
      <View style={styles.cardStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Discount</Text>
          <Text style={styles.statValue}>
            {promotion.discountType === 'percentage' ? `${promotion.discountValue}%` : `$${promotion.discountValue}`}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Used</Text>
          <Text style={styles.statValue}>{promotion.currentUses}/{promotion.maxUses}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Min Spend</Text>
          <Text style={styles.statValue}>${promotion.minimumSpend}</Text>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => editPromotion(promotion)}
        >
          <Ionicons name="pencil" size={16} color={COLORS.primary} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.toggleButton} 
          onPress={() => togglePromotion(promotion)}
        >
          <Ionicons 
            name={promotion.isActive ? 'pause' : 'play'} 
            size={16} 
            color={promotion.isActive ? COLORS.warning : COLORS.success} 
          />
          <Text style={styles.toggleButtonText}>
            {promotion.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoyaltyCard = ({ item: program }: { item: LoyaltyProgram }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{program.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: program.isActive ? COLORS.success : COLORS.textSecondary }]}>
            <Text style={styles.statusText}>{program.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
        <Text style={styles.cardType}>{program.type.toUpperCase()} PROGRAM</Text>
      </View>
      
      <Text style={styles.cardDescription}>{program.description}</Text>
      
      <View style={styles.cardStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Earn Rate</Text>
          <Text style={styles.statValue}>{program.pointsPerDollar} pts/$</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Members</Text>
          <Text style={styles.statValue}>{program.activeMembers || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Welcome Bonus</Text>
          <Text style={styles.statValue}>{program.welcomeBonus} pts</Text>
        </View>
      </View>
      
      <View style={styles.loyaltyDetails}>
        <Text style={styles.loyaltyDetailText}>
          Points Issued: {Math.round(program.totalPointsIssued || 0).toLocaleString()}
        </Text>
        <Text style={styles.loyaltyDetailText}>
          Points Redeemed: {Math.round(program.totalPointsRedeemed || 0).toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => editLoyaltyProgram(program)}
        >
          <Ionicons name="pencil" size={16} color={COLORS.primary} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.toggleButton} 
          onPress={() => toggleLoyaltyProgram(program)}
        >
          <Ionicons 
            name={program.isActive ? 'pause' : 'play'} 
            size={16} 
            color={program.isActive ? COLORS.warning : COLORS.success} 
          />
          <Text style={styles.toggleButtonText}>
            {program.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPromotionModal = () => (
    <Modal
      visible={showPromotionModal}
      animationType="slide"
      presentationStyle="formSheet"
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                setShowPromotionModal(false);
                resetPromotionForm();
              }}
            >
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingPromotion ? 'Edit Promotion' : 'Create Promotion'}
            </Text>
            <TouchableOpacity onPress={handleCreatePromotion}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Promotion Name</Text>
              <TextInput
                style={styles.formInput}
                value={promotionForm.name}
                onChangeText={(text) => setPromotionForm({ ...promotionForm, name: text })}
                placeholder="Enter promotion name"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, { height: 80 }]}
                value={promotionForm.description}
                onChangeText={(text) => setPromotionForm({ ...promotionForm, description: text })}
                placeholder="Describe your promotion"
                placeholderTextColor={COLORS.textSecondary}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Promotion Code</Text>
              <TextInput
                style={styles.formInput}
                value={promotionForm.code}
                onChangeText={(text) => setPromotionForm({ ...promotionForm, code: text.toUpperCase() })}
                placeholder="Enter promo code"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: SPACING.sm }]}>
                <Text style={styles.formLabel}>Discount Type</Text>
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[
                      styles.segmentedButton,
                      promotionForm.discountType === 'percentage' && styles.segmentedButtonActive
                    ]}
                    onPress={() => setPromotionForm({ ...promotionForm, discountType: 'percentage' })}
                  >
                    <Text style={[
                      styles.segmentedButtonText,
                      promotionForm.discountType === 'percentage' && styles.segmentedButtonTextActive
                    ]}>
                      %
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.segmentedButton,
                      promotionForm.discountType === 'fixed_amount' && styles.segmentedButtonActive
                    ]}
                    onPress={() => setPromotionForm({ ...promotionForm, discountType: 'fixed_amount' })}
                  >
                    <Text style={[
                      styles.segmentedButtonText,
                      promotionForm.discountType === 'fixed_amount' && styles.segmentedButtonTextActive
                    ]}>
                      $
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Discount Value</Text>
                <TextInput
                  style={styles.formInput}
                  value={promotionForm.discountValue.toString()}
                  onChangeText={(text) => setPromotionForm({ ...promotionForm, discountValue: parseFloat(text) || 0 })}
                  placeholder="0"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: SPACING.sm }]}>
                <Text style={styles.formLabel}>Max Uses</Text>
                <TextInput
                  style={styles.formInput}
                  value={promotionForm.maxUses.toString()}
                  onChangeText={(text) => setPromotionForm({ ...promotionForm, maxUses: parseInt(text) || 0 })}
                  placeholder="100"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Minimum Spend ($)</Text>
                <TextInput
                  style={styles.formInput}
                  value={promotionForm.minimumSpend.toString()}
                  onChangeText={(text) => setPromotionForm({ ...promotionForm, minimumSpend: parseFloat(text) || 0 })}
                  placeholder="0"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: SPACING.sm }]}>
                <Text style={styles.formLabel}>Start Date</Text>
                <TextInput
                  style={styles.formInput}
                  value={promotionForm.startDate}
                  onChangeText={(text) => setPromotionForm({ ...promotionForm, startDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>End Date</Text>
                <TextInput
                  style={styles.formInput}
                  value={promotionForm.endDate}
                  onChangeText={(text) => setPromotionForm({ ...promotionForm, endDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Target Services</Text>
              <Text style={styles.formHelper}>
                Select specific services for this promotion or leave empty to apply to all services
              </Text>
              <View style={styles.serviceSelectionContainer}>
                {userServices.map((service) => {
                  const isSelected = promotionForm.applicableServiceIds.includes(parseInt(service.id));
                  return (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.serviceChip,
                        isSelected && styles.serviceChipSelected
                      ]}
                      onPress={() => {
                        const serviceId = parseInt(service.id);
                        const currentIds = promotionForm.applicableServiceIds;
                        const newIds = isSelected
                          ? currentIds.filter(id => id !== serviceId)
                          : [...currentIds, serviceId];
                        setPromotionForm({ ...promotionForm, applicableServiceIds: newIds });
                      }}
                    >
                      <Text style={[
                        styles.serviceChipText,
                        isSelected && styles.serviceChipTextSelected
                      ]}>
                        {service.name} - ${service.price}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.surface} />
                      )}
                    </TouchableOpacity>
                  );
                })}
                {userServices.length === 0 && (
                  <Text style={styles.noServicesText}>
                    No services found. Add services first to target specific services.
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.formLabel}>Public Promotion</Text>
                <Switch
                  value={promotionForm.isPublic}
                  onValueChange={(value) => setPromotionForm({ ...promotionForm, isPublic: value })}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.surface}
                />
              </View>
              <Text style={styles.formHelper}>
                Public promotions are visible to all clients in search results
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderLoyaltyModal = () => (
    <Modal
      visible={showLoyaltyModal}
      animationType="slide"
      presentationStyle="formSheet"
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                setShowLoyaltyModal(false);
                resetLoyaltyForm();
              }}
            >
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingLoyalty ? 'Edit Loyalty Program' : 'Create Loyalty Program'}
            </Text>
            <TouchableOpacity onPress={handleCreateLoyaltyProgram}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Program Name</Text>
              <TextInput
                style={styles.formInput}
                value={loyaltyForm.name}
                onChangeText={(text) => setLoyaltyForm({ ...loyaltyForm, name: text })}
                placeholder="Enter program name"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, { height: 80 }]}
                value={loyaltyForm.description}
                onChangeText={(text) => setLoyaltyForm({ ...loyaltyForm, description: text })}
                placeholder="Describe your loyalty program"
                placeholderTextColor={COLORS.textSecondary}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: SPACING.sm }]}>
                <Text style={styles.formLabel}>Points per Dollar</Text>
                <TextInput
                  style={styles.formInput}
                  value={loyaltyForm.pointsPerDollar.toString()}
                  onChangeText={(text) => setLoyaltyForm({ ...loyaltyForm, pointsPerDollar: parseInt(text) || 1 })}
                  placeholder="1"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Welcome Bonus</Text>
                <TextInput
                  style={styles.formInput}
                  value={loyaltyForm.welcomeBonus.toString()}
                  onChangeText={(text) => setLoyaltyForm({ ...loyaltyForm, welcomeBonus: parseInt(text) || 0 })}
                  placeholder="50"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: SPACING.sm }]}>
                <Text style={styles.formLabel}>Min. Earn ($)</Text>
                <TextInput
                  style={styles.formInput}
                  value={loyaltyForm.minimumEarn.toString()}
                  onChangeText={(text) => setLoyaltyForm({ ...loyaltyForm, minimumEarn: parseFloat(text) || 0 })}
                  placeholder="0"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Min. Redeem (pts)</Text>
                <TextInput
                  style={styles.formInput}
                  value={loyaltyForm.minimumRedeem.toString()}
                  onChangeText={(text) => setLoyaltyForm({ ...loyaltyForm, minimumRedeem: parseFloat(text) || 0 })}
                  placeholder="100"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Reward Type</Text>
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentedButton,
                    loyaltyForm.rewardType === 'discount' && styles.segmentedButtonActive
                  ]}
                  onPress={() => setLoyaltyForm({ ...loyaltyForm, rewardType: 'discount' })}
                >
                  <Text style={[
                    styles.segmentedButtonText,
                    loyaltyForm.rewardType === 'discount' && styles.segmentedButtonTextActive
                  ]}>
                    Discount
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentedButton,
                    loyaltyForm.rewardType === 'service' && styles.segmentedButtonActive
                  ]}
                  onPress={() => setLoyaltyForm({ ...loyaltyForm, rewardType: 'service' })}
                >
                  <Text style={[
                    styles.segmentedButtonText,
                    loyaltyForm.rewardType === 'service' && styles.segmentedButtonTextActive
                  ]}>
                    Service
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentedButton,
                    loyaltyForm.rewardType === 'product' && styles.segmentedButtonActive
                  ]}
                  onPress={() => setLoyaltyForm({ ...loyaltyForm, rewardType: 'product' })}
                >
                  <Text style={[
                    styles.segmentedButtonText,
                    loyaltyForm.rewardType === 'product' && styles.segmentedButtonTextActive
                  ]}>
                    Product
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderAnalytics = () => (
    <View style={styles.analyticsContainer}>
      <View style={styles.analyticsGrid}>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsNumber}>{promotions.length}</Text>
          <Text style={styles.analyticsLabel}>Active Promotions</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsNumber}>{loyaltyPrograms.length}</Text>
          <Text style={styles.analyticsLabel}>Loyalty Programs</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsNumber}>
            {loyaltyPrograms.reduce((sum, program) => sum + (program.activeMembers || 0), 0)}
          </Text>
          <Text style={styles.analyticsLabel}>Total Members</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsNumber}>
            {Math.round(loyaltyPrograms.reduce((sum, program) => sum + (program.totalPointsIssued || 0), 0)).toLocaleString()}
          </Text>
          <Text style={styles.analyticsLabel}>Points Issued</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading promotions and loyalty data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Promotions & Loyalty</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'promotions' && styles.activeTab]}
            onPress={() => setActiveTab('promotions')}
          >
            <Text style={[styles.tabText, activeTab === 'promotions' && styles.activeTabText]}>
              Promotions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'loyalty' && styles.activeTab]}
            onPress={() => setActiveTab('loyalty')}
          >
            <Text style={[styles.tabText, activeTab === 'loyalty' && styles.activeTabText]}>
              Loyalty
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
      </LinearGradient>

      <View style={styles.content}>
        {activeTab === 'promotions' && (
          <>
            {!canUsePromotions ? (
              <View style={styles.upgradePrompt}>
                <Ionicons name="lock-closed" size={48} color={COLORS.primary} />
                <Text style={styles.upgradeTitle}>Promotions Require Pro Plan</Text>
                <Text style={styles.upgradeText}>
                  Create and manage discount codes and promotional offers with our Pro plan.
                </Text>
                <Text style={styles.currentPlan}>Current Plan: {subscriptionTier}</Text>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => navigation.navigate('SubscriptionPlans')}
                >
                  <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={promotions}
                renderItem={renderPromotionCard}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="pricetag-outline" size={64} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>No Promotions Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Create your first promotion to attract more clients
                </Text>
              </View>
            }
          />
            )}
          </>
        )}

        {activeTab === 'loyalty' && (
          <>
            {!canUseLoyalty ? (
              <View style={styles.upgradePrompt}>
                <Ionicons name="gift-outline" size={64} color={COLORS.primary} />
                <Text style={styles.upgradeTitle}>Loyalty Programs Require Upgrade</Text>
                <Text style={styles.upgradeText}>
                  Create and manage loyalty programs to reward your loyal customers with our Pro or Business plans.
                </Text>
                <Text style={styles.currentPlan}>
                  Current Plan: {subscriptionTier}
                </Text>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => navigation.navigate('SubscriptionPlans')}
                >
                  <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={loyaltyPrograms}
                renderItem={renderLoyaltyCard}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="gift-outline" size={64} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>No Loyalty Programs</Text>
                    <Text style={styles.emptySubtitle}>
                      Create a loyalty program to reward repeat customers
                    </Text>
                  </View>
                }
              />
            )}
          </>
        )}

        {activeTab === 'analytics' && renderAnalytics()}
      </View>

      {/* Show FAB only if user has access to the current tab's features */}
      {((activeTab === 'promotions' && canUsePromotions) || 
        (activeTab === 'loyalty' && canUseLoyalty) || 
        activeTab === 'analytics') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (activeTab === 'promotions' && canUsePromotions) {
              setShowPromotionModal(true);
            } else if (activeTab === 'loyalty' && canUseLoyalty) {
              setShowLoyaltyModal(true);
            }
          }}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={24} color={COLORS.surface} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {renderPromotionModal()}
      {renderLoyaltyModal()}
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
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginHorizontal: 4,
    borderRadius: RADIUS.md,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: SPACING.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  cardCode: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  cardType: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  loyaltyDetails: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  loyaltyDetailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryAlpha,
    borderRadius: RADIUS.md,
  },
  editButtonText: {
    marginLeft: SPACING.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.md,
  },
  toggleButtonText: {
    marginLeft: SPACING.xs,
    color: COLORS.text,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 2,
  },
  segmentedButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  segmentedButtonActive: {
    backgroundColor: COLORS.primary,
  },
  segmentedButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  segmentedButtonTextActive: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formHelper: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  analyticsContainer: {
    padding: SPACING.lg,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsCard: {
    width: (width - 3 * SPACING.lg) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  analyticsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  analyticsLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  serviceSelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  serviceChipSelected: {
    backgroundColor: COLORS.primary,
  },
  serviceChipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  serviceChipTextSelected: {
    color: COLORS.surface,
  },
  noServicesText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: SPACING.lg,
  },
  applicableServicesSection: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  applicableServicesLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  serviceTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  serviceTag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  serviceTagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
  },
  upgradePrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.lg,
    margin: SPACING.lg,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  upgradeText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 24,
  },
  currentPlan: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.md,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  upgradeButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EnhancedCouponsLoyaltyScreen;
