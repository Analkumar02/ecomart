#!/bin/bash

# EcoMart Deployment Script for GitHub Pages
echo "🚀 Preparing EcoMart for deployment..."

# Build the project
echo "📦 Building project..."
npm run build

# Copy optimization files to build directory
echo "⚡ Copying optimization files..."
cp public/.htaccess build/.htaccess
cp public/sw.js build/sw.js

# Create _headers file for Netlify/GitHub Pages cache control
echo "📝 Creating _headers file..."
cat > build/_headers << EOF
/*
  Cache-Control: public, max-age=31536000, immutable
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/sw.js
  Cache-Control: no-cache, no-store, must-revalidate

/*.html
  Cache-Control: public, max-age=604800

/*.json
  Cache-Control: public, max-age=7200
EOF

echo "✅ EcoMart is ready for deployment!"
echo "📊 Performance optimizations applied:"
echo "   • Service Worker with aggressive caching"
echo "   • Static assets cached for 1 year"
echo "   • HTML cached for 1 week"
echo "   • JSON cached for 2 hours"
echo "   • Gzip compression enabled"
echo ""
echo "Expected PageSpeed improvements:"
echo "   • Est. savings of 264 KiB from caching"
echo "   • Better Core Web Vitals scores"
echo "   • Faster repeat visits"
