const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Explicitly restrict watchFolders to prevent Metro from watching backend/admin-erp
// which causes ENOENT crashes when they recompile.
config.watchFolders = [
  __dirname,
  path.resolve(__dirname, '../../node_modules'),
];

// Strictly resolve React from the mobile app's node_modules to avoid Invalid Hook Call
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: "./global.css" });
