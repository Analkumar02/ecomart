# Environment Setup

## Shopify Integration Setup

This project integrates with Shopify for order management. To set up the environment:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your actual Shopify credentials:
   - `REACT_APP_SHOPIFY_DOMAIN`: Your Shopify store domain (e.g., your-store.myshopify.com)
   - `REACT_APP_SHOPIFY_STOREFRONT_API_KEY`: Your Shopify Storefront API access token
   - `REACT_APP_SHOPIFY_ADMIN_API_TOKEN`: Your Shopify Admin API access token

## Security Note

**Important**: Never commit actual API tokens to version control. The `.env` file is included in `.gitignore` to prevent accidental commits of sensitive information.

For production deployments, set these environment variables through your hosting platform's environment configuration (Netlify, Vercel, etc.).

## Getting Your Shopify API Credentials

### Storefront API Access Token
1. Go to your Shopify Admin → Apps → Manage private apps
2. Create a private app or use existing one
3. Enable Storefront API access
4. Copy the Storefront access token

### Admin API Access Token
1. Go to your Shopify Admin → Apps → Manage private apps
2. Enable Admin API access with required permissions:
   - Orders: Read and write
   - Products: Read
3. Copy the Admin API access token

**Warning**: Admin API tokens should ideally be used server-side for security. This implementation is for demonstration/development purposes.
