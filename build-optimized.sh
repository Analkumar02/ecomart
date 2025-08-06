#!/bin/bash

echo "🚀 Building EcoMart with optimizations..."

# Build the React app
npm run build

# Navigate to build directory
cd build

echo "📦 Optimizing build files..."

# Create gzipped versions of JS and CSS files
find . -name "*.js" -exec gzip -9 -c {} \; > {}.gz 2>/dev/null || true
find . -name "*.css" -exec gzip -9 -c {} \; > {}.gz 2>/dev/null || true

# Add cache-busting headers to service worker
sed -i.bak "s/ecomart-v1.0.0/ecomart-v$(date +%s)/g" sw.js

echo "✅ Build optimization complete!"
echo "📊 Build size analysis:"
du -sh static/js/* static/css/*

echo "🌐 Ready for deployment!"
