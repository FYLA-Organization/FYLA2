// Add this to your App.tsx or main navigation file

import SubscriptionPlansScreen from './src/screens/subscription/SubscriptionPlansScreen';

// In your Stack.Navigator:
<Stack.Screen 
  name="SubscriptionPlans" 
  component={SubscriptionPlansScreen}
  options={{ 
    title: 'Subscription Plans',
    headerShown: false 
  }}
/>

// To navigate to the subscription screen from anywhere in your app:
navigation.navigate('SubscriptionPlans');

// Example: Add a subscription button to your provider dashboard
<TouchableOpacity 
  style={styles.upgradeButton}
  onPress={() => navigation.navigate('SubscriptionPlans')}
>
  <Text style={styles.upgradeText}>Upgrade Plan</Text>
</TouchableOpacity>
