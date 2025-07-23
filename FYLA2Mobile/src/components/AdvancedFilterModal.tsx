import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { SearchFilters } from '../types';

interface AdvancedFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApplyFilters: (filters: SearchFilters) => void;
  onSaveFilters: (filters: SearchFilters) => void;
  onResetFilters: () => void;
}

const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
  onSaveFilters,
  onResetFilters,
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const categories = [
    'All', 'Hair', 'Nails', 'Makeup', 'Massage', 'Skin Care', 'Fitness', 'Wellness'
  ];

  const distanceOptions = ['1 mi', '5 mi', '10 mi', '25 mi', '50 mi'];
  
  const sortOptions = [
    { value: 'rating', label: 'Rating (Highest)' },
    { value: 'price', label: 'Price (Lowest)' },
    { value: 'distance', label: 'Distance' },
    { value: 'availability', label: 'Availability' },
    { value: 'name', label: 'Name (A-Z)' },
  ];

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleSave = () => {
    Alert.prompt(
      'Save Filter Preset',
      'Give this filter combination a name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (name) => {
            if (name?.trim()) {
              onSaveFilters({ ...localFilters });
              Alert.alert('Success', `Filter preset "${name}" saved!`);
            }
          }
        }
      ],
      'plain-text',
      'My Custom Filter'
    );
  };

  const handleReset = () => {
    setLocalFilters({});
    onResetFilters();
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Advanced Filters</Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Category Filter */}
          {renderSection('Category', (
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    (localFilters.category === category || (!localFilters.category && category === 'All')) && styles.selectedChip
                  ]}
                  onPress={() => updateFilter('category', category === 'All' ? undefined : category)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    (localFilters.category === category || (!localFilters.category && category === 'All')) && styles.selectedChipText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Price Range Filter */}
          {renderSection('Price Range', (
            <View style={styles.priceContainer}>
              <View style={styles.priceLabels}>
                <Text style={styles.priceLabel}>Min: ${localFilters.priceMin || 0}</Text>
                <Text style={styles.priceLabel}>Max: ${localFilters.priceMax || 500}</Text>
              </View>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Minimum Price</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={500}
                  step={10}
                  value={localFilters.priceMin || 0}
                  onValueChange={(value) => updateFilter('priceMin', value)}
                  minimumTrackTintColor="#FF6B6B"
                  maximumTrackTintColor="#ddd"
                  thumbStyle={styles.sliderThumb}
                />
              </View>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Maximum Price</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={localFilters.priceMin || 0}
                  maximumValue={500}
                  step={10}
                  value={localFilters.priceMax || 500}
                  onValueChange={(value) => updateFilter('priceMax', value)}
                  minimumTrackTintColor="#FF6B6B"
                  maximumTrackTintColor="#ddd"
                  thumbStyle={styles.sliderThumb}
                />
              </View>
            </View>
          ))}

          {/* Rating Filter */}
          {renderSection('Minimum Rating', (
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingOption,
                    localFilters.rating === rating && styles.selectedRatingOption
                  ]}
                  onPress={() => updateFilter('rating', localFilters.rating === rating ? undefined : rating)}
                >
                  <View style={styles.ratingStars}>
                    {[...Array(5)].map((_, index) => (
                      <Ionicons
                        key={index}
                        name={index < rating ? "star" : "star-outline"}
                        size={16}
                        color={index < rating ? "#FFD700" : "#ddd"}
                      />
                    ))}
                  </View>
                  <Text style={[
                    styles.ratingText,
                    localFilters.rating === rating && styles.selectedRatingText
                  ]}>
                    {rating}+ stars
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Distance Filter */}
          {renderSection('Distance', (
            <View style={styles.distanceContainer}>
              {distanceOptions.map((distance) => (
                <TouchableOpacity
                  key={distance}
                  style={[
                    styles.distanceOption,
                    localFilters.distance === distance && styles.selectedDistanceOption
                  ]}
                  onPress={() => updateFilter('distance', localFilters.distance === distance ? undefined : distance)}
                >
                  <Text style={[
                    styles.distanceText,
                    localFilters.distance === distance && styles.selectedDistanceText
                  ]}>
                    {distance}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Availability Filters */}
          {renderSection('Availability', (
            <View style={styles.availabilityContainer}>
              <View style={styles.availabilityOption}>
                <Text style={styles.availabilityText}>Available Today</Text>
                <Switch
                  value={localFilters.availableToday || false}
                  onValueChange={(value) => updateFilter('availableToday', value)}
                  trackColor={{ false: '#ddd', true: '#FF6B6B' }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.availabilityOption}>
                <Text style={styles.availabilityText}>Available This Week</Text>
                <Switch
                  value={localFilters.availableThisWeek || false}
                  onValueChange={(value) => updateFilter('availableThisWeek', value)}
                  trackColor={{ false: '#ddd', true: '#FF6B6B' }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          ))}

          {/* Sort Options */}
          {renderSection('Sort By', (
            <View style={styles.sortContainer}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    localFilters.sortBy === option.value && styles.selectedSortOption
                  ]}
                  onPress={() => updateFilter('sortBy', localFilters.sortBy === option.value ? undefined : option.value as any)}
                >
                  <Text style={[
                    styles.sortText,
                    localFilters.sortBy === option.value && styles.selectedSortText
                  ]}>
                    {option.label}
                  </Text>
                  {localFilters.sortBy === option.value && (
                    <Ionicons name="checkmark" size={16} color="#FF6B6B" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="bookmark-outline" size={20} color="#666" />
            <Text style={styles.saveButtonText}>Save Preset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resetButton: {
    padding: 8,
  },
  resetText: {
    color: '#FF6B6B',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedChip: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  categoryChipText: {
    color: '#666',
    fontSize: 14,
  },
  selectedChipText: {
    color: 'white',
  },
  priceContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  priceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#FF6B6B',
  },
  ratingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedRatingOption: {
    backgroundColor: '#fff5f5',
  },
  ratingStars: {
    flexDirection: 'row',
    marginRight: 12,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  selectedRatingText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  distanceContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  distanceOption: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedDistanceOption: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
  },
  selectedDistanceText: {
    color: 'white',
  },
  availabilityContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  availabilityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  availabilityText: {
    fontSize: 14,
    color: '#333',
  },
  sortContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedSortOption: {
    backgroundColor: '#fff5f5',
  },
  sortText: {
    fontSize: 14,
    color: '#666',
  },
  selectedSortText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 8,
  },
  saveButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AdvancedFilterModal;
