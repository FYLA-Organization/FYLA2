import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { ServiceProvider } from '../../types';
import ApiService from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface Story {
  id: string;
  provider: ServiceProvider;
  imageUrl: string;
  isViewed: boolean;
  timestamp: string;
}

const StorySection: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setIsLoading(true);
      // For now, we'll use sample data. In real implementation, this would be an API call
      const sampleStories: Story[] = [
        {
          id: '1',
          provider: {
            id: '1',
            userId: '1',
            businessName: 'Bella Hair Studio',
            profilePictureUrl: 'https://picsum.photos/60/60?random=1',
            averageRating: 4.8,
            totalReviews: 120,
            isVerified: true,
            followersCount: 850,
            followingCount: 230,
            postsCount: 45,
            isFollowedByCurrentUser: true,
            isBookmarkedByCurrentUser: false,
          },
          imageUrl: 'https://picsum.photos/300/400?random=1',
          isViewed: false,
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          provider: {
            id: '2',
            userId: '2',
            businessName: 'Nails by Sarah',
            profilePictureUrl: 'https://picsum.photos/60/60?random=2',
            averageRating: 4.9,
            totalReviews: 95,
            isVerified: true,
            followersCount: 650,
            followingCount: 180,
            postsCount: 38,
            isFollowedByCurrentUser: true,
            isBookmarkedByCurrentUser: false,
          },
          imageUrl: 'https://picsum.photos/300/400?random=2',
          isViewed: true,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          provider: {
            id: '3',
            userId: '3',
            businessName: 'Glow Makeup',
            profilePictureUrl: 'https://picsum.photos/60/60?random=3',
            averageRating: 4.7,
            totalReviews: 78,
            isVerified: false,
            followersCount: 420,
            followingCount: 145,
            postsCount: 28,
            isFollowedByCurrentUser: false,
            isBookmarkedByCurrentUser: false,
          },
          imageUrl: 'https://picsum.photos/300/400?random=3',
          isViewed: false,
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
      ];
      setStories(sampleStories);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoryPress = (story: Story) => {
    // Mark story as viewed and navigate to story viewer
    setStories(prevStories =>
      prevStories.map(s =>
        s.id === story.id ? { ...s, isViewed: true } : s
      )
    );
    // TODO: Navigate to story viewer
    console.log('Opening story:', story.id);
  };

  const handleAddStoryPress = () => {
    // TODO: Navigate to create story screen
    console.log('Add story pressed');
  };

  const renderStoryItem = (story: Story) => (
    <TouchableOpacity
      key={story.id}
      style={styles.storyItem}
      onPress={() => handleStoryPress(story)}
    >
      <LinearGradient
        colors={story.isViewed ? ['#ddd', '#ddd'] : ['#FF6B6B', '#4ECDC4', '#FFE66D']}
        style={styles.storyGradientBorder}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.storyImageContainer}>
          <Image
            source={{ uri: story.provider.profilePictureUrl || 'https://via.placeholder.com/60x60?text=👤' }}
            style={styles.storyImage}
            defaultSource={{ uri: 'https://via.placeholder.com/60x60?text=👤' }}
          />
          {story.provider.isVerified && (
            <View style={styles.verificationBadge}>
              <Ionicons name="checkmark" size={10} color="white" />
            </View>
          )}
        </View>
      </LinearGradient>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {story.provider.businessName}
      </Text>
    </TouchableOpacity>
  );

  const renderAddStoryItem = () => {
    if (!user?.isServiceProvider) return null;

    return (
      <TouchableOpacity
        style={styles.storyItem}
        onPress={handleAddStoryPress}
      >
        <View style={styles.addStoryContainer}>
          <View style={styles.addStoryImageContainer}>
            <Image
              source={{ uri: user.profilePictureUrl || 'https://via.placeholder.com/60x60?text=👤' }}
              style={styles.storyImage}
            />
            <View style={styles.addStoryButton}>
              <Ionicons name="add" size={16} color="white" />
            </View>
          </View>
        </View>
        <Text style={styles.storyUsername} numberOfLines={1}>
          Your Story
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingStory} />
        <View style={styles.loadingStory} />
        <View style={styles.loadingStory} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContainer}
      >
        {renderAddStoryItem()}
        {stories.map(renderStoryItem)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  storiesContainer: {
    paddingHorizontal: 15,
    gap: 15,
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
  },
  storyGradientBorder: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  storyImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  verificationBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  storyUsername: {
    marginTop: 6,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  addStoryContainer: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStoryImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStoryButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  loadingContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 15,
    gap: 15,
  },
  loadingStory: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#f0f0f0',
  },
});

export default StorySection;
