const SHOPIFY_DOMAIN = process.env.REACT_APP_SHOPIFY_DOMAIN;
const SHOPIFY_API_KEY = process.env.REACT_APP_SHOPIFY_STOREFRONT_API_KEY;

// GraphQL endpoint for Storefront API
const SHOPIFY_API_URL = `https://${SHOPIFY_DOMAIN}/api/2023-07/graphql.json`;

/**
 * Generic function to send a GraphQL query to Shopify Storefront API
 * @param {string} query - GraphQL query string
 * @param {object} variables - GraphQL variables object
 * @returns {Promise<object>} - Result data
 */
export async function shopifyRequest(query, variables = {}) {
  try {
    // Log for debugging - will show in browser console
    console.log(`Making request to Shopify API at: ${SHOPIFY_API_URL}`);

    if (!SHOPIFY_API_URL || !SHOPIFY_API_KEY) {
      console.error("Missing Shopify API configuration:", {
        apiUrl: SHOPIFY_API_URL ? "Set" : "Missing",
        apiKey: SHOPIFY_API_KEY ? "Set" : "Missing",
      });
      throw new Error("Shopify API configuration is missing");
    }

    const response = await fetch(SHOPIFY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": SHOPIFY_API_KEY,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      throw new Error(result.errors.map((e) => e.message).join(", "));
    }
    return result.data;
  } catch (error) {
    console.error("Shopify API request failed:", error);
    throw error;
  }
}

/**
 * Get products (customize the query as needed)
 */
export async function getProducts() {
  const query = `
    query getProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            handle
            description
            images(first: 1) {
              edges {
                node {
                  src
                  altText
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  let allProducts = [];
  let hasNextPage = true;
  let after = null;
  const first = 100; // Shopify max is 250, but 50 is safe for most stores
  while (hasNextPage) {
    const variables = { first, after };
    const data = await shopifyRequest(query, variables);
    const edges = data.products.edges;
    allProducts = allProducts.concat(edges.map((edge) => edge.node));
    hasNextPage = data.products.pageInfo.hasNextPage;
    after = data.products.pageInfo.endCursor;
  }
  return allProducts;
}

/**
 * Get collections with images (excluding collections without images)
 */
export async function getCollections() {
  const query = `
    query getCollections($first: Int!, $after: String) {
      collections(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            handle
            description
            image {
              src
              altText
            }
            products(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      }
    }
  `;
  let allCollections = [];
  let hasNextPage = true;
  let after = null;
  const first = 100;

  while (hasNextPage) {
    const variables = { first, after };
    const data = await shopifyRequest(query, variables);
    const edges = data.collections.edges;

    // Filter collections that have images and at least one product
    const collectionsWithImages = edges
      .map((edge) => edge.node)
      .filter(
        (collection) =>
          collection.image &&
          collection.image.src &&
          collection.products.edges.length > 0
      );

    allCollections = allCollections.concat(collectionsWithImages);
    hasNextPage = data.collections.pageInfo.hasNextPage;
    after = data.collections.pageInfo.endCursor;
  }

  return allCollections;
}
