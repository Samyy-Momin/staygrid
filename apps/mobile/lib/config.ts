import Constants from 'expo-constants';

export const getApiUrl = () => {
  // In development mode, Expo Go connects to the Metro bundler.
  // Dynamically extract the Wi-Fi IP address that Expo Go used to connect to your laptop.
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ipAddress = hostUri.split(':')[0];
      return `http://${ipAddress}:3000`;
    }
  }

  // Fallback to the .env file or localhost
  return process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
};

export const getFullImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') {
    return "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1470&auto=format&fit=crop";
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    if (url.includes("localhost:3000") || url.includes("127.0.0.1:3000")) {
      const baseUrl = getApiUrl();
      return url.replace(/http:\/\/(localhost|127\.0\.0\.1):3000/, baseUrl);
    }
    return url;
  }
  const baseUrl = getApiUrl();
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${cleanPath}`;
};
