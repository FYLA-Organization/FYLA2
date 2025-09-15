import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

interface LoyaltyData {
  programId: number;
  programName: string;
  currentPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  nextRewardAt: number;
  rewardType: string;
  rewardValue: number;
}

interface LoyaltyPointsWidgetProps {
  serviceProviderId: string;
  clientId: string;
  onRedemptionPress?: () => void;
}

const LoyaltyPointsWidget: React.FC<LoyaltyPointsWidgetProps> = ({
  serviceProviderId,
  clientId,
  onRedemptionPress,
}) => {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoyaltyData();
  }, [serviceProviderId, clientId]);

  const loadLoyaltyData = async () => {
    try {
      // This would call an endpoint to get client's loyalty status with this provider
      const response = await getClientLoyaltyStatus(serviceProviderId, clientId);
      setLoyaltyData(response);
    } catch (error) {
      console.log('No loyalty program found for this provider');
    } finally {
      setLoading(false);
    }
  };

  const getClientLoyaltyStatus = async (providerId: string, clientId: string) => {
    try {
      const response = await apiService.getClientLoyaltyStatus(providerId, clientId);
      return response;
    } catch (error) {
      return null;
    }
  };

  const handleRedeemPoints = () => {
    if (!loyaltyData) return;

    Alert.alert(
      'Redeem Points',
      `Redeem ${loyaltyData.nextRewardAt} points for ${loyaltyData.rewardType === 'discount' ? '$' : ''}${loyaltyData.rewardValue}${loyaltyData.rewardType === 'percentage' ? '% off' : loyaltyData.rewardType === 'discount' ? ' off' : ' reward'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Redeem', 
          onPress: () => {
            onRedemptionPress?.();
            // TODO: Implement redemption logic
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading loyalty info...</Text>
      </View>
    );
  }

  if (!loyaltyData) {
    return null; // No loyalty program available
  }

  const progressPercentage = (loyaltyData.currentPoints / loyaltyData.nextRewardAt) * 100;
  const canRedeem = loyaltyData.currentPoints >= loyaltyData.nextRewardAt;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.loyaltyCard}
        onPress={() => setShowDetails(true)}
      >
        <LinearGradient
          colors={['#9C27B0', '#7B1FA2']}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="star" size={24} color="#FFF" />
              <Text style={styles.programName}>{loyaltyData.programName}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowDetails(true)}>
              <Ionicons name="information-circle-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.pointsContainer}>
            <Text style={styles.pointsLabel}>Your Points</Text>
            <Text style={styles.pointsValue}>{loyaltyData.currentPoints.toLocaleString()}</Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(progressPercentage, 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {loyaltyData.nextRewardAt - loyaltyData.currentPoints} points to next reward
            </Text>
          </View>

          {canRedeem && (
            <TouchableOpacity
              style={styles.redeemButton}
              onPress={handleRedeemPoints}
            >
              <Text style={styles.redeemButtonText}>Redeem Reward</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Details Modal */}
      <Modal visible={showDetails} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Loyalty Program Details</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Current Points</Text>
                  <Text style={styles.statValue}>{loyaltyData.currentPoints.toLocaleString()}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Earned</Text>
                  <Text style={styles.statValue}>{loyaltyData.totalEarned.toLocaleString()}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Redeemed</Text>
                  <Text style={styles.statValue}>{loyaltyData.totalRedeemed.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>Next Reward</Text>
                <Text style={styles.rewardDescription}>
                  Earn {loyaltyData.nextRewardAt} points to get{' '}
                  {loyaltyData.rewardType === 'discount' && `$${loyaltyData.rewardValue} off`}
                  {loyaltyData.rewardType === 'percentage' && `${loyaltyData.rewardValue}% off`}
                  {loyaltyData.rewardType === 'free_service' && 'a free service'}
                  {loyaltyData.rewardType === 'gift' && 'a special gift'}
                </Text>
              </View>

              <View style={styles.howItWorks}>
                <Text style={styles.howItWorksTitle}>How It Works</Text>
                <Text style={styles.howItWorksText}>
                  • Earn points with every booking{'\n'}
                  • Points never expire{'\n'}
                  • Redeem anytime you have enough points{'\n'}
                  • Exclusive member-only offers{'\n'}
                  • Track your progress in real-time
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowDetails(false)}
            >
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  loyaltyCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  pointsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pointsLabel: {
    color: '#E1BEE7',
    fontSize: 14,
    marginBottom: 5,
  },
  pointsValue: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  progressText: {
    color: '#E1BEE7',
    fontSize: 12,
    textAlign: 'center',
  },
  redeemButton: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  redeemButtonText: {
    color: '#9C27B0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9C27B0',
  },
  rewardInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  howItWorks: {
    marginBottom: 20,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  howItWorksText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  closeModalButton: {
    margin: 20,
    backgroundColor: '#9C27B0',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoyaltyPointsWidget;
