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
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import apiService from '../../services/api';
import { RootStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';

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

// Instagram/Snapchat-style Color Palette
const COLORS = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceLight: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  primary: '#007AFF',
  accent: '#FF3B30',
  success: '#30D158',
  warning: '#FF9F0A',
  instagram: '#E4405F',
  snapchat: '#FFFC00',
  overlay: 'rgba(0, 0, 0, 0.8)',
};

const { width, height } = Dimensions.get('window');

const BEAUTY_CATEGORIES = [
  { id: 'hair', name: 'Hair', icon: 'cut-outline', color: '#FF6B6B' },
  { id: 'nails', name: 'Nails', icon: 'hand-left-outline', color: '#4ECDC4' },
  { id: 'skincare', name: 'Skincare', icon: 'water-outline', color: '#45B7D1' },
  { id: 'makeup', name: 'Makeup', icon: 'brush-outline', color: '#F7931E' },
  { id: 'massage', name: 'Massage', icon: 'flower-outline', color: '#96CEB4' },
  { id: 'lashes', name: 'Lashes', icon: 'eye-outline', color: '#DDA0DD' },
  { id: 'piercing', name: 'Piercing', icon: 'diamond-outline', color: '#FFB6C1' },
];

const PRICE_RANGES = [
  { id: '$', range: '$0 - $50', color: '#30D158' },
  { id: '$$', range: '$50 - $100', color: '#FF9F0A' },
  { id: '$$$', range: '$100 - $200', color: '#FF6B6B' },
  { id: '$$$$', range: '$200+', color: '#AF52DE' },
];

const TRENDING_TAGS = [
  '#transformation', '#beforeandafter', '#newlook', '#haircolor',
  '#nailart', '#skincare', '#makeup', '#beauty', '#salon', '#selfcare'
];

