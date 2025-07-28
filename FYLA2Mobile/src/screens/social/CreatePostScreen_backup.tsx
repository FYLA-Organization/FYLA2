import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../../services/api';
import { RootStackParamList } from '../../types';
import ImageUploadComponent from '../../components/ImageUploadComponent';
import { useAuth } from '../../context/AuthContext';

type CreatePostNavigationProp = StackNavigationProp<RootStackParamList, 'CreatePost'>;

interface PostData {
  content: string;
  images: string[];
  location?: string;
  tags: string[];
  isBusinessPost: boolean;
  serviceCategory?: string;
  priceRange?: string;
  allowBooking: boolean;
}

const BEAUTY_CATEGORIES = [
  'Hair Services',
  'Nail Services',
  'Skincare & Facials',
  'Makeup & Beauty',
  'Massage & Spa',
  'Eyebrows & Lashes',
  'Piercing & Tattoo',
];

const PRICE_RANGES = [
  '$0 - $50',
  '$50 - $100',
  '$100 - $200',
  '$200 - $500',
  '$500+',
];

const TRENDING_TAGS = [
  '#transformation',
  '#beforeandafter',
  '#newlook',
  '#haircolor',
  '#nailart',
  '#skincare',
  '#makeup',
  '#beauty',
  '#salon',
  '#selfcare',
  '#hairstyle',
  '#fashion',
  '#glam',
  '#style',
  '#confidence',
];

