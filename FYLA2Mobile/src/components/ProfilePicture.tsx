import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { User, ServiceProvider } from '../types';
import { getProfilePictureWithFallback } from '../utils/profileUtils';

interface ProfilePictureProps {
  user: User | ServiceProvider | null;
  size?: number;
  style?: any;
  showInitials?: boolean;
}

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
  user,
  size = 50,
  style,
  showInitials = true
}) => {
  const profileData = getProfilePictureWithFallback(user, size);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: profileData.backgroundColor,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
  };

  const textStyle = {
    fontSize: size * 0.4,
    fontWeight: 'bold' as const,
    color: 'white',
  };

  // If user has a profile picture, try to display it
  if (profileData.uri) {
    return (
      <View style={[containerStyle, style]}>
        <Image
          source={{ uri: profileData.uri }}
          style={{ width: size, height: size }}
          onError={() => {
            // If the image fails to load, we'll fall back to the placeholder
            console.log('Profile image failed to load, using placeholder');
          }}
        />
        {/* Fallback initials overlay in case image fails */}
        <View style={[StyleSheet.absoluteFill, containerStyle, { backgroundColor: 'transparent' }]}>
          <Image
            source={{ uri: profileData.fallbackUri }}
            style={{ width: size, height: size }}
          />
        </View>
      </View>
    );
  }

  // If no profile picture or showInitials is false, show placeholder
  if (showInitials) {
    return (
      <View style={[containerStyle, style]}>
        <Image
          source={{ uri: profileData.fallbackUri }}
          style={{ width: size, height: size }}
        />
      </View>
    );
  }

  // Simple colored circle with initials
  return (
    <View style={[containerStyle, style]}>
      <Text style={textStyle}>{profileData.initials}</Text>
    </View>
  );
};

export default ProfilePicture;
