import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Switch,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList, User, UserPreferences, UserLocation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { MODERN_COLORS } from '../../constants/modernDesign';

type EnhancedProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

const EnhancedProfileScreen: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    bio: '',
    dateOfBirth: '',
  });

  // Preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    budgetRange: { min: 50, max: 500 },
    serviceCategories: [],
    preferredDistance: 25,
    preferredTimeSlots: [],
    notifications: {
      bookingReminders: true,
      promotionalOffers: false,
      newProviderAlerts: true,
      priceDropAlerts: false,
    },
    accessibility: {
      wheelchairAccessible: false,
      hearingImpaired: false,
      visuallyImpaired: false,
    },
  });

  // Location
  const [location, setLocation] = useState<UserLocation>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const navigation = useNavigation<EnhancedProfileScreenNavigationProp>();
  const { user, updateUser } = useAuth();

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        bio: user.bio || '',
        dateOfBirth: user.dateOfBirth || '',
      });
      setProfileImage(user.profilePictureUrl || null);
      
      if (user.preferences) {
        setPreferences(user.preferences);
      }
      
      if (user.location) {
        setLocation(user.location);
      }
    }
  }, [user]);

  const handleImagePicker = async (source: 'camera' | 'library') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
        return;
      }

      let result;
      if (source === 'camera') {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          Alert.alert('Permission Required', 'Please allow camera access to take a photo.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setShowImagePicker(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Create the updated user object with all changes
      const updatedUserData: Partial<User> = {
        ...profileData,
        profilePictureUrl: profileImage || undefined,
        preferences,
        location,
      };

      console.log('Saving profile data:', updatedUserData);
      
      // Use the AuthContext updateUser method which handles API calls and storage
      await updateUser(updatedUserData);
      
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const renderEditableField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder?: string,
    multiline?: boolean,
    keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric'
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput, 
          multiline && styles.multilineInput,
          !isEditing && styles.disabledInput
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={MODERN_COLORS.gray400}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        editable={isEditing}
      />
    </View>
  );

  const renderStaticField = (label: string, value: string) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || 'Not provided'}</Text>
    </View>
  );

  const renderPreferenceToggle = (
    label: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    description?: string
  ) => (
    <View style={styles.preferenceItem}>
      <View style={styles.preferenceInfo}>
        <Text style={styles.preferenceLabel}>{label}</Text>
        {description && (
          <Text style={styles.preferenceDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: MODERN_COLORS.gray300, true: MODERN_COLORS.primary + '40' }}
        thumbColor={value ? MODERN_COLORS.primary : MODERN_COLORS.gray500}
        disabled={!isEditing}
      />
    </View>
  );

  const serviceCategories = [
    'Hair & Beauty', 'Wellness & Spa', 'Fitness', 'Health', 
    'Home Services', 'Auto Services', 'Pet Care', 'Education'
  ];

  const timeSlots = ['morning', 'afternoon', 'evening', 'flexible'];

  const renderProfileSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Ionicons 
            name={isEditing ? "checkmark" : "pencil"} 
            size={20} 
            color="#FF6B6B" 
          />
        </TouchableOpacity>
      </View>

      {/* Profile Picture */}
      <View style={styles.profileImageContainer}>
        <TouchableOpacity
          style={styles.profileImageWrapper}
          onPress={() => isEditing && setShowImagePicker(true)}
          disabled={!isEditing}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="person" size={50} color="#999" />
            </View>
          )}
          {isEditing && (
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.profileName}>
          {profileData.firstName} {profileData.lastName}
        </Text>
        <Text style={styles.memberSince}>
          Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}
        </Text>
      </View>

      {/* Profile Fields */}
      <View style={styles.fieldsContainer}>
        {renderField('First Name', 'firstName', profileData.firstName)}
        {renderField('Last Name', 'lastName', profileData.lastName)}
        {renderField('Email', 'email', profileData.email, 'email-address')}
        {renderField('Phone', 'phoneNumber', profileData.phoneNumber, 'phone-pad')}
        {renderField('Bio', 'bio', profileData.bio, 'default', true)}
      </View>
    </View>
  );

  const renderField = (
    label: string, 
    key: keyof typeof profileData, 
    value: string, 
    keyboardType: any = 'default',
    multiline = false
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.multilineInput]}
          value={value}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, [key]: text }))}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          placeholder={`Enter your ${label.toLowerCase()}`}
          placeholderTextColor="#999"
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'Not set'}</Text>
      )}
    </View>
  );

  const renderPreferencesSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Preferences</Text>
      
      {/* Budget Range */}
      <View style={styles.preferenceGroup}>
        <Text style={styles.preferenceTitle}>Budget Range</Text>
        <View style={styles.budgetContainer}>
          <Text style={styles.budgetLabel}>$</Text>
          <TextInput
            style={styles.budgetInput}
            value={preferences.budgetRange.min.toString()}
            onChangeText={(text) => setPreferences(prev => ({
              ...prev,
              budgetRange: { ...prev.budgetRange, min: parseInt(text) || 0 }
            }))}
            keyboardType="numeric"
            editable={isEditing}
          />
          <Text style={styles.budgetSeparator}>to</Text>
          <Text style={styles.budgetLabel}>$</Text>
          <TextInput
            style={styles.budgetInput}
            value={preferences.budgetRange.max.toString()}
            onChangeText={(text) => setPreferences(prev => ({
              ...prev,
              budgetRange: { ...prev.budgetRange, max: parseInt(text) || 0 }
            }))}
            keyboardType="numeric"
            editable={isEditing}
          />
        </View>
      </View>

      {/* Service Categories */}
      <View style={styles.preferenceGroup}>
        <Text style={styles.preferenceTitle}>Preferred Services</Text>
        <View style={styles.tagsContainer}>
          {serviceCategories.map((category) => {
            const isSelected = preferences.serviceCategories.includes(category);
            return (
              <TouchableOpacity
                key={category}
                style={[styles.tag, isSelected && styles.tagSelected]}
                onPress={() => {
                  if (!isEditing) return;
                  setPreferences(prev => ({
                    ...prev,
                    serviceCategories: isSelected
                      ? prev.serviceCategories.filter(c => c !== category)
                      : [...prev.serviceCategories, category]
                  }));
                }}
                disabled={!isEditing}
              >
                <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Preferred Time Slots */}
      <View style={styles.preferenceGroup}>
        <Text style={styles.preferenceTitle}>Preferred Time</Text>
        <View style={styles.tagsContainer}>
          {timeSlots.map((slot) => {
            const isSelected = preferences.preferredTimeSlots.includes(slot);
            return (
              <TouchableOpacity
                key={slot}
                style={[styles.tag, isSelected && styles.tagSelected]}
                onPress={() => {
                  if (!isEditing) return;
                  setPreferences(prev => ({
                    ...prev,
                    preferredTimeSlots: isSelected
                      ? prev.preferredTimeSlots.filter(s => s !== slot)
                      : [...prev.preferredTimeSlots, slot]
                  }));
                }}
                disabled={!isEditing}
              >
                <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                  {slot.charAt(0).toUpperCase() + slot.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Distance Preference */}
      <View style={styles.preferenceGroup}>
        <Text style={styles.preferenceTitle}>
          Preferred Distance: {preferences.preferredDistance} miles
        </Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>5</Text>
          {/* Note: You'd need to install react-native-slider or similar for a proper slider */}
          <TextInput
            style={styles.distanceInput}
            value={preferences.preferredDistance.toString()}
            onChangeText={(text) => setPreferences(prev => ({
              ...prev,
              preferredDistance: parseInt(text) || 5
            }))}
            keyboardType="numeric"
            editable={isEditing}
          />
          <Text style={styles.sliderLabel}>100</Text>
        </View>
      </View>
    </View>
  );

  const renderLocationSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Location</Text>
      
      <View style={styles.fieldsContainer}>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Address</Text>
          <TextInput
            style={styles.fieldInput}
            value={location.address}
            onChangeText={(text) => setLocation(prev => ({ ...prev, address: text }))}
            placeholder="Street address"
            placeholderTextColor="#999"
            editable={isEditing}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.fieldContainer, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.fieldLabel}>City</Text>
            <TextInput
              style={styles.fieldInput}
              value={location.city}
              onChangeText={(text) => setLocation(prev => ({ ...prev, city: text }))}
              placeholder="City"
              placeholderTextColor="#999"
              editable={isEditing}
            />
          </View>

          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>State</Text>
            <TextInput
              style={styles.fieldInput}
              value={location.state}
              onChangeText={(text) => setLocation(prev => ({ ...prev, state: text }))}
              placeholder="State"
              placeholderTextColor="#999"
              editable={isEditing}
            />
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>ZIP Code</Text>
          <TextInput
            style={styles.fieldInput}
            value={location.zipCode}
            onChangeText={(text) => setLocation(prev => ({ ...prev, zipCode: text }))}
            placeholder="ZIP Code"
            placeholderTextColor="#999"
            keyboardType="numeric"
            editable={isEditing}
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <LinearGradient 
          colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryLight]} 
          style={styles.header}
        >
          <View style={styles.headerContent}>
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Switch,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList, User, UserPreferences, UserLocation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { MODERN_COLORS } from '../../constants/modernDesign';

type EnhancedProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

const EnhancedProfileScreen: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    bio: '',
    dateOfBirth: '',
  });

  // Preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    budgetRange: { min: 50, max: 500 },
    serviceCategories: [],
    preferredDistance: 25,
    preferredTimeSlots: [],
    notifications: {
      bookingReminders: true,
      promotionalOffers: false,
      newProviderAlerts: true,
      priceDropAlerts: false,
    },
    accessibility: {
      wheelchairAccessible: false,
      hearingImpaired: false,
      visuallyImpaired: false,
    },
  });

  // Location
  const [location, setLocation] = useState<UserLocation>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const navigation = useNavigation<EnhancedProfileScreenNavigationProp>();
  const { user, updateUser } = useAuth();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.gray50,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 10 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: MODERN_COLORS.white,
    letterSpacing: 0.3,
  },
  saveButton: {
    backgroundColor: MODERN_COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: MODERN_COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: MODERN_COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  placeholder: {
    width: 80,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    backgroundColor: MODERN_COLORS.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: MODERN_COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: MODERN_COLORS.gray900,
    letterSpacing: 0.2,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: MODERN_COLORS.primary + '15',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: MODERN_COLORS.white,
    shadowColor: MODERN_COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: MODERN_COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: MODERN_COLORS.gray200,
    borderStyle: 'dashed',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: MODERN_COLORS.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: MODERN_COLORS.white,
    shadowColor: MODERN_COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#666',
  },
  fieldsContainer: {
    gap: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: MODERN_COLORS.gray800,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  fieldInput: {
    borderWidth: 2,
    borderColor: MODERN_COLORS.gray200,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: MODERN_COLORS.gray900,
    backgroundColor: MODERN_COLORS.white,
    fontWeight: '500',
  },
  disabledInput: {
    backgroundColor: MODERN_COLORS.gray50,
    borderColor: MODERN_COLORS.gray100,
    color: MODERN_COLORS.gray600,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  fieldValue: {
    fontSize: 16,
    color: MODERN_COLORS.gray700,
    padding: 16,
    backgroundColor: MODERN_COLORS.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray200,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
  },
  preferenceGroup: {
    marginBottom: 24,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 12,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetLabel: {
    fontSize: 16,
    color: '#333',
  },
  budgetInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    width: 80,
    textAlign: 'center',
  },
  budgetSeparator: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  tagTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666',
  },
  distanceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imagePickerModal: {
    backgroundColor: MODERN_COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: MODERN_COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: MODERN_COLORS.gray900,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.2,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: MODERN_COLORS.gray50,
  },
  modalOptionText: {
    fontSize: 16,
    color: MODERN_COLORS.gray900,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  cancelOption: {
    backgroundColor: MODERN_COLORS.gray100,
    borderTopWidth: 0,
    marginTop: 8,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: MODERN_COLORS.accent,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});

export default EnhancedProfileScreen;
