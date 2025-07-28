import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';

const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <BlurView intensity={80} style={styles.contentContainer}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              
              <Text style={styles.lastUpdated}>Last Updated: July 28, 2025</Text>
              
              <Text style={styles.sectionTitle}>1. INFORMATION WE COLLECT</Text>
              
              <Text style={styles.subTitle}>Personal Information</Text>
              <Text style={styles.paragraph}>
                We collect information you provide directly to us, including:{'\n'}
                • Name, email address, phone number, date of birth{'\n'}
                • Profile information and photos{'\n'}
                • Payment and billing information{'\n'}
                • Service preferences and booking history{'\n'}
                • Communications with customer support
              </Text>

              <Text style={styles.subTitle}>Automatically Collected Information</Text>
              <Text style={styles.paragraph}>
                • Device information (model, OS, unique identifiers){'\n'}
                • Location data (when permitted){'\n'}
                • Usage analytics and app interactions{'\n'}
                • IP address and network information{'\n'}
                • Cookies and similar tracking technologies
              </Text>

              <Text style={styles.sectionTitle}>2. HOW WE USE YOUR INFORMATION</Text>
              <Text style={styles.paragraph}>
                We use your information to:{'\n'}
                • Provide and improve our services{'\n'}
                • Process bookings and payments{'\n'}
                • Facilitate communication between users{'\n'}
                • Send important notifications and updates{'\n'}
                • Prevent fraud and ensure platform security{'\n'}
                • Comply with legal obligations{'\n'}
                • Analyze usage patterns to enhance user experience
              </Text>

              <Text style={styles.sectionTitle}>3. INFORMATION SHARING</Text>
              <Text style={styles.paragraph}>
                We may share your information with:{'\n'}
                • Service providers to facilitate bookings{'\n'}
                • Payment processors for transaction handling{'\n'}
                • Third-party service providers for platform functionality{'\n'}
                • Law enforcement when required by law{'\n'}
                • Business partners with your explicit consent{'\n'}
                • New owners in case of business transfer
              </Text>

              <Text style={styles.sectionTitle}>4. DATA SECURITY</Text>
              <Text style={styles.paragraph}>
                We implement industry-standard security measures including:{'\n'}
                • Encryption of sensitive data in transit and at rest{'\n'}
                • Regular security assessments and updates{'\n'}
                • Access controls and authentication protocols{'\n'}
                • Secure payment processing through certified providers{'\n'}
                • Employee training on data protection practices
              </Text>

              <Text style={styles.sectionTitle}>5. YOUR PRIVACY RIGHTS</Text>
              <Text style={styles.paragraph}>
                Depending on your location, you may have the right to:{'\n'}
                • Access your personal information{'\n'}
                • Correct inaccurate data{'\n'}
                • Delete your account and associated data{'\n'}
                • Restrict processing of your information{'\n'}
                • Data portability{'\n'}
                • Withdraw consent for data processing{'\n'}
                • File complaints with regulatory authorities
              </Text>

              <Text style={styles.sectionTitle}>6. LOCATION DATA</Text>
              <Text style={styles.paragraph}>
                With your permission, we collect location data to:{'\n'}
                • Match you with nearby service providers{'\n'}
                • Provide accurate service delivery{'\n'}
                • Improve location-based recommendations{'\n'}
                • Verify service completion{'\n'}
                You can disable location sharing in your device settings at any time.
              </Text>

              <Text style={styles.sectionTitle}>7. CHILDREN'S PRIVACY</Text>
              <Text style={styles.paragraph}>
                FYLA2 is not intended for users under 18. We do not knowingly collect personal 
                information from children. If we discover we have collected information from a 
                child, we will delete it immediately.
              </Text>

              <Text style={styles.sectionTitle}>8. INTERNATIONAL DATA TRANSFERS</Text>
              <Text style={styles.paragraph}>
                Your information may be transferred to and processed in countries other than your 
                own. We ensure appropriate safeguards are in place to protect your data during 
                international transfers.
              </Text>

              <Text style={styles.sectionTitle}>9. DATA RETENTION</Text>
              <Text style={styles.paragraph}>
                We retain your information only as long as necessary to:{'\n'}
                • Provide our services{'\n'}
                • Comply with legal obligations{'\n'}
                • Resolve disputes{'\n'}
                • Enforce our agreements{'\n'}
                Account data is typically deleted within 30 days of account closure.
              </Text>

              <Text style={styles.sectionTitle}>10. COOKIES AND TRACKING</Text>
              <Text style={styles.paragraph}>
                We use cookies and similar technologies to:{'\n'}
                • Remember your preferences{'\n'}
                • Analyze app usage and performance{'\n'}
                • Provide personalized experiences{'\n'}
                • Prevent fraudulent activity{'\n'}
                You can manage cookie preferences in your device settings.
              </Text>

              <Text style={styles.sectionTitle}>11. THIRD-PARTY SERVICES</Text>
              <Text style={styles.paragraph}>
                Our app may contain links to third-party services. We are not responsible for 
                the privacy practices of these external services. We encourage you to review 
                their privacy policies before providing any information.
              </Text>

              <Text style={styles.sectionTitle}>12. CALIFORNIA PRIVACY RIGHTS (CCPA)</Text>
              <Text style={styles.paragraph}>
                California residents have additional rights including:{'\n'}
                • Right to know what personal information is collected{'\n'}
                • Right to delete personal information{'\n'}
                • Right to opt-out of the sale of personal information{'\n'}
                • Right to non-discrimination for exercising privacy rights
              </Text>

              <Text style={styles.sectionTitle}>13. EUROPEAN PRIVACY RIGHTS (GDPR)</Text>
              <Text style={styles.paragraph}>
                EU residents have rights under GDPR including:{'\n'}
                • Lawful basis for processing personal data{'\n'}
                • Right to access, rectify, and erase data{'\n'}
                • Right to restrict processing{'\n'}
                • Right to data portability{'\n'}
                • Right to object to processing
              </Text>

              <Text style={styles.sectionTitle}>14. CHANGES TO PRIVACY POLICY</Text>
              <Text style={styles.paragraph}>
                We may update this Privacy Policy periodically. Material changes will be 
                communicated via email or in-app notification. Your continued use of the 
                service constitutes acceptance of the updated policy.
              </Text>

              <Text style={styles.sectionTitle}>15. CONTACT US</Text>
              <Text style={styles.paragraph}>
                For privacy-related questions or to exercise your rights, contact us at:{'\n'}
                Email: privacy@fyla2.com{'\n'}
                Address: [Your Business Address]{'\n'}
                Phone: [Your Phone Number]{'\n'}
                Data Protection Officer: [DPO Contact]
              </Text>

              <Text style={styles.paragraph}>
                This Privacy Policy explains how FYLA2 collects, uses, and protects your 
                personal information. By using our service, you consent to our privacy practices.
              </Text>

            </View>
          </ScrollView>
        </BlurView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 25,
  },
  lastUpdated: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 25,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginTop: 25,
    marginBottom: 15,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 15,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 15,
  },
});

export default PrivacyPolicyScreen;
