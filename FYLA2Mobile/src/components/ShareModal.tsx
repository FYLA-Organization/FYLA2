import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postContent?: string;
  userName?: string;
}

const COLORS = {
  background: '#F0F0F0',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#C0C0C0',
  borderLight: '#E0E0E0',
  primary: '#2B7CE6',
  accent: '#E6283A',
};

const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  postId,
  postContent,
  userName,
}) => {
  const handleNativeShare = async () => {
    try {
      const shareContent = `Check out this amazing post${userName ? ` by ${userName}` : ''}!\n\n${postContent || 'Beautiful work!'}\n\nShared via FYLA`;
      
      const result = await Share.share({
        message: shareContent,
        title: 'FYLA Post',
      });

      if (result.action === Share.sharedAction) {
        console.log('✅ Post shared successfully');
        onClose();
      }
    } catch (error) {
      console.error('❌ Error sharing post:', error);
      Alert.alert('Error', 'Failed to share post');
    }
  };

  const handleCopyLink = async () => {
    try {
      // In a real app, this would be the actual post URL
      const postUrl = `https://fyla.app/posts/${postId}`;
      
      // Copy to clipboard (you'd need expo-clipboard for this)
      console.log('📋 Copying link:', postUrl);
      Alert.alert('Link Copied!', 'Post link has been copied to clipboard');
      onClose();
    } catch (error) {
      console.error('❌ Error copying link:', error);
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const handleSendToFriend = () => {
    Alert.alert('Coming Soon!', 'Send to friend feature will be available in the next update');
    onClose();
  };

  const handleReportPost = () => {
    Alert.alert(
      'Report Post',
      'Why are you reporting this post?',
      [
        { text: 'Inappropriate Content', onPress: () => console.log('Reported: Inappropriate') },
        { text: 'Spam', onPress: () => console.log('Reported: Spam') },
        { text: 'Harassment', onPress: () => console.log('Reported: Harassment') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
    onClose();
  };

  const shareOptions = [
    {
      icon: 'share-outline',
      title: 'Share via...',
      subtitle: 'Share with other apps',
      onPress: handleNativeShare,
      color: COLORS.primary,
    },
    {
      icon: 'link-outline',
      title: 'Copy Link',
      subtitle: 'Copy post link to clipboard',
      onPress: handleCopyLink,
      color: COLORS.primary,
    },
    {
      icon: 'paper-plane-outline',
      title: 'Send to Friend',
      subtitle: 'Share with FYLA users',
      onPress: handleSendToFriend,
      color: COLORS.primary,
    },
    {
      icon: 'flag-outline',
      title: 'Report Post',
      subtitle: 'Report inappropriate content',
      onPress: handleReportPost,
      color: COLORS.accent,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Share Post</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            {shareOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.option}
                onPress={option.onPress}
              >
                <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                  <Ionicons name={option.icon as any} size={20} color={COLORS.surface} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});

export default ShareModal;
