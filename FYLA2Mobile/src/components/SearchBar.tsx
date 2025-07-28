import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#5A4FCF',      // Royal Indigo
  accent: '#F5C451',        // Soft Gold
  background: '#FAFAFA',    // Light Background
  surface: '#FFFFFF',       // Card Backgrounds
  textPrimary: '#1A1A1A',   // Dark Text
  textSecondary: '#6B6B6B', // Secondary Text
  lavenderMist: '#AFAAFF',  // Lavender Mist
  border: '#E8E8E8',        // Subtle borders
  shadow: '#000000',        // Shadow color
  cardBackground: '#F8F9FA', // Card backgrounds
};

interface SearchBarProps extends TextInputProps {
  onFilterPress?: () => void;
  showFilter?: boolean;
  containerStyle?: ViewStyle;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onFilterPress,
  showFilter = false,
  containerStyle,
  ...textInputProps
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services, providers..."
            placeholderTextColor={COLORS.textSecondary}
            {...textInputProps}
          />
        </View>
        
        {showFilter && (
          <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.lavenderMist]}
              style={styles.filterGradient}
            >
              <Ionicons name="options-outline" size={20} color={COLORS.surface} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  filterButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  filterGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchBar;
