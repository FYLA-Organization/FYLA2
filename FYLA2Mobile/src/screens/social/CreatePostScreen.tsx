import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
  ActivityIndicator,
  Dimensions,
  Image,
  StatusBar,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { MODERN_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/modernDesign';
import FeatureGatingService from '../../services/featureGatingService';
import SubscriptionBanner from '../../components/subscription/SubscriptionBanner';

const { width } = Dimensions.get('window');

type CreatePostNavigationProp = StackNavigationProp<RootStackParamList, 'CreatePost'>;

interface PostData {
  content: string;
  images: ImageAsset[];
  location?: string;
  tags: string[];
  isBusinessPost: boolean;
  serviceCategory?: string;
  priceRange?: string;
  allowBooking: boolean;
}

interface ImageAsset {
  uri: string;
  width?: number;
  height?: number;
  type?: string;
}

const CreatePostScreen: React.FC = () => {
  const [postData, setPostData] = useState<PostData>({
    content: '',
    images: [],
    tags: [],
    isBusinessPost: false,
    allowBooking: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<string>('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  const navigation = useNavigation<CreatePostNavigationProp>();

  const serviceCategories = [
    'Hair Styling', 'Makeup', 'Nail Care', 'Skincare', 
    'Massage', 'Eyebrows', 'Eyelashes', 'Fitness', 'Other'
  ];

  const priceRanges = [
    '$0 - $25', '$25 - $50', '$50 - $100', 
    '$100 - $200', '$200 - $500', '$500+'
  ];

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (mediaStatus !== 'granted' || cameraStatus !== 'granted') {
      Alert.alert('Permission needed', 'Camera and photo library access is required to add images.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type,
        }));
        
        setPostData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages].slice(0, 10) // Max 10 images
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const newImage = {
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
          type: result.assets[0].type,
        };
        
        setPostData(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setPostData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (address[0]) {
        const locationString = `${address[0].city}, ${address[0].region}`;
        setLocation(locationString);
        setPostData(prev => ({ ...prev, location: locationString }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location.');
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !postData.tags.includes(tagInput.trim())) {
      setPostData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPostData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handlePost = async () => {
    if (!postData.content.trim() && postData.images.length === 0) {
      Alert.alert('Error', 'Please add some content or images to your post.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert('Success', 'Your post has been published!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const renderImage = ({ item, index }: { item: ImageAsset, index: number }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item.uri }} style={styles.postImage} />
      <TouchableOpacity 
        style={styles.removeImageButton}
        onPress={() => removeImage(index)}
      >
        <Ionicons name="close-circle" size={24} color={MODERN_COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MODERN_COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={MODERN_COLORS.gray700} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Create Post</Text>
        
        <TouchableOpacity 
          style={[styles.postButton, (!postData.content.trim() && postData.images.length === 0) && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={isLoading || (!postData.content.trim() && postData.images.length === 0)}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={MODERN_COLORS.white} />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Text Input */}
          <View style={styles.textSection}>
            <TextInput
              style={styles.textInput}
              placeholder="What's on your mind?"
              placeholderTextColor={MODERN_COLORS.gray400}
              value={postData.content}
              onChangeText={(text) => setPostData(prev => ({ ...prev, content: text }))}
              multiline
              maxLength={2000}
              autoFocus
            />
            <Text style={styles.characterCount}>
              {postData.content.length}/2000
            </Text>
          </View>

          {/* Images */}
          {postData.images.length > 0 && (
            <View style={styles.imagesSection}>
              <FlatList
                data={postData.images}
                renderItem={renderImage}
                keyExtractor={(_, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesList}
              />
            </View>
          )}

          {/* Add Media Button */}
          <TouchableOpacity style={styles.addMediaButton} onPress={showImageOptions}>
            <Ionicons name="camera-outline" size={20} color={MODERN_COLORS.primary} />
            <Text style={styles.addMediaText}>Add Photos</Text>
          </TouchableOpacity>

          {/* Location */}
          <View style={styles.optionSection}>
            <View style={styles.optionHeader}>
              <Ionicons name="location-outline" size={20} color={MODERN_COLORS.gray600} />
              <Text style={styles.optionTitle}>Location</Text>
            </View>
            {location ? (
              <View style={styles.locationContainer}>
                <Text style={styles.locationText}>{location}</Text>
                <TouchableOpacity onPress={() => {
                  setLocation('');
                  setPostData(prev => ({ ...prev, location: undefined }));
                }}>
                  <Ionicons name="close-circle" size={20} color={MODERN_COLORS.gray400} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addLocationButton} onPress={getCurrentLocation}>
                <Text style={styles.addLocationText}>Add location</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tags */}
          <View style={styles.optionSection}>
            <View style={styles.optionHeader}>
              <Ionicons name="pricetag-outline" size={20} color={MODERN_COLORS.gray600} />
              <Text style={styles.optionTitle}>Tags</Text>
            </View>
            
            {postData.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {postData.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <Ionicons name="close" size={16} color={MODERN_COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="Add tag..."
                placeholderTextColor={MODERN_COLORS.gray400}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                <Ionicons name="add" size={20} color={MODERN_COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Business Post Toggle */}
          <View style={styles.toggleSection}>
            <View style={styles.toggleHeader}>
              <View style={styles.toggleInfo}>
                <Ionicons name="briefcase-outline" size={20} color={MODERN_COLORS.gray600} />
                <View style={styles.toggleTextContainer}>
                  <Text style={styles.toggleTitle}>Business Post</Text>
                  <Text style={styles.toggleDescription}>
                    Mark this as a professional service showcase
                  </Text>
                </View>
              </View>
              <Switch
                value={postData.isBusinessPost}
                onValueChange={async (value) => {
                  if (value) {
                    // Check if user can create business posts
                    const canUseCustomBranding = await FeatureGatingService.canUseCustomBranding();
                    if (!canUseCustomBranding.allowed) {
                      Alert.alert(
                        'Business Posts Unavailable',
                        canUseCustomBranding.message + '\n\nWould you like to upgrade?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Upgrade', 
                            onPress: () => navigation.navigate('SubscriptionPlans')
                          }
                        ]
                      );
                      return;
                    }
                  }
                  setPostData(prev => ({ ...prev, isBusinessPost: value }));
                }}
                trackColor={{ false: MODERN_COLORS.gray200, true: MODERN_COLORS.primary + '50' }}
                thumbColor={postData.isBusinessPost ? MODERN_COLORS.primary : MODERN_COLORS.gray400}
              />
            </View>

            {postData.isBusinessPost && (
              <View style={styles.businessOptions}>
                {/* Service Category */}
                <View style={styles.businessOption}>
                  <Text style={styles.businessOptionLabel}>Service Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.categoryContainer}>
                      {serviceCategories.map((category) => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.categoryChip,
                            postData.serviceCategory === category && styles.categoryChipSelected
                          ]}
                          onPress={() => setPostData(prev => ({ 
                            ...prev, 
                            serviceCategory: prev.serviceCategory === category ? undefined : category 
                          }))}
                        >
                          <Text style={[
                            styles.categoryChipText,
                            postData.serviceCategory === category && styles.categoryChipTextSelected
                          ]}>
                            {category}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Price Range */}
                <View style={styles.businessOption}>
                  <Text style={styles.businessOptionLabel}>Price Range</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.categoryContainer}>
                      {priceRanges.map((range) => (
                        <TouchableOpacity
                          key={range}
                          style={[
                            styles.categoryChip,
                            postData.priceRange === range && styles.categoryChipSelected
                          ]}
                          onPress={() => setPostData(prev => ({ 
                            ...prev, 
                            priceRange: prev.priceRange === range ? undefined : range 
                          }))}
                        >
                          <Text style={[
                            styles.categoryChipText,
                            postData.priceRange === range && styles.categoryChipTextSelected
                          ]}>
                            {range}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Allow Booking Toggle */}
                <View style={styles.subToggleSection}>
                  <View style={styles.subToggleInfo}>
                    <Text style={styles.subToggleTitle}>Allow Direct Booking</Text>
                    <Text style={styles.subToggleDescription}>
                      Let clients book this service directly from your post
                    </Text>
                  </View>
                  <Switch
                    value={postData.allowBooking}
                    onValueChange={(value) => setPostData(prev => ({ ...prev, allowBooking: value }))}
                    trackColor={{ false: MODERN_COLORS.gray200, true: MODERN_COLORS.primary + '50' }}
                    thumbColor={postData.allowBooking ? MODERN_COLORS.primary : MODERN_COLORS.gray400}
                  />
                </View>
              </View>
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: MODERN_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
    ...SHADOWS.sm,
  },
  headerButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
  },
  postButton: {
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 60,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: MODERN_COLORS.gray300,
  },
  postButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },

  // Text Section
  textSection: {
    padding: SPACING.md,
    backgroundColor: MODERN_COLORS.surface,
    marginBottom: SPACING.xs,
  },
  textInput: {
    fontSize: TYPOGRAPHY.lg,
    color: MODERN_COLORS.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  characterCount: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray400,
    textAlign: 'right',
    marginTop: SPACING.sm,
  },

  // Images
  imagesSection: {
    backgroundColor: MODERN_COLORS.surface,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xs,
  },
  imagesList: {
    paddingHorizontal: SPACING.md,
  },
  imageContainer: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  postImage: {
    width: 150,
    height: 150,
    borderRadius: BORDER_RADIUS.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: MODERN_COLORS.surface,
    borderRadius: 12,
    ...SHADOWS.sm,
  },

  // Add Media
  addMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MODERN_COLORS.surface,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  addMediaText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.primary,
  },

  // Options
  optionSection: {
    backgroundColor: MODERN_COLORS.surface,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  optionTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
  },

  // Location
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MODERN_COLORS.gray50,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  locationText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
  },
  addLocationButton: {
    backgroundColor: MODERN_COLORS.gray50,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  addLocationText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.primary,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  tagText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.primary,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
  },
  tagInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textPrimary,
    paddingVertical: SPACING.sm,
  },
  addTagButton: {
    padding: SPACING.xs,
  },

  // Toggles
  toggleSection: {
    backgroundColor: MODERN_COLORS.surface,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
  },
  toggleDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
    marginTop: 2,
  },

  // Business Options
  businessOptions: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  businessOption: {
    gap: SPACING.sm,
  },
  businessOptionLabel: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.textPrimary,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  categoryChip: {
    backgroundColor: MODERN_COLORS.gray100,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: MODERN_COLORS.border,
  },
  categoryChipSelected: {
    backgroundColor: MODERN_COLORS.primary,
    borderColor: MODERN_COLORS.primary,
  },
  categoryChipText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.textSecondary,
  },
  categoryChipTextSelected: {
    color: MODERN_COLORS.white,
  },

  // Sub Toggle
  subToggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.gray50,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  subToggleInfo: {
    flex: 1,
  },
  subToggleTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.textPrimary,
  },
  subToggleDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
    marginTop: 2,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: SPACING.xl,
  },
});

export default CreatePostScreen;
