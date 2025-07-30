import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationError {
  code: string;
  message: string;
}

export class LocationService {
  private static instance: LocationService;
  private currentLocation: Coordinates | null = null;
  private watchId: Location.LocationSubscription | null = null;

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions from the user
   */
  public async requestLocationPermission(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        this.showLocationPermissionAlert();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Get the user's current location
   */
  public async getCurrentLocation(): Promise<Coordinates | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 10,
      });

      const coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      this.currentLocation = coordinates;
      return coordinates;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Start watching location changes
   */
  public async startLocationTracking(): Promise<boolean> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        return false;
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 100, // Update when user moves 100 meters
        },
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  /**
   * Stop watching location changes
   */
  public stopLocationTracking(): void {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
  }

  /**
   * Get the cached current location (if available)
   */
  public getCachedLocation(): Coordinates | null {
    return this.currentLocation;
  }

  /**
   * Calculate distance between two coordinates in miles
   */
  public calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Get directions URL for navigation apps
   */
  public getDirectionsUrl(destinationLat: number, destinationLng: number): string {
    const currentLocation = this.getCachedLocation();
    
    if (Platform.OS === 'ios') {
      if (currentLocation) {
        return `http://maps.apple.com/?saddr=${currentLocation.latitude},${currentLocation.longitude}&daddr=${destinationLat},${destinationLng}&dirflg=d`;
      } else {
        return `http://maps.apple.com/?daddr=${destinationLat},${destinationLng}&dirflg=d`;
      }
    } else {
      if (currentLocation) {
        return `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destinationLat},${destinationLng}&travelmode=driving`;
      } else {
        return `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}&travelmode=driving`;
      }
    }
  }

  /**
   * Open navigation app with directions
   */
  public async openDirections(destinationLat: number, destinationLng: number): Promise<void> {
    try {
      const url = this.getDirectionsUrl(destinationLat, destinationLng);
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Navigation Error',
          'Unable to open navigation app. Please check if you have a maps app installed.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening directions:', error);
      Alert.alert(
        'Navigation Error',
        'Unable to open navigation app.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Generate mock coordinates for providers (for development)
   */
  public generateMockCoordinates(): Coordinates[] {
    // San Francisco Bay Area coordinates for demo
    const baseCoordinates = { latitude: 37.7749, longitude: -122.4194 };
    const mockCoordinates: Coordinates[] = [];

    for (let i = 0; i < 10; i++) {
      const latOffset = (Math.random() - 0.5) * 0.1; // ±0.05 degrees
      const lngOffset = (Math.random() - 0.5) * 0.1; // ±0.05 degrees
      
      mockCoordinates.push({
        latitude: baseCoordinates.latitude + latOffset,
        longitude: baseCoordinates.longitude + lngOffset,
      });
    }

    return mockCoordinates;
  }

  /**
   * Convert address to coordinates (geocoding)
   */
  public async geocodeAddress(address: string): Promise<Coordinates | null> {
    try {
      const geocodedLocation = await Location.geocodeAsync(address);
      
      if (geocodedLocation && geocodedLocation.length > 0) {
        return {
          latitude: geocodedLocation[0].latitude,
          longitude: geocodedLocation[0].longitude,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Convert coordinates to address (reverse geocoding)
   */
  public async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (addressResponse && addressResponse.length > 0) {
        const address = addressResponse[0];
        return `${address.street || ''} ${address.city || ''}, ${address.region || ''} ${address.postalCode || ''}`.trim();
      }
      
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private showLocationPermissionAlert(): void {
    Alert.alert(
      'Location Permission Required',
      'To find providers near you and get directions, please enable location access in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );
  }
}

export default LocationService.getInstance();