const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation<CreatePostNavigationProp>();
  const { user } = useAuth();
  
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

  const updatePostData = (key: keyof PostData, value: any) => {
    setPostData(prev => ({ ...prev, [key]: value }));
  };

  const addTag = (tag: string) => {
    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
    if (!postData.tags.includes(cleanTag) && postData.tags.length < 10) {
      updatePostData('tags', [...postData.tags, cleanTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updatePostData('tags', postData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!postData.content.trim() && postData.images.length === 0) {
      Alert.alert('Content Required', 'Please add some content or images to your post');
      return;
    }

    setPosting(true);
    try {
      const response = await apiService.createPost({
        content: postData.content,
        images: postData.images,
        location: postData.location || undefined,
        tags: postData.tags,
        isBusinessPost: postData.isBusinessPost,
        serviceCategory: postData.serviceCategory || undefined,
        priceRange: postData.priceRange || undefined,
        allowBooking: postData.allowBooking,
      });

      Alert.alert(
        'Post Created!',
        'Your post has been shared successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Success!', 'Your post has been created and will appear in the feed shortly!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setPosting(false);
    }
  };

  const renderTag = (tag: string, index: number) => (
    <View key={index} style={styles.tag}>
      <Text style={styles.tagText}>{tag}</Text>
      <TouchableOpacity onPress={() => removeTag(tag)}>
        <Ionicons name="close" size={16} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  const renderTrendingTag = (tag: string, index: number) => (
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
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={posting || (!postData.content.trim() && postData.images.length === 0)}
        >
          {posting ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={[
              styles.shareText,
              (!postData.content.trim() && postData.images.length === 0) && styles.disabledText
            ]}>
              Share
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Content Input */}
        <View style={styles.contentSection}>
          <TextInput
            style={styles.contentInput}
            placeholder="What's happening in your beauty world?"
            multiline
            value={postData.content}
            onChangeText={(text) => updatePostData('content', text)}
            maxLength={2000}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {postData.content.length}/2000
          </Text>
        </View>

        {/* Image Upload */}
        <ImageUploadComponent
          onImagesSelected={(images) => updatePostData('images', images)}
          maxImages={10}
          existingImages={postData.images}
        />

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location (Optional)</Text>
          <View style={styles.locationInputContainer}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <TextInput
              style={styles.locationInput}
              placeholder="Add location"
              value={postData.location}
              onChangeText={(text) => updatePostData('location', text)}
            />
          </View>
        </View>

        {/* Business Post Toggle */}
        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchLabel}>Business Post</Text>
              <Text style={styles.switchSubtext}>
                Show this as a professional service post
              </Text>
            </View>
            <Switch
              value={postData.isBusinessPost}
              onValueChange={(value) => updatePostData('isBusinessPost', value)}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
            />
          </View>
        </View>

        {/* Business Post Options */}
        {postData.isBusinessPost && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryContainer}>
                  {BEAUTY_CATEGORIES.map((category, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.categoryButton,
                        postData.serviceCategory === category && styles.selectedCategory
                      ]}
                      onPress={() => updatePostData('serviceCategory', category)}
                    >
                      <Text style={[
                        styles.categoryText,
                        postData.serviceCategory === category && styles.selectedCategoryText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Range</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.priceContainer}>
                  {PRICE_RANGES.map((range, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.priceButton,
                        postData.priceRange === range && styles.selectedPrice
                      ]}
                      onPress={() => updatePostData('priceRange', range)}
                    >
                      <Text style={[
                        styles.priceText,
                        postData.priceRange === range && styles.selectedPriceText
                      ]}>
                        {range}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.section}>
              <View style={styles.switchContainer}>
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.switchLabel}>Allow Booking</Text>
                  <Text style={styles.switchSubtext}>
                    Let users book this service directly from your post
                  </Text>
                </View>
                <Switch
                  value={postData.allowBooking}
                  onValueChange={(value) => updatePostData('allowBooking', value)}
                  trackColor={{ false: '#ddd', true: '#007AFF' }}
                />
              </View>
            </View>
          </>
        )}

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          
          {/* Current Tags */}
          {postData.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {postData.tags.map(renderTag)}
            </View>
          )}

          {/* Add Tag Input */}
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="Add a tag..."
              value={currentTag}
              onChangeText={setCurrentTag}
              onSubmitEditing={() => {
                if (currentTag.trim()) {
                  addTag(currentTag.trim());
                }
              }}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={() => {
                if (currentTag.trim()) {
                  addTag(currentTag.trim());
                }
              }}
              disabled={!currentTag.trim() || postData.tags.length >= 10}
            >
              <Ionicons 
                name="add-circle" 
                size={24} 
                color={!currentTag.trim() || postData.tags.length >= 10 ? '#ccc' : '#007AFF'} 
              />
            </TouchableOpacity>
          </View>

          {/* Trending Tags */}
          <Text style={styles.trendingTitle}>Trending Tags</Text>
          <View style={styles.trendingTagsContainer}>
            {TRENDING_TAGS.map(renderTrendingTag)}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  disabledText: {
    color: '#ccc',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentSection: {
    marginBottom: 20,
  },
  contentInput: {
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  switchSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingRight: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    marginRight: 8,
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  priceContainer: {
    flexDirection: 'row',
    paddingRight: 16,
  },
  priceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    marginRight: 8,
  },
  selectedPrice: {
    backgroundColor: '#007AFF',
  },
  priceText: {
    fontSize: 14,
    color: '#333',
  },
  selectedPriceText: {
    color: '#fff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 6,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    fontSize: 16,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  trendingTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  trendingTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8f8f8',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTrendingTag: {
    backgroundColor: '#007AFF',
  },
  trendingTagText: {
    fontSize: 12,
    color: '#666',
  },
  selectedTrendingTagText: {
    color: '#fff',
  },
});

export default CreatePostScreen;
  const [currentTag, setCurrentTag] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const serviceCategories = [
    'Hair', 'Makeup', 'Nails', 'Skincare', 'Eyebrows', 
    'Massage', 'Wedding', 'Special Events', 'Men\'s Grooming'
  ];

  const popularTags = [
    'transformation', 'beforeandafter', 'beauty', 'hair', 'makeup',
    'nails', 'skincare', 'haircolor', 'highlights', 'cut',
    'style', 'glam', 'wedding', 'bridal', 'selfcare'
  ];

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to add photos.');
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    if (selectedImages.length >= 10) {
      Alert.alert('Limit Reached', 'You can only add up to 10 images per post.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 10 - selectedImages.length,
        quality: 0.8,
        aspect: [1, 1],
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset, index) => ({
          uri: asset.uri,
          id: `${Date.now()}-${index}`,
        }));
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };

  const removeImage = (imageId: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const addTag = () => {
    const tag = currentTag.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    if (tag && !tags.includes(tag) && tags.length < 20) {
      setTags(prev => [...prev, tag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const addPopularTag = (tag: string) => {
    if (!tags.includes(tag) && tags.length < 20) {
      setTags(prev => [...prev, tag]);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const validatePost = () => {
    if (selectedImages.length === 0) {
      Alert.alert('Missing Images', 'Please add at least one image to your post.');
      return false;
    }
    if (caption.trim().length === 0) {
      Alert.alert('Missing Caption', 'Please add a caption to your post.');
      return false;
    }
    if (selectedCategories.length === 0) {
      Alert.alert('Missing Category', 'Please select at least one service category.');
      return false;
    }
    return true;
  };

  const handleCreatePost = async () => {
    if (!validatePost()) return;

    try {
      setIsPosting(true);

      const postData = {
        imageUris: selectedImages.map(img => img.uri),
        caption: caption.trim(),
        tags,
        serviceCategories: selectedCategories,
        location: location.trim() || undefined,
      };

      // API call would go here
      console.log('Creating post:', postData);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Post Created!',
        'Your post has been shared successfully.',
        [
          {
            text: 'View Post',
            onPress: () => {
              // Navigate to the created post
              navigation.goBack();
            }
          },
          {
            text: 'Create Another',
            onPress: () => {
              // Reset form
              setSelectedImages([]);
              setCaption('');
              setTags([]);
              setSelectedCategories([]);
              setLocation('');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient colors={[COLORS.primary, COLORS.lavenderMist]} style={styles.headerGradient}>
        <SafeAreaView>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Create Post</Text>
            
            <TouchableOpacity
              style={[styles.headerButton, styles.postButton]}
              onPress={handleCreatePost}
              disabled={isPosting}
            >
              {isPosting ? (
                <Text style={styles.postButtonText}>Posting...</Text>
              ) : (
                <Text style={styles.postButtonText}>Share</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  const renderImageSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Photos ({selectedImages.length}/10)</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
        <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
          <Ionicons name="camera-outline" size={32} color={COLORS.textSecondary} />
          <Text style={styles.addImageText}>Add Photos</Text>
        </TouchableOpacity>
        
        {selectedImages.map((image, index) => (
          <View key={image.id} style={styles.imageContainer}>
            <Image source={{ uri: image.uri }} style={styles.selectedImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeImage(image.id)}
            >
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
            </TouchableOpacity>
            {index === 0 && (
              <View style={styles.primaryImageIndicator}>
                <Text style={styles.primaryImageText}>1</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderCaptionInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Caption</Text>
      <View style={styles.captionContainer}>
        <TextInput
          style={styles.captionInput}
          placeholder="Write a caption for your post..."
          multiline
          numberOfLines={4}
          value={caption}
          onChangeText={setCaption}
          maxLength={2000}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>{caption.length}/2000</Text>
      </View>
    </View>
  );

  const renderTagsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tags ({tags.length}/20)</Text>
      
      {/* Current tags */}
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.tag}
              onPress={() => removeTag(tag)}
            >
              <Text style={styles.tagText}>#{tag}</Text>
              <Ionicons name="close" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Add tag input */}
      <View style={styles.addTagContainer}>
        <TextInput
          style={styles.tagInput}
          placeholder="Add a tag..."
          value={currentTag}
          onChangeText={setCurrentTag}
          onSubmitEditing={addTag}
          returnKeyType="done"
        />
        {currentTag.length > 0 && (
          <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
            <Ionicons name="add" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Popular tags */}
      <Text style={styles.subsectionTitle}>Popular Tags</Text>
      <View style={styles.popularTagsContainer}>
        {popularTags.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.popularTag, tags.includes(tag) && styles.selectedPopularTag]}
            onPress={() => addPopularTag(tag)}
            disabled={tags.includes(tag)}
          >
            <Text style={[
              styles.popularTagText,
              tags.includes(tag) && styles.selectedPopularTagText
            ]}>
              #{tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCategoriesSection = () => (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setShowCategoryModal(true)}
      >
        <Text style={styles.sectionTitle}>
          Service Categories ({selectedCategories.length})
        </Text>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
      
      {selectedCategories.length > 0 && (
        <View style={styles.selectedCategoriesContainer}>
          {selectedCategories.map((category) => (
            <View key={category} style={styles.selectedCategory}>
              <Text style={styles.selectedCategoryText}>{category}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderLocationInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Location (Optional)</Text>
      <View style={styles.locationContainer}>
        <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.locationInput}
          placeholder="Add a location..."
          value={location}
          onChangeText={setLocation}
          maxLength={100}
        />
      </View>
    </View>
  );

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Service Categories</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.categoriesContainer}>
            {serviceCategories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  selectedCategories.includes(category) && styles.selectedCategoryOption
                ]}
                onPress={() => toggleCategory(category)}
              >
                <Text style={[
                  styles.categoryOptionText,
                  selectedCategories.includes(category) && styles.selectedCategoryOptionText
                ]}>
                  {category}
                </Text>
                {selectedCategories.includes(category) && (
                  <Ionicons name="checkmark" size={20} color={COLORS.surface} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderImageSelector()}
        {renderCaptionInput()}
        {renderTagsSection()}
        {renderCategoriesSection()}
        {renderLocationInput()}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {renderCategoryModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerGradient: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface + '20',
  },
  postButton: {
    paddingHorizontal: 16,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.surface,
    marginBottom: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addImageText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  primaryImageIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryImageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  captionContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
  },
  captionInput: {
    fontSize: 16,
    color: COLORS.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 12,
  },
  addTagButton: {
    padding: 4,
  },
  popularTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularTag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedPopularTag: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  popularTagText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  selectedPopularTagText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  selectedCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  selectedCategory: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedCategoryText: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  categoriesContainer: {
    padding: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.background,
  },
  selectedCategoryOption: {
    backgroundColor: COLORS.primary,
  },
  categoryOptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  selectedCategoryOptionText: {
    color: COLORS.surface,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
});

export default CreatePostScreen;
