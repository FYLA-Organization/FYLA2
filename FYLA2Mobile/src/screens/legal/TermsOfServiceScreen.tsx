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

const TermsOfServiceScreen: React.FC = () => {
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
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <BlurView intensity={80} style={styles.contentContainer}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              
              <Text style={styles.lastUpdated}>Last Updated: July 28, 2025</Text>
              
              <Text style={styles.sectionTitle}>1. ACCEPTANCE OF TERMS</Text>
              <Text style={styles.paragraph}>
                By accessing or using the FYLA2 mobile application ("App"), website, or any related services 
                (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). 
                If you do not agree to these Terms, do not use the Service.
              </Text>

              <Text style={styles.sectionTitle}>2. DESCRIPTION OF SERVICE</Text>
              <Text style={styles.paragraph}>
                FYLA2 is a digital platform that connects service providers with customers seeking various 
                services. The platform facilitates booking, payment processing, communication, and review 
                systems between parties. FYLA2 acts as an intermediary and is not directly responsible for 
                the services provided by third-party service providers.
              </Text>

              <Text style={styles.sectionTitle}>3. USER ACCOUNTS AND ELIGIBILITY</Text>
              <Text style={styles.paragraph}>
                • You must be at least 18 years of age to use this Service{'\n'}
                • You must provide accurate, current, and complete information during registration{'\n'}
                • You are responsible for maintaining the confidentiality of your account credentials{'\n'}
                • You are responsible for all activities that occur under your account{'\n'}
                • You must notify us immediately of any unauthorized use of your account
              </Text>

              <Text style={styles.sectionTitle}>4. USER RESPONSIBILITIES AND CONDUCT</Text>
              <Text style={styles.paragraph}>
                You agree NOT to use the Service to:{'\n'}
                • Violate any applicable laws or regulations{'\n'}
                • Infringe upon intellectual property rights{'\n'}
                • Transmit harmful, threatening, or offensive content{'\n'}
                • Engage in fraudulent activities or misrepresentation{'\n'}
                • Interfere with the Service's operation or security{'\n'}
                • Collect personal information from other users without consent{'\n'}
                • Use the Service for any commercial purpose not expressly permitted
              </Text>

              <Text style={styles.sectionTitle}>5. SERVICE PROVIDER TERMS</Text>
              <Text style={styles.paragraph}>
                Service providers must:{'\n'}
                • Possess all necessary licenses, permits, and insurance{'\n'}
                • Provide services professionally and as described{'\n'}
                • Comply with all applicable laws and regulations{'\n'}
                • Maintain appropriate professional liability insurance{'\n'}
                • Handle customer data in accordance with privacy laws{'\n'}
                • Be solely responsible for tax obligations related to their services
              </Text>

              <Text style={styles.sectionTitle}>6. PAYMENT TERMS</Text>
              <Text style={styles.paragraph}>
                • All payments are processed through our secure payment system{'\n'}
                • Service fees and commissions are clearly disclosed{'\n'}
                • Refund policies vary by service type and provider{'\n'}
                • Users are responsible for any applicable taxes{'\n'}
                • FYLA2 may hold payments in escrow until service completion{'\n'}
                • Disputed charges must be reported within 30 days
              </Text>

              <Text style={styles.sectionTitle}>7. INTELLECTUAL PROPERTY</Text>
              <Text style={styles.paragraph}>
                All content, features, and functionality of the Service are owned by FYLA2 and are 
                protected by copyright, trademark, and other intellectual property laws. Users grant 
                FYLA2 a non-exclusive license to use content they submit to the platform.
              </Text>

              <Text style={styles.sectionTitle}>8. PRIVACY AND DATA PROTECTION</Text>
              <Text style={styles.paragraph}>
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, 
                and protect your information. By using the Service, you consent to our data practices 
                as described in the Privacy Policy.
              </Text>

              <Text style={styles.sectionTitle}>9. DISCLAIMER OF WARRANTIES</Text>
              <Text style={styles.paragraph}>
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. FYLA2 DISCLAIMS ALL 
                WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR 
                PURPOSE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE UNINTERRUPTED SERVICE OR ERROR-FREE OPERATION.
              </Text>

              <Text style={styles.sectionTitle}>10. LIMITATION OF LIABILITY</Text>
              <Text style={styles.paragraph}>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, FYLA2 SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, 
                DATA LOSS, OR BUSINESS INTERRUPTION, ARISING FROM YOUR USE OF THE SERVICE.
              </Text>

              <Text style={styles.sectionTitle}>11. INDEMNIFICATION</Text>
              <Text style={styles.paragraph}>
                You agree to indemnify and hold harmless FYLA2 from any claims, damages, losses, 
                or expenses arising from your use of the Service, violation of these Terms, or 
                infringement of any rights of third parties.
              </Text>

              <Text style={styles.sectionTitle}>12. TERMINATION</Text>
              <Text style={styles.paragraph}>
                FYLA2 may terminate or suspend your account immediately, without prior notice, for 
                conduct that violates these Terms or is harmful to other users or the Service. 
                You may terminate your account at any time by contacting customer support.
              </Text>

              <Text style={styles.sectionTitle}>13. DISPUTE RESOLUTION</Text>
              <Text style={styles.paragraph}>
                Any disputes arising from these Terms or use of the Service shall be resolved through 
                binding arbitration in accordance with the rules of the American Arbitration Association. 
                You waive any right to participate in class action lawsuits.
              </Text>

              <Text style={styles.sectionTitle}>14. GOVERNING LAW</Text>
              <Text style={styles.paragraph}>
                These Terms are governed by the laws of [Your State/Country], without regard to 
                conflict of law principles. Any legal action must be brought in the courts of [Your Jurisdiction].
              </Text>

              <Text style={styles.sectionTitle}>15. CHANGES TO TERMS</Text>
              <Text style={styles.paragraph}>
                FYLA2 reserves the right to modify these Terms at any time. Users will be notified 
                of significant changes via email or in-app notification. Continued use of the Service 
                after changes constitutes acceptance of the new Terms.
              </Text>

              <Text style={styles.sectionTitle}>16. CONTACT INFORMATION</Text>
              <Text style={styles.paragraph}>
                For questions about these Terms, please contact us at:{'\n'}
                Email: legal@fyla2.com{'\n'}
                Address: [Your Business Address]{'\n'}
                Phone: [Your Phone Number]
              </Text>

              <Text style={styles.paragraph}>
                By using FYLA2, you acknowledge that you have read, understood, and agree to be 
                bound by these Terms of Service.
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
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 15,
  },
});

export default TermsOfServiceScreen;
