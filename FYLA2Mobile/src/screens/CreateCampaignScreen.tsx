import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiService from '../services/apiService';

interface CampaignData {
  name: string;
  type: string;
  targetAudience: string;
  startDate: Date | null;
  endDate: Date | null;
  budget: string;
  content: {
    subject?: string;
    message?: string;
    template?: string;
    adText?: string;
    promoCode?: string;
    discountValue?: string;
  };
}

const CreateCampaignScreen: React.FC = ({ navigation }: any) => {
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    type: 'email',
    targetAudience: 'all_clients',
    startDate: null,
    endDate: null,
    budget: '',
    content: {},
  });

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showAudienceModal, setShowAudienceModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const campaignTypes = [
    { label: 'Email Campaign', value: 'email' },
    { label: 'SMS Campaign', value: 'sms' },
    { label: 'Social Media', value: 'social_media' },
    { label: 'Google Ads', value: 'google_ads' },
    { label: 'Promotion', value: 'promotion' },
  ];

  const targetAudiences = [
    { label: 'All Clients', value: 'all_clients' },
    { label: 'New Clients', value: 'new_clients' },
    { label: 'Returning Clients', value: 'returning_clients' },
    { label: 'VIP Clients', value: 'vip_clients' },
  ];

  const handleCreateCampaign = async () => {
    if (!campaignData.name.trim()) {
      Alert.alert('Error', 'Please enter a campaign name');
      return;
    }

    if (!campaignData.startDate) {
      Alert.alert('Error', 'Please select a start date');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: campaignData.name,
        type: campaignData.type,
        targetAudience: campaignData.targetAudience,
        startDate: campaignData.startDate?.toISOString(),
        endDate: campaignData.endDate?.toISOString(),
        budget: parseFloat(campaignData.budget) || 0,
        content: campaignData.content,
      };

      await apiService.createCampaign(payload);

      Alert.alert(
        'Success',
        'Campaign created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating campaign:', error);
      Alert.alert('Error', 'Failed to create campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderContentFields = () => {
    switch (campaignData.type) {
      case 'email':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Subject</Text>
              <TextInput
                style={styles.textInput}
                value={campaignData.content.subject || ''}
                onChangeText={(text) =>
                  setCampaignData({
                    ...campaignData,
                    content: { ...campaignData.content, subject: text },
                  })
                }
                placeholder="Enter email subject"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Message</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={campaignData.content.message || ''}
                onChangeText={(text) =>
                  setCampaignData({
                    ...campaignData,
                    content: { ...campaignData.content, message: text },
                  })
                }
                placeholder="Enter your email message"
                multiline
                numberOfLines={4}
              />
            </View>
          </>
        );

      case 'sms':
        return (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SMS Message (160 characters max)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={campaignData.content.message || ''}
              onChangeText={(text) =>
                setCampaignData({
                  ...campaignData,
                  content: { ...campaignData.content, message: text },
                })
              }
              placeholder="Enter your SMS message"
              multiline
              maxLength={160}
            />
            <Text style={styles.characterCount}>
              {(campaignData.content.message || '').length}/160
            </Text>
          </View>
        );

      case 'social_media':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Post Content</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={campaignData.content.message || ''}
                onChangeText={(text) =>
                  setCampaignData({
                    ...campaignData,
                    content: { ...campaignData.content, message: text },
                  })
                }
                placeholder="What would you like to share?"
                multiline
                numberOfLines={4}
              />
            </View>
          </>
        );

      case 'google_ads':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ad Headline</Text>
              <TextInput
                style={styles.textInput}
                value={campaignData.content.subject || ''}
                onChangeText={(text) =>
                  setCampaignData({
                    ...campaignData,
                    content: { ...campaignData.content, subject: text },
                  })
                }
                placeholder="Enter ad headline"
                maxLength={30}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ad Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={campaignData.content.adText || ''}
                onChangeText={(text) =>
                  setCampaignData({
                    ...campaignData,
                    content: { ...campaignData.content, adText: text },
                  })
                }
                placeholder="Describe your service"
                multiline
                maxLength={90}
              />
            </View>
          </>
        );

      case 'promotion':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Promotion Code</Text>
              <TextInput
                style={styles.textInput}
                value={campaignData.content.promoCode || ''}
                onChangeText={(text) =>
                  setCampaignData({
                    ...campaignData,
                    content: { ...campaignData.content, promoCode: text },
                  })
                }
                placeholder="e.g., SAVE20"
                autoCapitalize="characters"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Discount Value (%)</Text>
              <TextInput
                style={styles.textInput}
                value={campaignData.content.discountValue || ''}
                onChangeText={(text) =>
                  setCampaignData({
                    ...campaignData,
                    content: { ...campaignData.content, discountValue: text },
                  })
                }
                placeholder="e.g., 20"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Promotion Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={campaignData.content.message || ''}
                onChangeText={(text) =>
                  setCampaignData({
                    ...campaignData,
                    content: { ...campaignData.content, message: text },
                  })
                }
                placeholder="Describe your promotion"
                multiline
                numberOfLines={3}
              />
            </View>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Campaign</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Campaign Name *</Text>
            <TextInput
              style={styles.textInput}
              value={campaignData.name}
              onChangeText={(text) =>
                setCampaignData({ ...campaignData, name: text })
              }
              placeholder="Enter campaign name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Campaign Type *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTypeModal(true)}
            >
              <Text style={styles.pickerText}>
                {campaignTypes.find(t => t.value === campaignData.type)?.label}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Audience</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowAudienceModal(true)}
            >
              <Text style={styles.pickerText}>
                {targetAudiences.find(a => a.value === campaignData.targetAudience)?.label}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateGroup}>
              <Text style={styles.label}>Start Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {campaignData.startDate
                    ? campaignData.startDate.toLocaleDateString()
                    : 'Select Date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.dateGroup}>
              <Text style={styles.label}>End Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {campaignData.endDate
                    ? campaignData.endDate.toLocaleDateString()
                    : 'Select Date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Budget ($)</Text>
            <TextInput
              style={styles.textInput}
              value={campaignData.budget}
              onChangeText={(text) =>
                setCampaignData({ ...campaignData, budget: text })
              }
              placeholder="Enter budget amount"
              keyboardType="numeric"
            />
          </View>

          {renderContentFields()}

          <TouchableOpacity
            style={[styles.createButton, loading && styles.disabledButton]}
            onPress={handleCreateCampaign}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#ccc', '#999'] : ['#4CAF50', '#45a049']}
              style={styles.createButtonGradient}
            >
              <Text style={styles.createButtonText}>
                {loading ? 'Creating...' : 'Create Campaign'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showStartDatePicker && (
        <DateTimePicker
          value={campaignData.startDate || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setCampaignData({ ...campaignData, startDate: selectedDate });
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={campaignData.endDate || new Date()}
          mode="date"
          display="default"
          minimumDate={campaignData.startDate || new Date()}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setCampaignData({ ...campaignData, endDate: selectedDate });
            }
          }}
        />
      )}

      {/* Campaign Type Modal */}
      <Modal visible={showTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Campaign Type</Text>
            <FlatList
              data={campaignTypes}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setCampaignData({ ...campaignData, type: item.value, content: {} });
                    setShowTypeModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {campaignData.type === item.value && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTypeModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Target Audience Modal */}
      <Modal visible={showAudienceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Target Audience</Text>
            <FlatList
              data={targetAudiences}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setCampaignData({ ...campaignData, targetAudience: item.value });
                    setShowAudienceModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {campaignData.targetAudience === item.value && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAudienceModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    height: 50,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  dateGroup: {
    flex: 1,
    marginBottom: 20,
  },
  dateButton: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
  },
  createButton: {
    marginTop: 30,
    borderRadius: 8,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickerButton: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
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
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

export default CreateCampaignScreen;
