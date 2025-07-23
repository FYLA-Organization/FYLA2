import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatRoom, RootStackParamList } from '../../types';
import ApiService from '../../services/api';

type MessagesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface ChatRoomWithUser extends ChatRoom {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
}

const MessagesScreen: React.FC = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoomWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation<MessagesScreenNavigationProp>();

  useFocusEffect(
    React.useCallback(() => {
      loadChatRooms();
    }, [])
  );

  const loadChatRooms = async () => {
    try {
      setIsLoading(true);
      const rooms = await ApiService.getChatRooms();
      setChatRooms(rooms as ChatRoomWithUser[]);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChatRooms();
    setRefreshing(false);
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes === 0 ? 'now' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const renderChatRoom = ({ item }: { item: ChatRoomWithUser }) => (
    <TouchableOpacity
      style={styles.chatRoomCard}
      onPress={() =>
        navigation.navigate('Chat', {
          userId: item.user.id,
          userName: `${item.user.firstName} ${item.user.lastName}`,
          userImage: item.user.profilePictureUrl,
        })
      }
    >
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri: item.user.profilePictureUrl || 'https://via.placeholder.com/50',
          }}
          style={styles.avatar}
        />
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.userName}>
            {item.user.firstName} {item.user.lastName}
          </Text>
          {item.lastMessage && (
            <Text style={styles.timestamp}>
              {formatLastMessageTime(item.lastMessage.timestamp)}
            </Text>
          )}
        </View>

        {item.lastMessage && (
          <Text style={[
            styles.lastMessage,
            item.unreadCount > 0 && styles.unreadMessage
          ]} numberOfLines={1}>
            {item.lastMessage.content}
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#FF6B6B', '#FFE66D']} style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#FF6B6B', '#FFE66D']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="create-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Chat Rooms List */}
      <FlatList
        data={chatRooms}
        renderItem={renderChatRoom}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation with a service provider
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerAction: {
    padding: 8,
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    paddingBottom: 20,
  },
  chatRoomCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MessagesScreen;
