module.exports = ({ config }) => {
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || config.extra?.eas?.projectId;
  const mapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  // A release build without an API URL silently talks to "localhost" and every screen fails.
  // Fail the build instead. Set these in EAS: `eas env:create --environment production ...`
  const profile = process.env.EAS_BUILD_PROFILE;
  if (profile === 'production' || profile === 'preview') {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
    if (!/^https:\/\//.test(apiUrl)) {
      throw new Error(`EXPO_PUBLIC_API_URL must be an https:// URL for the "${profile}" build (got "${apiUrl}")`);
    }
    if (!mapsApiKey) throw new Error(`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is required for the "${profile}" build`);
  }
  return {
    ...config,
    ios: {
      ...config.ios,
      config: {
        ...config.ios?.config,
        ...(mapsApiKey ? { googleMapsApiKey: mapsApiKey } : {}),
      },
    },
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          ...config.android?.config?.googleMaps,
          ...(mapsApiKey ? { apiKey: mapsApiKey } : {}),
        },
      },
    },
    extra: {
      ...config.extra,
      ...(projectId ? { eas: { ...config.extra?.eas, projectId } } : {}),
    },
  };
};
