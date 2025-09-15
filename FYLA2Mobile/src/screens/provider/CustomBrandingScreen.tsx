import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, COMMON_STYLES } from '../../constants/colors';
import FeatureGatingService from '../../services/featureGatingService';

interface CustomBrandingSettings {
  businessLogo?: string;
  primaryColor: string;
  secondaryColor: string;
  businessName: string;
  tagline: string;
  customWatermark: boolean;
  brandedInvoices: boolean;
  customEmailTemplates: boolean;
  socialMediaBranding: boolean;
}

const CustomBrandingScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canUseCustomBranding, setCanUseCustomBranding] = useState(false);
  const [settings, setSettings] = useState<CustomBrandingSettings>({
    primaryColor: '#6366F1',
    secondaryColor: '#10B981',
    businessName: '',
    tagline: '',
    customWatermark: false,
    brandedInvoices: false,
    customEmailTemplates: false,
    socialMediaBranding: false,
  });

  useEffect(() => {
    checkPermissionsAndLoadSettings();
  }, []);

  const checkPermissionsAndLoadSettings = async () => {
    try {
      const brandingCheck = await FeatureGatingService.canUseCustomBranding();
      setCanUseCustomBranding(brandingCheck.allowed);
      
      if (brandingCheck.allowed) {
        // Load existing settings
        // In real app, this would be from API
        loadBrandingSettings();
      }
    } catch (error) {
      console.error('Error checking branding permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBrandingSettings = async () => {
    // Simulate loading from API
    // In real app: const settings = await ApiService.getBrandingSettings();
    setSettings({
      primaryColor: '#6366F1',
      secondaryColor: '#10B981',
      businessName: 'My Beauty Studio',
      tagline: 'Beauty Beyond Expectations',
      customWatermark: true,
      brandedInvoices: true,
      customEmailTemplates: false,
      socialMediaBranding: true,
    });
  };

  const saveBrandingSettings = async () => {
    try {
      setSaving(true);
      // In real app: await ApiService.saveBrandingSettings(settings);
      Alert.alert('Success', 'Branding settings saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = () => {
    navigation.navigate('SubscriptionPlans' as any);
  };

  const renderColorPicker = (label: string, value: string, onChange: (color: string) => void) => {
    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
    
    return (
      <View style={styles.colorPickerContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.colorOptions}>
          {colors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                value === color && styles.selectedColorOption
              ]}
              onPress={() => onChange(color)}
            >
              {value === color && (
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderFeatureToggle = (
    label: string,
    description: string,
    value: boolean,
    onChange: (value: boolean) => void,
    icon: string
  ) => (
    <TouchableOpacity
      style={styles.featureToggle}
      onPress={() => onChange(!value)}
      disabled={!canUseCustomBranding}
    >
      <View style={styles.featureToggleLeft}>
        <View style={[styles.featureIcon, { backgroundColor: value ? COLORS.success : COLORS.border }]}>
          <Ionicons name={icon as any} size={20} color={value ? '#FFFFFF' : COLORS.textSecondary} />
        </View>
        <View style={styles.featureText}>
          <Text style={styles.featureLabel}>{label}</Text>
          <Text style={styles.featureDescription}>{description}</Text>
        </View>
      </View>
      <View style={[styles.toggle, value && styles.toggleActive]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading branding settings...</Text>
      </View>
    );
  }

  if (!canUseCustomBranding) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.upgradeContainer}>
          <View style={styles.upgradeContent}>
            <Ionicons name="diamond" size={48} color="#FFFFFF" style={styles.upgradeIcon} />
            <Text style={styles.upgradeTitle}>Custom Branding</Text>
            <Text style={styles.upgradeSubtitle}>
              Create your unique brand identity with custom colors, logos, and branded materials.
            </Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.featureText}>Custom business logo</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.featureText}>Brand color customization</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.featureText}>Branded invoices & emails</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.featureText}>Custom watermarks</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Text style={styles.upgradeButtonText}>Upgrade to Business Plan</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Custom Branding</Text>
        <TouchableOpacity style={styles.saveButton} onPress={saveBrandingSettings} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Business Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Business Name</Text>
            <TextInput
              style={styles.textInput}
              value={settings.businessName}
              onChangeText={(text) => setSettings(prev => ({ ...prev, businessName: text }))}
              placeholder="Enter your business name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Business Tagline</Text>
            <TextInput
              style={styles.textInput}
              value={settings.tagline}
              onChangeText={(text) => setSettings(prev => ({ ...prev, tagline: text }))}
              placeholder="Enter your business tagline"
            />
          </View>
        </View>

        {/* Color Customization */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brand Colors</Text>
          
          {renderColorPicker(
            'Primary Color',
            settings.primaryColor,
            (color) => setSettings(prev => ({ ...prev, primaryColor: color }))
          )}
          
          {renderColorPicker(
            'Secondary Color',
            settings.secondaryColor,
            (color) => setSettings(prev => ({ ...prev, secondaryColor: color }))
          )}
        </View>

        {/* Logo Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Logo</Text>
          <TouchableOpacity style={styles.logoUpload}>
            <Ionicons name="camera" size={32} color={COLORS.textSecondary} />
            <Text style={styles.logoUploadText}>Upload Logo</Text>
            <Text style={styles.logoUploadSubtext}>Recommended: 200x200px PNG</Text>
          </TouchableOpacity>
        </View>

        {/* Branding Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Branding Features</Text>
          
          {renderFeatureToggle(
            'Custom Watermark',
            'Add your logo watermark to all photos',
            settings.customWatermark,
            (value) => setSettings(prev => ({ ...prev, customWatermark: value })),
            'image-outline'
          )}
          
          {renderFeatureToggle(
            'Branded Invoices',
            'Use your branding on all invoices',
            settings.brandedInvoices,
            (value) => setSettings(prev => ({ ...prev, brandedInvoices: value })),
            'receipt-outline'
          )}
          
          {renderFeatureToggle(
            'Custom Email Templates',
            'Brand your email communications',
            settings.customEmailTemplates,
            (value) => setSettings(prev => ({ ...prev, customEmailTemplates: value })),
            'mail-outline'
          )}
          
          {renderFeatureToggle(
            'Social Media Branding',
            'Apply branding to shared content',
            settings.socialMediaBranding,
            (value) => setSettings(prev => ({ ...prev, socialMediaBranding: value })),
            'share-social-outline'
          )}
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={[styles.previewCard, { borderColor: settings.primaryColor }]}>
            <View style={[styles.previewHeader, { backgroundColor: settings.primaryColor }]}>
              <Text style={styles.previewBusinessName}>{settings.businessName || 'Your Business'}</Text>
            </View>
            <View style={styles.previewContent}>
              <Text style={[styles.previewTagline, { color: settings.secondaryColor }]}>
                {settings.tagline || 'Your tagline here'}
              </Text>
              <Text style={styles.previewText}>This is how your brand will appear</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.surface,
    marginBottom: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  colorPickerContainer: {
    marginBottom: 20,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: COLORS.text,
  },
  logoUpload: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  logoUploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 8,
  },
  logoUploadSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  featureToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  featureToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.success,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  previewCard: {
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  previewHeader: {
    padding: 16,
  },
  previewBusinessName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
  },
  previewContent: {
    padding: 16,
  },
  previewTagline: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  
  // Upgrade screen styles
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  upgradeContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
  },
  upgradeIcon: {
    marginBottom: 16,
  },
  upgradeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  upgradeSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 24,
    lineHeight: 24,
  },
  featuresList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
});

export default CustomBrandingScreen;
