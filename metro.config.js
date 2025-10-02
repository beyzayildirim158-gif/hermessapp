// Simplified Metro config: rely on .easignore for excluding large folders.
// Avoid using internal metro-config subpaths (exclusionList) that changed exports.
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Provide safe stubs for server-only modules so accidental imports don't break bundling.
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'firebase-admin': require.resolve('./metroStubs/firebaseAdminStub.js'),
  'papaparse': require.resolve('./metroStubs/papaparseStub.js'),
  'fast-xml-parser': require.resolve('./metroStubs/xmlParserStub.js'),
};

module.exports = config;
