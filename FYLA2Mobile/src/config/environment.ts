import { Platform } from 'react-native';

// Configuration object
class Config {
  private static instance: Config;
  private _baseURL: string = '';
  private _isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public async initialize(): Promise<void> {
    if (this._isInitialized) return;

    try {
      // Method 1: Use environment variable if available
      if (process.env.EXPO_PUBLIC_API_URL) {
        this._baseURL = process.env.EXPO_PUBLIC_API_URL;
        console.log('Using environment variable for API URL:', this._baseURL);
      }
      // Method 2: Fallback to localhost for development
      else {
        // Always use localhost for development since backend runs there
        this._baseURL = 'http://localhost:5224/api';
        console.log('Using localhost API URL for development:', this._baseURL);
      }

      this._isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize config:', error);
      this._baseURL = 'http://192.168.1.171:5224/api';
      this._isInitialized = true;
    }
  }

  private async detectLocalIP(): Promise<string> {
    // Since automatic detection is complex in React Native,
    // we'll rely on the script-based approach and use fallback
    return '192.168.1.171'; // Current detected IP as fallback
  }

  public get baseURL(): string {
    if (!this._isInitialized) {
      console.warn('Config not initialized, using fallback URL');
      return 'http://localhost:5224/api';
    }
    return this._baseURL;
  }

  public get chatHubURL(): string {
    return this.baseURL.replace('/api', '/chathub');
  }

  public get staticFilesURL(): string {
    return this.baseURL.replace('/api', '');
  }

  // Method to manually update the IP (for testing)
  public setCustomIP(ip: string): void {
    this._baseURL = `http://${ip}:5224/api`;
    console.log('Manually set API URL to:', this._baseURL);
  }
}

export default Config.getInstance();
