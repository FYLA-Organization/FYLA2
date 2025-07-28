import { User, ServiceProvider } from '../types';

export interface PlaceholderConfig {
  size?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
}

/**
 * Generate initials from a user's name
 */
export const generateInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return first + last || '?';
};

/**
 * Generate a consistent color based on user's name
 */
export const generateColorFromName = (firstName?: string, lastName?: string): string => {
  const name = (firstName || '') + (lastName || '');
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#FFA07A', // Light Salmon
    '#87CEEB', // Sky Blue
    '#DEB887', // Burlywood
    '#F0E68C', // Khaki
    '#FFB6C1', // Light Pink
    '#98FB98', // Pale Green
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Get profile picture URL or generate placeholder data
 */
export const getProfilePicture = (user: User | ServiceProvider | null) => {
  if (!user) {
    return {
      uri: undefined,
      initials: '?',
      backgroundColor: '#DDD',
      needsPlaceholder: true
    };
  }

  // Handle User type
  if ('firstName' in user) {
    const firstName = user.firstName;
    const lastName = user.lastName;
    const profilePictureUrl = user.profilePictureUrl;

    return {
      uri: profilePictureUrl,
      initials: generateInitials(firstName, lastName),
      backgroundColor: generateColorFromName(firstName, lastName),
      needsPlaceholder: !profilePictureUrl
    };
  }

  // Handle ServiceProvider type
  const businessName = user.businessName || 'Provider';
  const nameParts = businessName.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts[1] || '';
  const profilePictureUrl = user.profilePictureUrl;

  return {
    uri: profilePictureUrl,
    initials: generateInitials(firstName, lastName),
    backgroundColor: generateColorFromName(firstName, lastName),
    needsPlaceholder: !profilePictureUrl
  };
};

/**
 * Generate a placeholder image URL using an external service
 */
export const generatePlaceholderUrl = (
  initials: string, 
  backgroundColor: string = '#4ECDC4',
  textColor: string = 'white',
  size: number = 150
): string => {
  // Remove # from color codes for URL
  const bgColor = backgroundColor.replace('#', '');
  const txtColor = textColor.replace('#', '');
  
  // Using ui-avatars.com service for generating placeholder images
  return `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=${txtColor}&size=${size}&bold=true&format=png`;
};

/**
 * Get complete profile picture data with fallback
 */
export const getProfilePictureWithFallback = (
  user: User | ServiceProvider | null,
  size: number = 150
) => {
  const profileData = getProfilePicture(user);
  
  return {
    ...profileData,
    fallbackUri: generatePlaceholderUrl(
      profileData.initials,
      profileData.backgroundColor,
      'white',
      size
    )
  };
};
