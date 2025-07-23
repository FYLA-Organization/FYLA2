import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import { User } from '../types';

const UserSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading users for UserSelectionScreen...');
      
      // For now, we'll load service providers since they're the most likely to be messaged
      // In a real app, you might want to load all users or have different categories
      const response = await ApiService.getServiceProviders(1, 50, {});
      console.log('📋 Raw API response:', response);
      
      const userList: User[] = response.data.map((provider: any) => {
        // Parse businessName to get firstName and lastName
        const nameParts = (provider.businessName || 'Unknown User').split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || 'User';
        
        console.log(`👤 Processing provider: ${provider.businessName} -> ${firstName} ${lastName}`);
        
        return {
          id: provider.id,
          firstName: firstName,
          lastName: lastName,
          email: '',
          profilePictureUrl: provider.profilePictureUrl,
          isServiceProvider: true,
          bio: provider.businessDescription || 'No description available',
          dateOfBirth: '',
          createdAt: ''
        };
      });
      
      console.log(`✅ Processed ${userList.length} users for selection`);
      setUsers(userList);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.bio && user.bio.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredUsers(filtered);
  };

  const handleSelectUser = (user: User) => {
    navigation.navigate('ChatScreen' as never, {
      userId: user.id,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePictureUrl: user.profilePictureUrl
      }
    } as never);
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => handleSelectUser(item)}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.profilePictureUrl ? (
            <Image source={{ uri: item.profilePictureUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(item.firstName || 'U').charAt(0)}{(item.lastName || 'U').charAt(0)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {(item.firstName || 'Unknown')} {(item.lastName || 'User')}
          </Text>
          {item.bio && (
            <Text style={styles.userBio} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
          {item.isServiceProvider && (
            <Text style={styles.providerLabel}>Service Provider</Text>
          )}
        </View>
      </View>
      <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No users found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'Try adjusting your search terms.' : 'No users available to message.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Message</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          style={styles.userList}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  userList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userBio: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  providerLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default UserSelectionScreen;
