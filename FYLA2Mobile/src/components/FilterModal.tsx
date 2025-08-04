import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
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

export interface FilterOptions {
  categories: string[];
  priceRange: { min: number; max: number };
  rating: number;
  distance: number;
  availability: string;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  initialFilters?: Partial<FilterOptions>;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  initialFilters = {},
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters.categories || []
  );
  const [priceRange, setPriceRange] = useState(
    initialFilters.priceRange || { min: 0, max: 500 }
  );
  const [selectedRating, setSelectedRating] = useState(initialFilters.rating || 0);
  const [selectedDistance, setSelectedDistance] = useState(initialFilters.distance || 25);
  const [selectedAvailability, setSelectedAvailability] = useState(
    initialFilters.availability || ''
  );

  const categories = [
    'Hair Care',
    'Nail Care',
    'Skincare',
    'Makeup',
    'Massage',
    'Waxing',
    'Eyebrows',
    'Eyelashes',
  ];

  const priceRanges = [
    { label: 'Any Price', min: 0, max: 1000 },
    { label: '$0 - $50', min: 0, max: 50 },
    { label: '$50 - $100', min: 50, max: 100 },
    { label: '$100 - $200', min: 100, max: 200 },
    { label: '$200+', min: 200, max: 1000 },
  ];

  const distances = [5, 10, 15, 25, 50];
  const availabilityOptions = ['Today', 'Tomorrow', 'This Week', 'This Month'];

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleApplyFilters = () => {
    const filters: FilterOptions = {
      categories: selectedCategories,
      priceRange,
      rating: selectedRating,
      distance: selectedDistance,
      availability: selectedAvailability,
    };
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setPriceRange({ min: 0, max: 500 });
    setSelectedRating(0);
    setSelectedDistance(25);
    setSelectedAvailability('');
  };

  const renderCategoryChip = (category: string) => {
    const isSelected = selectedCategories.includes(category);
    return (
      <TouchableOpacity
        key={category}
        style={[styles.chip, isSelected && styles.selectedChip]}
        onPress={() => handleCategoryToggle(category)}
      >
        {isSelected ? (
          <LinearGradient
            colors={[COLORS.primary, COLORS.lavenderMist]}
            style={styles.chipGradient}
          >
            <Text style={styles.selectedChipText}>{category}</Text>
          </LinearGradient>
        ) : (
          <Text style={styles.chipText}>{category}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderPriceRange = (range: { label: string; min: number; max: number }) => {
    const isSelected = priceRange.min === range.min && priceRange.max === range.max;
    return (
      <TouchableOpacity
        key={range.label}
        style={[styles.optionItem, isSelected && styles.selectedOption]}
        onPress={() => setPriceRange({ min: range.min, max: range.max })}
      >
        <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
          {range.label}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    );
  };

  const renderRatingOption = (rating: number) => {
    const isSelected = selectedRating === rating;
    return (
      <TouchableOpacity
        key={rating}
        style={[styles.ratingOption, isSelected && styles.selectedOption]}
        onPress={() => setSelectedRating(rating)}
      >
        <View style={styles.ratingStars}>
          {[...Array(5)].map((_, i) => (
            <Ionicons
              key={i}
              name={i < rating ? 'star' : 'star-outline'}
              size={16}
              color={i < rating ? COLORS.accent : COLORS.textSecondary}
            />
          ))}
          <Text style={styles.ratingText}>& up</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    );
  };

  const renderDistanceOption = (distance: number) => {
    const isSelected = selectedDistance === distance;
    return (
      <TouchableOpacity
        key={distance}
        style={[styles.optionItem, isSelected && styles.selectedOption]}
        onPress={() => setSelectedDistance(distance)}
      >
        <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
          {distance} miles
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    );
  };

  const renderAvailabilityOption = (option: string) => {
    const isSelected = selectedAvailability === option;
    return (
      <TouchableOpacity
        key={option}
        style={[styles.optionItem, isSelected && styles.selectedOption]}
        onPress={() => setSelectedAvailability(option)}
      >
        <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
          {option}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        
        {/* Header */}
        <LinearGradient colors={[COLORS.primary, COLORS.lavenderMist]} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.surface} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filters</Text>
            <TouchableOpacity style={styles.headerButton} onPress={handleClearFilters}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.chipsContainer}>
              {categories.map(renderCategoryChip)}
            </View>
          </View>

          {/* Price Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            <View style={styles.optionsContainer}>
              {priceRanges.map(renderPriceRange)}
            </View>
          </View>

          {/* Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Minimum Rating</Text>
            <View style={styles.optionsContainer}>
              {[4, 3, 2, 1].map(renderRatingOption)}
            </View>
          </View>

          {/* Distance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distance</Text>
            <View style={styles.optionsContainer}>
              {distances.map(renderDistanceOption)}
            </View>
          </View>

          {/* Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.optionsContainer}>
              {availabilityOptions.map(renderAvailabilityOption)}
            </View>
          </View>
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.lavenderMist]}
              style={styles.applyGradient}
            >
              <Text style={styles.applyText}>Apply Filters</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  clearText: {
    fontSize: 16,
    color: COLORS.surface,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  selectedChip: {
    borderColor: COLORS.primary,
  },
  chipGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedChipText: {
    fontSize: 14,
    color: COLORS.surface,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  optionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  applyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  applyGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
});

export default FilterModal;
