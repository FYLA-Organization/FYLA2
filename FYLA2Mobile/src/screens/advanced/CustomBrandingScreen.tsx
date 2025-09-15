import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { modernTheme } from '../../theme/modernTheme';
import { ModernCard } from '../../components/ui/ModernCard';
import { ModernButton } from '../../components/ui/ModernButton';
import apiService from '../../services/apiService';

interface BrandProfile {
  id: number;
  businessName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  tagline?: string;
  description?: string;
  websiteUrl?: string;
  instagramHandle?: string;
  facebookPage?: string;
  twitterHandle?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BrandingScreenProps {
  navigation: any;
}

// Theme constants
const MODERN_COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1D1D1F',
  gray100: '#F2F2F7',
  gray300: '#C7C7CC',
  gray400: '#AEAEB2',
  gray500: '#8E8E93',
  gray600: '#636366',
  white: '#FFFFFF',
  black: '#000000',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const TYPOGRAPHY = {
  sm: 12,
  md: 16,
  lg: 18,
  xl: 20,
};

const BORDER_RADIUS = {
  md: 8,
  lg: 12,
};

const SHADOWS = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

interface CustomBranding {
  id?: number;
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  businessName: string;
  tagline: string;
  description: string;
  customDomain?: string;
  socialMediaLinks: { [key: string]: string };
}

interface CustomBrandingScreenProps {
  navigation: any;
}

const CustomBrandingScreen: React.FC<CustomBrandingScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branding, setBranding] = useState<CustomBranding>({
    primaryColor: '#007AFF',
    secondaryColor: '#5856D6',
    accentColor: '#FF9500',
    businessName: '',
    tagline: '',
    description: '',
    socialMediaLinks: {
      instagram: '',
      facebook: '',
      twitter: '',
      website: ''
    }
  });
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBrandProfile();
      if (response) {
        // Convert from new API format to existing state format
        setBranding({
          id: response.id,
          logoUrl: response.logoUrl,
          primaryColor: response.primaryColor,
          secondaryColor: response.secondaryColor,
          accentColor: response.accentColor,
          businessName: response.businessName,
          tagline: response.tagline || '',
          description: response.description || '',
          socialMediaLinks: {
            website: response.websiteUrl || '',
            instagram: response.instagramHandle || '',
            facebook: response.facebookPage || '',
            twitter: response.twitterHandle || '',
          }
        });
      }
    } catch (error: any) {
      console.error('Error loading branding:', error);
      if (error.response?.status === 401) {
        Alert.alert('Access Denied', 'Custom branding requires a Business plan subscription.');
        navigation.goBack();
      } else if (error.response?.status !== 404) {
        // 404 means no brand profile exists yet, which is fine
        Alert.alert('Error', 'Failed to load branding settings.');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveBranding = async () => {
    try {
      setSaving(true);
      
      // Convert branding to the new API format
      const brandData = {
        businessName: branding.businessName,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        accentColor: branding.accentColor,
        tagline: branding.tagline,
        description: branding.description,
        websiteUrl: branding.socialMediaLinks.website,
        instagramHandle: branding.socialMediaLinks.instagram,
        facebookPage: branding.socialMediaLinks.facebook,
        twitterHandle: branding.socialMediaLinks.twitter,
      };

      if (branding.id) {
        await apiService.updateBrandProfile(brandData);
      } else {
        const response = await apiService.createBrandProfile(brandData);
        setBranding({ ...branding, id: response.id });
      }
      
      Alert.alert('Success', 'Branding settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving branding:', error);
      Alert.alert('Error', 'Failed to save branding settings.');
    } finally {
      setSaving(false);
    }
  };

  const predefinedColors = [
    '#007AFF', '#5856D6', '#FF9500', '#FF3B30', '#34C759',
    '#5AC8FA', '#FF2D92', '#AF52DE', '#FF6B35', '#32D74B',
    '#007AFF', '#5856D6', '#FF9500', '#FF3B30', '#34C759'
  ];

  const pickImage = async (type: 'logo' | 'banner') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // In a real app, you would upload this to your server
      const imageUri = result.assets[0].uri;
      setBranding(prev => ({
        ...prev,
        [type === 'logo' ? 'logoUrl' : 'bannerUrl']: imageUri
      }));
    }
  };

  const ColorPickerButton: React.FC<{
    label: string;
    color: string;
    onColorChange: (color: string) => void;
    colorKey: string;
  }> = ({ label, color, onColorChange, colorKey }) => (
    <View style={styles.colorPickerContainer}>
      <Text style={styles.colorLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.colorPreview, { backgroundColor: color }]}
        onPress={() => setShowColorPicker(colorKey)}
      >
        <Text style={styles.colorHex}>{color}</Text>
      </TouchableOpacity>
      {showColorPicker === colorKey && (
        <View style={styles.colorPickerModal}>
          <Text style={styles.colorPickerTitle}>Choose a color:</Text>
          <View style={styles.colorGrid}>
            {predefinedColors.map((predefinedColor, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.colorOption, { backgroundColor: predefinedColor }]}
                onPress={() => {
                  onColorChange(predefinedColor);
                  setShowColorPicker(null);
                }}
              />
            ))}
          </View>
          <TouchableOpacity
            style={styles.closeColorPicker}
            onPress={() => setShowColorPicker(null)}
          >
            <Text style={styles.closeColorPickerText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
          <Text style={styles.loadingText}>Loading branding settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={MODERN_COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Custom Branding</Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.savingButton]}
          onPress={saveBranding}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={MODERN_COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Brand Assets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brand Assets</Text>
          
          <View style={styles.imageUploadContainer}>
            <Text style={styles.inputLabel}>Logo</Text>
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={() => pickImage('logo')}
            >
              {branding.logoUrl ? (
                <Image source={{ uri: branding.logoUrl }} style={styles.logoPreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={32} color={MODERN_COLORS.gray400} />
                  <Text style={styles.imagePlaceholderText}>Upload Logo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.imageUploadContainer}>
            <Text style={styles.inputLabel}>Banner Image</Text>
            <TouchableOpacity
              style={styles.bannerUploadButton}
              onPress={() => pickImage('banner')}
            >
              {branding.bannerUrl ? (
                <Image source={{ uri: branding.bannerUrl }} style={styles.bannerPreview} />
              ) : (
                <View style={styles.bannerPlaceholder}>
                  <Ionicons name="camera" size={32} color={MODERN_COLORS.gray400} />
                  <Text style={styles.imagePlaceholderText}>Upload Banner</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Color Scheme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color Scheme</Text>
          
          <ColorPickerButton
            label="Primary Color"
            color={branding.primaryColor}
            colorKey="primary"
            onColorChange={(color) => setBranding(prev => ({ ...prev, primaryColor: color }))}
          />

          <ColorPickerButton
            label="Secondary Color"
            color={branding.secondaryColor}
            colorKey="secondary"
            onColorChange={(color) => setBranding(prev => ({ ...prev, secondaryColor: color }))}
          />

          <ColorPickerButton
            label="Accent Color"
            color={branding.accentColor}
            colorKey="accent"
            onColorChange={(color) => setBranding(prev => ({ ...prev, accentColor: color }))}
          />
        </View>

        {/* Business Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Business Name</Text>
            <TextInput
              style={styles.textInput}
              value={branding.businessName}
              onChangeText={(text) => setBranding(prev => ({ ...prev, businessName: text }))}
              placeholder="Enter your business name"
              placeholderTextColor={MODERN_COLORS.gray400}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tagline</Text>
            <TextInput
              style={styles.textInput}
              value={branding.tagline}
              onChangeText={(text) => setBranding(prev => ({ ...prev, tagline: text }))}
              placeholder="Your business tagline"
              placeholderTextColor={MODERN_COLORS.gray400}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={branding.description}
              onChangeText={(text) => setBranding(prev => ({ ...prev, description: text }))}
              placeholder="Describe your business"
              placeholderTextColor={MODERN_COLORS.gray400}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Custom Domain (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={branding.customDomain || ''}
              onChangeText={(text) => setBranding(prev => ({ ...prev, customDomain: text }))}
              placeholder="yourbusiness.com"
              placeholderTextColor={MODERN_COLORS.gray400}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Social Media Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media Links</Text>
          
          {Object.entries(branding.socialMediaLinks).map(([platform, url]) => (
            <View key={platform} style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </Text>
              <TextInput
                style={styles.textInput}
                value={url}
                onChangeText={(text) => setBranding(prev => ({
                  ...prev,
                  socialMediaLinks: { ...prev.socialMediaLinks, [platform]: text }
                }))}
                placeholder={`Your ${platform} URL`}
                placeholderTextColor={MODERN_COLORS.gray400}
                autoCapitalize="none"
              />
            </View>
          ))}
        </View>

        {/* Preview */}
        <View style={[styles.section, styles.previewSection]}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={[styles.previewCard, { borderColor: branding.primaryColor }]}>
            <View style={[styles.previewHeader, { backgroundColor: branding.primaryColor }]}>
              <Text style={styles.previewBusinessName}>{branding.businessName || 'Your Business'}</Text>
              {branding.tagline && <Text style={styles.previewTagline}>{branding.tagline}</Text>}
            </View>
            <View style={styles.previewBody}>
              <Text style={styles.previewDescription}>
                {branding.description || 'Your business description will appear here...'}
              </Text>
              <View style={styles.previewButtons}>
                <View style={[styles.previewButton, { backgroundColor: branding.secondaryColor }]}>
                  <Text style={styles.previewButtonText}>Book Now</Text>
                </View>
                <View style={[styles.previewButton, { backgroundColor: branding.accentColor }]}>
                  <Text style={styles.previewButtonText}>View Portfolio</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.md,
    color: MODERN_COLORS.gray600,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.gray100,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '600',
    color: MODERN_COLORS.text,
  },
  saveButton: {
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 60,
    alignItems: 'center',
  },
  savingButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: MODERN_COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: MODERN_COLORS.surface,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: MODERN_COLORS.text,
    marginBottom: SPACING.md,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    color: MODERN_COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.md,
    color: MODERN_COLORS.text,
    backgroundColor: MODERN_COLORS.white,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageUploadContainer: {
    marginBottom: SPACING.md,
  },
  imageUploadButton: {
    borderWidth: 2,
    borderColor: MODERN_COLORS.gray300,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  bannerUploadButton: {
    borderWidth: 2,
    borderColor: MODERN_COLORS.gray300,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  bannerPlaceholder: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  imagePlaceholderText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray500,
  },
  logoPreview: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
  },
  bannerPreview: {
    width: '100%',
    height: 60,
    borderRadius: BORDER_RADIUS.md,
  },
  colorPickerContainer: {
    marginBottom: SPACING.md,
  },
  colorLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    color: MODERN_COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  colorPreview: {
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray300,
  },
  colorHex: {
    color: MODERN_COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  colorPickerModal: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: MODERN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.lg,
    zIndex: 1000,
  },
  colorPickerTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    color: MODERN_COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: MODERN_COLORS.gray300,
  },
  colorPicker: {
    height: 200,
  },
  closeColorPicker: {
    marginTop: SPACING.md,
    backgroundColor: MODERN_COLORS.primary,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  closeColorPickerText: {
    color: MODERN_COLORS.white,
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
  },
  previewSection: {
    marginBottom: SPACING.xl,
  },
  previewCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  previewHeader: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  previewBusinessName: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
    color: MODERN_COLORS.white,
  },
  previewTagline: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.white,
    opacity: 0.9,
    marginTop: SPACING.xs,
  },
  previewBody: {
    backgroundColor: MODERN_COLORS.white,
    padding: SPACING.md,
  },
  previewDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginBottom: SPACING.md,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  previewButton: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  previewButtonText: {
    color: MODERN_COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
});

export default CustomBrandingScreen;
