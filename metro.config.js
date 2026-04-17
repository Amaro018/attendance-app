const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure .wasm is treated as an asset, not a source file.
// This allows 'import x from "./file.wasm"' to resolve to the file URI (or path).
// If it was in sourceExts, Metro attempts to parse it as JS, causing SyntaxError.

if (config.resolver.sourceExts.includes('wasm')) {
  config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'wasm');
}

if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

module.exports = config;