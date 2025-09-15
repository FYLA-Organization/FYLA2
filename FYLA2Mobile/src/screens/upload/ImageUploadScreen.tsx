import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import apiService from '../../services/apiService';
import FeatureGatingService from '../../services/featureGatingService';
import Modal from 'react-native-modal';

const { width } = Dimensions.get('window');

const ImageUploadScreen = ({ navigation, route }) => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [category] = useState(route.params?.category || 'general');

  useEffect(() => {
    loadUserImages();
  }, []);

  const loadUserImages = async () => {
    try {
      const userId = await apiService.getCurrentUserId();
      const response = await apiService.getUserFiles(userId, category);
      setUploadedImages(response.data || []);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleImagePicker = async () => {
    // Check if user can upload photos for this service
    const { serviceId } = route.params || {};
    if (serviceId) {
      const canUpload = await FeatureGatingService.canAddPhoto(serviceId);
      
      if (!canUpload.allowed) {
        Alert.alert(
          'Photo Limit Reached',
          canUpload.message + '\n\nWould you like to upgrade your plan?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Upgrade', 
              onPress: () => navigation.navigate('SubscriptionPlans')
            }
          ]
        );
        return;
      }
    }
    
    setShowOptionsModal(true);
  };

  const openCamera = async () => {
    setShowOptionsModal(false);
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    const options = {
      mediaType: 'photo',
      includeBase64: true,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchCamera(options, handleImageResponse);
  };

  const openGallery = () => {
    setShowOptionsModal(false);
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
      selectionLimit: 5, // Allow multiple selection
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    if (response.assets && response.assets.length > 0) {
      const images = response.assets.map(asset => ({
        uri: asset.uri,
        base64: asset.base64,
        fileName: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      }));
      
      if (images.length === 1) {
        uploadSingleImage(images[0]);
      } else {
        uploadMultipleImages(images);
      }
    }
  };

  const uploadSingleImage = async (image) => {
    try {
      setLoading(true);
      const uploadData = {
        base64Data: image.base64,
        fileName: image.fileName,
        contentType: image.type,
        category: category,
      };

      const response = await apiService.uploadImage(uploadData);
      
      if (response.data) {
        setUploadedImages(prev => [response.data, ...prev]);
        Alert.alert('Success', 'Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadMultipleImages = async (images) => {
    try {
      setLoading(true);
      const uploadData = {
        images: images.map(img => ({
          base64Data: img.base64,
          fileName: img.fileName,
          contentType: img.type,
        })),
        category: category,
      };

      const response = await apiService.bulkUploadImages(uploadData);
      
      if (response.data && response.data.length > 0) {
        setUploadedImages(prev => [...response.data, ...prev]);
        Alert.alert('Success', `${response.data.length} images uploaded successfully!`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      Alert.alert('Error', 'Failed to upload images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const deleteSelectedImages = () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Selection', 'Please select images to delete.');
      return;
    }

    Alert.alert(
      'Delete Images',
      `Are you sure you want to delete ${selectedImages.length} selected image(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      const deletePromises = selectedImages.map(imageId => 
        apiService.deleteFile(imageId)
      );
      
      await Promise.all(deletePromises);
      
      setUploadedImages(prev => 
        prev.filter(img => !selectedImages.includes(img.id))
      );
      setSelectedImages([]);
      
      Alert.alert('Success', 'Selected images deleted successfully!');
    } catch (error) {
      console.error('Error deleting images:', error);
      Alert.alert('Error', 'Failed to delete some images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const optimizeImage = async (imageId) => {
    try {
      setLoading(true);
      const response = await apiService.optimizeImage(imageId);
      
      if (response.data) {
        setUploadedImages(prev => [response.data, ...prev]);
        Alert.alert('Success', 'Optimized version created successfully!');
      }
    } catch (error) {
      console.error('Error optimizing image:', error);
      Alert.alert('Error', 'Failed to optimize image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderImageItem = (image) => (
    <TouchableOpacity
      key={image.id}
      style={[
        styles.imageContainer,
        selectedImages.includes(image.id) && styles.imageSelected,
      ]}
      onPress={() => toggleImageSelection(image.id)}
      onLongPress={() => {
        Alert.alert(
          'Image Options',
          'What would you like to do with this image?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Optimize', onPress: () => optimizeImage(image.id) },
            { text: 'Delete', style: 'destructive', onPress: () => {
              setSelectedImages([image.id]);
              deleteSelectedImages();
            }},
          ]
        );
      }}
    >
      <Image source={{ uri: image.thumbnailUrl || image.url }} style={styles.image} />
      {selectedImages.includes(image.id) && (
        <View style={styles.selectedOverlay}>
          <Icon name="check-circle" size={24} color="#4CAF50" />
        </View>
      )}
      <View style={styles.imageInfo}>
        <Text style={styles.imageName} numberOfLines={1}>
          {image.fileName}
        </Text>
        <Text style={styles.imageSize}>
          {(image.size / 1024).toFixed(1)} KB
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Image Gallery</Text>
        <View style={styles.headerActions}>
          {selectedImages.length > 0 && (
            <TouchableOpacity 
              onPress={deleteSelectedImages}
              style={styles.headerButton}
            >
              <Icon name="delete" size={24} color="#F44336" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={handleImagePicker}
            style={styles.headerButton}
          >
            <Icon name="add-a-photo" size={24} color="#8b45c7" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Info */}
      <View style={styles.categoryBanner}>
        <Icon name="folder" size={20} color="#8b45c7" />
        <Text style={styles.categoryText}>Category: {category}</Text>
        <Text style={styles.imageCount}>
          {uploadedImages.length} image{uploadedImages.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Images Grid */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {uploadedImages.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="photo-library" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Images Yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the camera button to upload your first image
            </Text>
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={handleImagePicker}
            >
              <Icon name="cloud-upload" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>Upload Images</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imageGrid}>
            {uploadedImages.map(renderImageItem)}
          </View>
        )}
      </ScrollView>

      {/* Selection Info */}
      {selectedImages.length > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>
            {selectedImages.length} selected
          </Text>
          <TouchableOpacity 
            onPress={() => setSelectedImages([])}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Options Modal */}
      <Modal
        isVisible={showOptionsModal}
        onBackdropPress={() => setShowOptionsModal(false)}
        backdropOpacity={0.5}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Image Source</Text>
          
          <TouchableOpacity style={styles.modalOption} onPress={openCamera}>
            <Icon name="camera-alt" size={24} color="#8b45c7" />
            <Text style={styles.modalOptionText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.modalOption} onPress={openGallery}>
            <Icon name="photo-library" size={24} color="#8b45c7" />
            <Text style={styles.modalOptionText}>Choose from Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modalCancel} 
            onPress={() => setShowOptionsModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {selectedImages.length > 1 ? 'Uploading images...' : 'Processing...'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 15,
  },
  categoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f4ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8b45c7',
    fontWeight: '500',
    flex: 1,
  },
  imageCount: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b45c7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 15,
  },
  imageContainer: {
    width: (width - 45) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageSelected: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  image: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: 'cover',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 2,
  },
  imageInfo: {
    padding: 12,
  },
  imageName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  imageSize: {
    fontSize: 12,
    color: '#666',
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    marginBottom: 10,
  },
  modalOptionText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalCancel: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default ImageUploadScreen;
