import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { modernTheme } from '../../theme/modernTheme';

export const ModernTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const getTabIcon = (routeName: string, focused: boolean) => {
    const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      Home: focused ? 'home' : 'home-outline',
      Search: focused ? 'search' : 'search-outline',
      SocialFeed: focused ? 'compass' : 'compass-outline',
      Bookings: focused ? 'calendar' : 'calendar-outline',
      Messages: focused ? 'chatbubbles' : 'chatbubbles-outline',
      Dashboard: focused ? 'grid' : 'grid-outline',
      Appointments: focused ? 'time' : 'time-outline',
      Analytics: focused ? 'bar-chart' : 'bar-chart-outline',
      Clients: focused ? 'people' : 'people-outline',
      Profile: focused ? 'person' : 'person-outline',
      Subscription: focused ? 'diamond' : 'diamond-outline',
    };
    return iconMap[routeName] || 'ellipse-outline';
  };

  const getTabGradient = (focused: boolean): [string, string] => {
    if (focused) {
      return [modernTheme.colors.primary.gradient[0], modernTheme.colors.primary.gradient[1]];
    }
    return ['transparent', 'transparent'];
  };

  return (
    <View style={styles.tabBar}>
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.95)']}
        style={styles.tabBarGradient}
      >
        <View style={styles.tabContainer}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            const labelText = typeof label === 'string' ? label : route.name;

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tab}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  <LinearGradient
                    colors={getTabGradient(isFocused)}
                    style={[
                      styles.tabIconContainer,
                      isFocused && styles.tabIconContainerActive,
                    ]}
                  >
                    <Ionicons
                      name={getTabIcon(route.name, isFocused)}
                      size={isFocused ? 26 : 24}
                      color={
                        isFocused
                          ? 'white'
                          : modernTheme.colors.text.secondary
                      }
                    />
                  </LinearGradient>
                  
                  <Text
                    style={[
                      styles.tabLabel,
                      isFocused && styles.tabLabelActive,
                    ]}
                  >
                    {labelText}
                  </Text>
                  
                  {isFocused && <View style={styles.activeIndicator} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: modernTheme.borderRadius.xl,
    borderTopRightRadius: modernTheme.borderRadius.xl,
    overflow: 'hidden',
    ...modernTheme.shadows.lg,
  },
  tabBarGradient: {
    paddingTop: modernTheme.spacing.md,
    paddingBottom: modernTheme.spacing.lg,
    paddingHorizontal: modernTheme.spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.xs,
  },
  tabIconContainerActive: {
    ...modernTheme.shadows.md,
  },
  tabLabel: {
    fontSize: modernTheme.typography.fontSize.xs,
    fontFamily: modernTheme.typography.fontFamily.medium,
    color: modernTheme.colors.text.secondary,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: modernTheme.colors.primary.main,
    fontFamily: modernTheme.typography.fontFamily.semiBold,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: modernTheme.colors.primary.main,
    marginTop: modernTheme.spacing.xs,
  },
});
