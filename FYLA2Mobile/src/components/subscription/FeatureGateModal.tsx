import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Props {
  visible: boolean;
  onClose: () => void;
  feature: string;
  description: string;
  currentPlan: string;
  recommendedPlan: string;
  icon?: string;
}

const FeatureGateModal: React.FC<Props> = ({
  visible,
  onClose,
  feature,
  description,
  currentPlan,
  recommendedPlan,
  icon = 'star'
}) => {
  const navigation = useNavigation();

  const handleUpgrade = () => {
    onClose();
    navigation.navigate('SubscriptionPlans' as never);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name={icon as any} size={32} color="#8B5CF6" />
            </View>
            
            <Text style={styles.title}>Upgrade Required</Text>
            <Text style={styles.featureName}>{feature}</Text>
            <Text style={styles.description}>{description}</Text>
            
            <View style={styles.planComparison}>
              <View style={styles.currentPlanInfo}>
                <Text style={styles.planLabel}>Your Current Plan</Text>
                <Text style={styles.currentPlanName}>{currentPlan}</Text>
              </View>
              
              <Ionicons name="arrow-forward" size={20} color="#8B5CF6" />
              
              <View style={styles.recommendedPlanInfo}>
                <Text style={styles.planLabel}>Recommended</Text>
                <Text style={styles.recommendedPlanName}>{recommendedPlan}</Text>
              </View>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                <Text style={styles.upgradeButtonText}>View Plans</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  planComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  currentPlanInfo: {
    alignItems: 'center',
    flex: 1,
  },
  recommendedPlanInfo: {
    alignItems: 'center',
    flex: 1,
  },
  planLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  currentPlanName: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  recommendedPlanName: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '700',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  upgradeButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default FeatureGateModal;
