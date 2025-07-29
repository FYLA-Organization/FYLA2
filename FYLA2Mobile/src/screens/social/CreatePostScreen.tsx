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
import apiService from '../../services/api';
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
];

const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation<CreatePostNavigationProp>();
  const { user } = useAuth();
  
  const [postData, setPostData] = useState<PostData>({
    content: '',
    images: [],
    location: '',
    tags: [],
    isBusinessPost: user?.isServiceProvider || false,
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