const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation<CreatePostNavigationProp>();
  const { user } = useAuth();
  
  const [step, setStep] = useState<'camera' | 'edit' | 'post'>('camera');
  const [postData, setPostData] = useState<PostData>({
    content: '',
    images: [],
    location: '',
    tags: [],
    isBusinessPost: false,
    serviceCategory: '',
    priceRange: '',
    allowBooking: false,
  });
  
  const [posting, setPosting] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [showBusinessOptions, setShowBusinessOptions] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Animations
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    requestPermissions();
    
    return () => {
      StatusBar.setBarStyle('dark-content');
    };
  }, []);

  const requestPermissions = async () => {
    try {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await Location.requestForegroundPermissionsAsync();
    } catch (error) {
      console.error('Permission request error:', error);
    }
  };

  const animateStep = (toStep: typeof step) => {
    Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    setStep(toStep);
  };

  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPostData(prev => ({
          ...prev,
          images: [...prev.images, {
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            type: asset.type,
          }]
        }));
        animateStep('edit');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const selectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.9,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type,
        }));
        
        setPostData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages].slice(0, 10)
        }));
        animateStep('edit');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select images');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const locationString = `${address.city}, ${address.region}`;
        setPostData(prev => ({ ...prev, location: locationString }));
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const addTag = (tag: string) => {
    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
    if (!postData.tags.includes(cleanTag) && postData.tags.length < 10) {
      setPostData(prev => ({ ...prev, tags: [...prev.tags, cleanTag] }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPostData(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove) 
    }));
  };

  const removeImage = (index: number) => {
    setPostData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    
    if (postData.images.length === 1) {
      animateStep('camera');
    } else if (selectedImageIndex >= postData.images.length - 1) {
      setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
    }
  };

  const handleSubmit = async () => {
    if (!postData.content.trim() && postData.images.length === 0) {
      Alert.alert('Content Required', 'Please add some content or images to your post');
      return;
    }

    setPosting(true);
    try {
      let uploadedImageUrls: string[] = [];
      
      if (postData.images.length > 0) {
        const imageObjects = postData.images.map((image, index) => ({
          uri: image.uri,
          name: `post_image_${Date.now()}_${index}.jpg`,
          type: 'image/jpeg'
        }));
        
        uploadedImageUrls = await apiService.uploadMultipleImages(imageObjects);
      }

      const postPayload = {
        content: postData.content,
        images: uploadedImageUrls,
        location: postData.location || undefined,
        tags: postData.tags,
        isBusinessPost: postData.isBusinessPost,
        serviceCategory: postData.serviceCategory || undefined,
        priceRange: postData.priceRange || undefined,
        allowBooking: postData.allowBooking,
      };

      await apiService.createSocialPost(postPayload);
      
      Alert.alert(
        'Posted! 🎉', 
        'Your post has been shared successfully!',
        [
          {
            text: 'View Post',
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  // Camera/Gallery Selection Screen
  const renderCameraScreen = () => (
    <View style={styles.cameraContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.cameraHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.cameraHeaderTitle}>Create Post</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Camera/Gallery Options */}
      <View style={styles.cameraOptions}>
        {/* Take Picture */}
        <TouchableOpacity style={styles.cameraOptionLarge} onPress={takePicture}>
          <LinearGradient
            colors={['#FF6B6B', '#4ECDC4']}
            style={styles.cameraOptionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="camera" size={32} color={COLORS.text} />
          </LinearGradient>
          <Text style={styles.cameraOptionText}>Take Photo</Text>
          <Text style={styles.cameraOptionSubtext}>Capture a moment</Text>
        </TouchableOpacity>

        {/* Select from Gallery */}
        <TouchableOpacity style={styles.cameraOptionLarge} onPress={selectFromGallery}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.cameraOptionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="images" size={32} color={COLORS.text} />
          </LinearGradient>
          <Text style={styles.cameraOptionText}>Gallery</Text>
          <Text style={styles.cameraOptionSubtext}>Choose from photos</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>📸 Pro Tips</Text>
        <Text style={styles.tipsText}>• Good lighting makes all the difference</Text>
        <Text style={styles.tipsText}>• Show before & after transformations</Text>
        <Text style={styles.tipsText}>• Multiple angles tell the full story</Text>
      </View>
    </View>
  );

  // Image Editor Screen
  const renderEditScreen = () => (
    <View style={styles.editContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.editHeader}>
        <TouchableOpacity onPress={() => animateStep('camera')}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.editHeaderTitle}>Edit</Text>
        <TouchableOpacity onPress={() => animateStep('post')}>
          <Text style={styles.nextButton}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Image Preview */}
      <View style={styles.imagePreviewContainer}>
        {postData.images.length > 0 && (
          <View style={styles.imageWrapper}>
            <Image 
              source={{ uri: postData.images[selectedImageIndex]?.uri }} 
              style={styles.previewImage}
              resizeMode="cover"
            />
            
            {/* Image Controls */}
            <View style={styles.imageControls}>
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => removeImage(selectedImageIndex)}
              >
                <Ionicons name="trash" size={20} color={COLORS.accent} />
              </TouchableOpacity>
              
              {postData.images.length > 1 && (
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {selectedImageIndex + 1}/{postData.images.length}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Image Thumbnails */}
        {postData.images.length > 1 && (
          <ScrollView 
            horizontal 
            style={styles.thumbnailScroll}
            showsHorizontalScrollIndicator={false}
          >
            {postData.images.map((image, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.thumbnail,
                  selectedImageIndex === index && styles.activeThumbnail
                ]}
                onPress={() => setSelectedImageIndex(index)}
              >
                <Image source={{ uri: image.uri }} style={styles.thumbnailImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Add More Images */}
      <TouchableOpacity style={styles.addMoreButton} onPress={selectFromGallery}>
        <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
        <Text style={styles.addMoreText}>Add More Photos</Text>
      </TouchableOpacity>
    </View>
  );

  // Post Creation Screen
  const renderPostScreen = () => (
    <KeyboardAvoidingView 
      style={styles.postContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => animateStep('edit')}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.postHeaderTitle}>Share</Text>
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={posting || (!postData.content.trim() && postData.images.length === 0)}
          style={[
            styles.shareButton,
            (!postData.content.trim() && postData.images.length === 0) && styles.disabledShareButton
          ]}
        >
          {posting ? (
            <ActivityIndicator size="small" color={COLORS.text} />
          ) : (
            <Text style={[
              styles.shareButtonText,
              (!postData.content.trim() && postData.images.length === 0) && styles.disabledShareButtonText
            ]}>
              Share
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.postContent} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userSection}>
          <Image
            source={{ uri: user?.profilePictureUrl || 'https://via.placeholder.com/40' }}
            style={styles.userAvatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.userHandle}>@{user?.firstName?.toLowerCase()}</Text>
          </View>
        </View>

        {/* Content Input */}
        <View style={styles.contentSection}>
          <TextInput
            style={styles.contentInput}
            placeholder="What's happening in your beauty world? ✨"
            placeholderTextColor={COLORS.textSecondary}
            multiline
            value={postData.content}
            onChangeText={(text) => setPostData(prev => ({ ...prev, content: text }))}
            maxLength={2000}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {postData.content.length}/2000
          </Text>
        </View>

        {/* Tags Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="pricetag" size={16} color={COLORS.primary} /> Tags
          </Text>
          
          {/* Current Tags */}
          {postData.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {postData.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)}>
                    <Ionicons name="close" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Tag Input */}
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="Add tags..."
              placeholderTextColor={COLORS.textSecondary}
              value={currentTag}
              onChangeText={setCurrentTag}
              onSubmitEditing={() => {
                if (currentTag.trim()) {
                  addTag(currentTag.trim());
                }
              }}
            />
            {currentTag.trim() && (
              <TouchableOpacity 
                onPress={() => addTag(currentTag.trim())}
                style={styles.addTagButton}
              >
                <Ionicons name="add" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Trending Tags */}
          <Text style={styles.trendingTitle}>Trending</Text>
          <View style={styles.trendingTags}>
            {TRENDING_TAGS.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.trendingTag,
                  postData.tags.includes(tag) && styles.selectedTrendingTag
                ]}
                onPress={() => addTag(tag)}
                disabled={postData.tags.includes(tag)}
              >
                <Text style={[
                  styles.trendingTagText,
                  postData.tags.includes(tag) && styles.selectedTrendingTagText
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="location" size={16} color={COLORS.primary} /> Location
          </Text>
          <View style={styles.locationContainer}>
            <TextInput
              style={styles.locationInput}
              placeholder="Add location..."
              placeholderTextColor={COLORS.textSecondary}
              value={postData.location}
              onChangeText={(text) => setPostData(prev => ({ ...prev, location: text }))}
            />
            <TouchableOpacity onPress={getCurrentLocation} style={styles.locationButton}>
              <Ionicons name="locate" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Provider Business Post Options */}
        {user?.isServiceProvider && (
          <View style={styles.businessSection}>
            <TouchableOpacity 
              style={styles.businessToggle}
              onPress={() => {
                setPostData(prev => ({ ...prev, isBusinessPost: !prev.isBusinessPost }));
                setShowBusinessOptions(!showBusinessOptions);
              }}
            >
              <View style={styles.businessToggleContent}>
                <LinearGradient
                  colors={postData.isBusinessPost ? [COLORS.primary, COLORS.accent] : [COLORS.surfaceLight, COLORS.surfaceLight]}
                  style={styles.businessIcon}
                >
                  <Ionicons name="briefcase" size={20} color={COLORS.text} />
                </LinearGradient>
                <View style={styles.businessInfo}>
                  <Text style={styles.businessTitle}>Business Post</Text>
                  <Text style={styles.businessSubtitle}>
                    Showcase a service & enable booking
                  </Text>
                </View>
              </View>
              <Switch
                value={postData.isBusinessPost}
                onValueChange={(value) => setPostData(prev => ({ ...prev, isBusinessPost: value }))}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.text}
              />
            </TouchableOpacity>

            {/* Business Options */}
            {postData.isBusinessPost && (
              <Animated.View style={[styles.businessOptions, { opacity: opacityAnim }]}>
                {/* Service Category */}
                <View style={styles.businessOption}>
                  <Text style={styles.businessOptionTitle}>Service Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.categoryGrid}>
                      {BEAUTY_CATEGORIES.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.categoryButton,
                            postData.serviceCategory === category.name && styles.selectedCategory
                          ]}
                          onPress={() => setPostData(prev => ({ 
                            ...prev, 
                            serviceCategory: category.name 
                          }))}
                        >
                          <LinearGradient
                            colors={postData.serviceCategory === category.name 
                              ? [category.color, category.color + '80'] 
                              : [COLORS.surfaceLight, COLORS.surfaceLight]}
                            style={styles.categoryIconContainer}
                          >
                            <Ionicons 
                              name={category.icon as any} 
                              size={16} 
                              color={COLORS.text} 
                            />
                          </LinearGradient>
                          <Text style={[
                            styles.categoryText,
                            postData.serviceCategory === category.name && styles.selectedCategoryText
                          ]}>
                            {category.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Price Range */}
                <View style={styles.businessOption}>
                  <Text style={styles.businessOptionTitle}>Price Range</Text>
                  <View style={styles.priceGrid}>
                    {PRICE_RANGES.map((price) => (
                      <TouchableOpacity
                        key={price.id}
                        style={[
                          styles.priceButton,
                          postData.priceRange === price.range && styles.selectedPrice
                        ]}
                        onPress={() => setPostData(prev => ({ 
                          ...prev, 
                          priceRange: price.range 
                        }))}
                      >
                        <LinearGradient
                          colors={postData.priceRange === price.range 
                            ? [price.color, price.color + '80'] 
                            : [COLORS.surfaceLight, COLORS.surfaceLight]}
                          style={styles.priceGradient}
                        >
                          <Text style={styles.priceSymbol}>{price.id}</Text>
                          <Text style={[
                            styles.priceText,
                            postData.priceRange === price.range && styles.selectedPriceText
                          ]}>
                            {price.range}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Allow Booking */}
                <View style={styles.bookingOption}>
                  <View style={styles.bookingContent}>
                    <LinearGradient
                      colors={postData.allowBooking ? [COLORS.success, COLORS.success + '80'] : [COLORS.surfaceLight, COLORS.surfaceLight]}
                      style={styles.bookingIcon}
                    >
                      <Ionicons name="calendar" size={20} color={COLORS.text} />
                    </LinearGradient>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingTitle}>Enable Booking</Text>
                      <Text style={styles.bookingSubtitle}>
                        Let clients book directly from this post
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={postData.allowBooking}
                    onValueChange={(value) => setPostData(prev => ({ ...prev, allowBooking: value }))}
                    trackColor={{ false: COLORS.border, true: COLORS.success }}
                    thumbColor={COLORS.text}
                  />
                </View>
              </Animated.View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {step === 'camera' && renderCameraScreen()}
      {step === 'edit' && renderEditScreen()}
      {step === 'post' && renderPostScreen()}
    </Animated.View>
  );

        };

const styles = StyleSheet.create({
  // Base Container
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Camera Screen Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cameraHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  cameraOptions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 30,
  },
  cameraOptionLarge: {
    alignItems: 'center',
    width: '100%',
  },
  cameraOptionGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  cameraOptionText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  cameraOptionSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: COLORS.surface,
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
  },

  // Edit Screen Styles
  editContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  editHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  nextButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  imagePreviewContainer: {
    flex: 1,
    marginHorizontal: 20,
  },
  imageWrapper: {
    position: 'relative',
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
  },
  imageControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 12,
  },
  removeImageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCounter: {
    backgroundColor: COLORS.overlay,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  imageCounterText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnailScroll: {
    maxHeight: 80,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: COLORS.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  addMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Post Screen Styles
  postContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  postHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  shareButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disabledShareButton: {
    backgroundColor: COLORS.border,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  disabledShareButtonText: {
    color: COLORS.textSecondary,
  },
  postContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // User Section
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Content Section
  contentSection: {
    marginBottom: 24,
  },
  contentInput: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    minHeight: 120,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 8,
  },

  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  trendingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendingTag: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedTrendingTag: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  trendingTagText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  selectedTrendingTagText: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Location
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  // Business Section
  businessSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  businessToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  businessToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  businessIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  businessSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  businessOptions: {
    marginTop: 20,
    gap: 20,
  },
  businessOption: {
    gap: 12,
  },
  businessOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Categories
  categoryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryButton: {
    alignItems: 'center',
    gap: 8,
    minWidth: 80,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCategory: {
    transform: [{ scale: 1.1 }],
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: COLORS.text,
    fontWeight: '700',
  },

  // Price Range
  priceGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  priceButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  priceGradient: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  selectedPrice: {
    transform: [{ scale: 1.05 }],
  },
  priceSymbol: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  selectedPriceText: {
    color: COLORS.text,
    fontWeight: '700',
  },

  // Booking Option
  bookingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    padding: 16,
  },
  bookingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  bookingSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});

export default CreatePostScreen;
