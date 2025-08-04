import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

const { width } = Dimensions.get('window');

interface ImageUploadProps {
  onImagesSelected: (images: string[]) => void;
  maxImages?: number;
  existingImages?: string[];
  style?: any;
}

interface ImageOption {
  uri: string;
  selected: boolean;
}

const ImageUploadComponent: React.FC<ImageUploadProps> = ({
  onImagesSelected,
  maxImages = 10,
  existingImages = [],
  style,
}) => {
  const [selectedImages, setSelectedImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [galleryImages, setGalleryImages] = useState<ImageOption[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and media library permissions are needed to upload images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const showActionSheet = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: takePicture },
        { text: 'Gallery', onPress: pickFromGallery },
        { text: 'Browse Gallery', onPress: showGalleryPicker },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const takePicture = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: maxImages - selectedImages.length,
      });

      if (!result.canceled) {
        for (const asset of result.assets) {
          await uploadImage(asset.uri);
        }
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to pick images from gallery');
    }
  };

  const showGalleryPicker = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLoadingGallery(true);
    try {
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 100,
        sortBy: 'creationTime',
      });

      const imageOptions: ImageOption[] = assets.map(asset => ({
        uri: asset.uri,
        selected: false,
      }));

      setGalleryImages(imageOptions);
      setShowImagePicker(true);
    } catch (error) {
      console.error('Error loading gallery:', error);
      Alert.alert('Error', 'Failed to load gallery images');
    } finally {
      setLoadingGallery(false);
    }
  };

  const uploadImage = async (uri: string) => {
    if (selectedImages.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxImages} images`);
      return;
    }

    setUploading(true);
    try {
      // Create FormData for upload
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'image.jpg';
      const fileType = filename.split('.').pop()?.toLowerCase() || 'jpg';
      
      formData.append('image', {
        uri,
        name: filename,
        type: `image/${fileType}`,
      } as any);

      // Upload to server (replace with your API endpoint)
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/upload/image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const newImages = [...selectedImages, result.url];
        setSelectedImages(newImages);
        onImagesSelected(newImages);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      // For demo purposes, just use the local URI
      const newImages = [...selectedImages, uri];
      setSelectedImages(newImages);
      onImagesSelected(newImages);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    onImagesSelected(newImages);
  };

  const toggleGalleryImage = (uri: string) => {
    setGalleryImages(prev =>
      prev.map(img =>
        img.uri === uri ? { ...img, selected: !img.selected } : img
      )
    );
  };

  const confirmGallerySelection = async () => {
    const selectedUris = galleryImages.filter(img => img.selected).map(img => img.uri);
    
    if (selectedUris.length + selectedImages.length > maxImages) {
      Alert.alert('Too Many Images', `You can only select up to ${maxImages} images total`);
      return;
    }

    setShowImagePicker(false);
    setUploading(true);

    try {
      for (const uri of selectedUris) {
        await uploadImage(uri);
      }
    } finally {
      setUploading(false);
    }
  };

  const renderSelectedImage = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.selectedImageContainer}>
      <Image source={{ uri: item }} style={styles.selectedImage} />
      <TouchableOpacity
        style={styles.removeImageButton}
        onPress={() => removeImage(index)}
      >
        <Ionicons name="close-circle" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  const renderGalleryImage = ({ item }: { item: ImageOption }) => (
    <TouchableOpacity
      style={[styles.galleryImageContainer, item.selected && styles.selectedGalleryImage]}
      onPress={() => toggleGalleryImage(item.uri)}
    >
      <Image source={{ uri: item.uri }} style={styles.galleryImage} />
      {item.selected && (
        <View style={styles.galleryImageOverlay}>
          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Selected Images */}
      {selectedImages.length > 0 && (
        <View style={styles.selectedImagesSection}>
          <Text style={styles.sectionTitle}>Selected Images ({selectedImages.length}/{maxImages})</Text>
          <FlatList
            data={selectedImages}
            renderItem={renderSelectedImage}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedImagesList}
          />
        </View>
      )}

      {/* Add Image Button */}
      <TouchableOpacity
        style={[
          styles.addImageButton,
          selectedImages.length >= maxImages && styles.disabledButton
        ]}
        onPress={showActionSheet}
        disabled={selectedImages.length >= maxImages || uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#007AFF" />
        ) : (
          <>
            <Ionicons 
              name="camera-outline" 
              size={32} 
              color={selectedImages.length >= maxImages ? '#ccc' : '#007AFF'} 
            />
            <Text style={[
              styles.addImageText,
              selectedImages.length >= maxImages && styles.disabledText
            ]}>
              {selectedImages.length === 0 ? 'Add Photos' : 'Add More Photos'}
            </Text>
            <Text style={styles.addImageSubtext}>
              Tap to take a photo or choose from gallery
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Gallery Picker Modal */}
      <Modal
        visible={showImagePicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.galleryModal}>
          <View style={styles.galleryHeader}>
            <TouchableOpacity onPress={() => setShowImagePicker(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.galleryTitle}>Select Images</Text>
            <TouchableOpacity onPress={confirmGallerySelection}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {loadingGallery ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading gallery...</Text>
            </View>
          ) : (
            <FlatList
              data={galleryImages}
              renderItem={renderGalleryImage}
              numColumns={3}
              contentContainerStyle={styles.galleryGrid}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  selectedImagesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  selectedImagesList: {
    paddingRight: 16,
  },
  selectedImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addImageButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  disabledButton: {
    borderColor: '#ccc',
  },
  addImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
  },
  disabledText: {
    color: '#ccc',
  },
  addImageSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  galleryModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  galleryHeader: {
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
  galleryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  doneText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  galleryGrid: {
    padding: 2,
  },
  galleryImageContainer: {
    width: (width - 8) / 3,
    height: (width - 8) / 3,
    margin: 1,
    position: 'relative',
  },
  selectedGalleryImage: {
    opacity: 0.7,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryImageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
});

export default ImageUploadComponent;
