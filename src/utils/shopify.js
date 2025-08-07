const SHOPIFY_DOMAIN = process.env.REACT_APP_SHOPIFY_DOMAIN;
const SHOPIFY_API_KEY = process.env.REACT_APP_SHOPIFY_STOREFRONT_API_KEY;
const SHOPIFY_ADMIN_TOKEN = process.env.REACT_APP_SHOPIFY_ADMIN_API_TOKEN;

// GraphQL endpoint for Storefront API
const SHOPIFY_API_URL = `https://${SHOPIFY_DOMAIN}/api/2023-07/graphql.json`;
// REST API endpoint for Admin API
const SHOPIFY_ADMIN_API_URL = `https://${SHOPIFY_DOMAIN}/admin/api/2023-10`;

/**
 * Generic function to send a GraphQL query to Shopify Storefront API
 * @param {string} query - GraphQL query string
 * @param {object} variables - GraphQL variables object
 * @returns {Promise<object>} - Result data
 */
export async function shopifyRequest(query, variables = {}) {
  try {
    // Removed console logging to reduce console spam

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
            productType
            tags
            images(first: 5) {
              edges {
                node {
                  src
                  altText
                }
              }
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                  availableForSale
                  image {
                    src
                    altText
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
  const first = 250; // Shopify max is 250, but 50 is safe for most stores
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

/**
 * Get products from a specific collection by handle
 * @param {string} collectionHandle - The handle of the collection
 * @returns {Promise<Array>} - Array of products
 */
export async function getProductsByCollection(collectionHandle) {
  const query = `
    query getProductsByCollection($handle: String!, $first: Int!, $after: String) {
      collectionByHandle(handle: $handle) {
        id
        title
        products(first: $first, after: $after, sortKey: PRICE, reverse: true) {
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
              productType
              tags
              images(first: 5) {
                edges {
                  node {
                    src
                    altText
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    availableForSale
                    image {
                      src
                      altText
                    }
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
  const first = 50;

  while (hasNextPage) {
    const variables = { handle: collectionHandle, first, after };
    const data = await shopifyRequest(query, variables);

    if (!data.collectionByHandle) {
      console.warn(`Collection with handle "${collectionHandle}" not found`);
      return [];
    }

    const edges = data.collectionByHandle.products.edges;
    allProducts = allProducts.concat(edges.map((edge) => edge.node));
    hasNextPage = data.collectionByHandle.products.pageInfo.hasNextPage;
    after = data.collectionByHandle.products.pageInfo.endCursor;
  }

  return allProducts;
}

/**
 * Get a single product by handle
 */
export async function getProductByHandle(handle) {
  const query = `
    query getProduct($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        handle
        description
        productType
        tags
        collections(first: 5) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
        images(first: 10) {
          edges {
            node {
              src
              altText
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              availableForSale
              image {
                src
                altText
              }
            }
          }
        }
        metafield(namespace: "custom", key: "description") {
          id
          key
          value
        }
        additionalInfoMetafield: metafield(namespace: "custom", key: "additional_information") {
          id
          key
          value
        }
      }
    }
  `;

  const variables = { handle };
  const data = await shopifyRequest(query, variables);
  return data.productByHandle;
}

/**
 * Get shipping rates for checkout
 * Note: This is a simplified version. In a real implementation, you would
 * need to integrate with Shopify's checkout API to get accurate shipping rates
 * based on the customer's address and cart contents.
 */
export async function getShippingRates(subtotal, country = "IN") {
  // This is a mock implementation since Shopify's Storefront API doesn't
  // directly provide shipping rates without a checkout session

  const FREE_SHIPPING_THRESHOLD = 500;
  const STANDARD_SHIPPING_RATE = 20;
  const EXPRESS_SHIPPING_RATE = 50;

  const rates = [
    {
      id: "standard",
      title: "Standard Shipping",
      price: subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_RATE,
      description:
        subtotal >= FREE_SHIPPING_THRESHOLD
          ? "Free shipping on orders ₹500+"
          : "5-7 business days",
    },
    {
      id: "express",
      title: "Express Shipping",
      price: EXPRESS_SHIPPING_RATE,
      description: "2-3 business days",
    },
  ];

  return rates;
}

/**
 * Create an order using Shopify Admin API
 * @param {object} orderData - Order data from checkout
 * @returns {Promise<object>} - Created order details
 */
export async function createShopifyOrder(orderData) {
  try {
    console.log("Creating Shopify order with data:", orderData);

    if (!SHOPIFY_ADMIN_TOKEN || !SHOPIFY_DOMAIN) {
      throw new Error("Shopify Admin API configuration is missing");
    }

    // Format line items for Shopify
    const lineItems = orderData.cart.map((item) => {
      const price = parseFloat(item.price?.amount || item.price || 0);
      return {
        variant_id: item.variants?.[0]?.id
          ? parseInt(item.variants[0].id.split("/").pop()) // Extract numeric ID from GraphQL ID
          : null,
        product_id: item.id
          ? parseInt(item.id.split("/").pop()) // Extract numeric ID from GraphQL ID
          : null,
        quantity: item.quantity || 1,
        price: price.toFixed(2),
        title: item.title,
        // If no variant_id, include product details for custom line item
        ...(!item.variants?.[0]?.id && {
          title: item.title,
          price: price.toFixed(2),
          grams: 0,
          requires_shipping: true,
        }),
      };
    });

    // Calculate totals
    const subtotal = orderData.cart.reduce((sum, item) => {
      const price = parseFloat(item.price?.amount || item.price || 0);
      const quantity = item.quantity || 1;
      return sum + price * quantity;
    }, 0);

    const shippingCost = subtotal >= 500 ? 0 : 20;
    const handlingFee = 10;
    const couponDiscount = orderData.couponDiscount || 0;
    const totalPrice = subtotal + shippingCost + handlingFee - couponDiscount;

    // Create shipping lines
    const shippingLines = [];
    if (shippingCost > 0) {
      shippingLines.push({
        title: "Standard Shipping",
        price: shippingCost.toFixed(2),
        code: "standard",
      });
    }

    // Add handling fee as shipping line
    shippingLines.push({
      title: "Handling Fee",
      price: handlingFee.toFixed(2),
      code: "handling",
    });

    // Create discount applications if coupon was applied
    const discountApplications = [];
    if (couponDiscount > 0 && orderData.appliedCoupon) {
      discountApplications.push({
        type: "manual",
        value: couponDiscount.toFixed(2),
        value_type: "fixed_amount",
        title: orderData.appliedCoupon.title,
        description: `Coupon: ${orderData.appliedCoupon.title}`,
      });
    }

    // Prepare order payload
    const orderPayload = {
      order: {
        line_items: lineItems,
        customer: {
          first_name: orderData.billing.firstName,
          last_name: orderData.billing.lastName,
          email: orderData.billing.email,
          phone: orderData.billing.phone,
        },
        billing_address: {
          first_name: orderData.billing.firstName,
          last_name: orderData.billing.lastName,
          address1: orderData.billing.streetAddress,
          city: orderData.billing.townCity,
          province: orderData.billing.state,
          country: orderData.billing.country,
          zip: orderData.billing.pinCode,
          phone: orderData.billing.phone,
        },
        shipping_address: {
          first_name: orderData.shipping.firstName,
          last_name: orderData.shipping.lastName,
          address1: orderData.shipping.streetAddress,
          city: orderData.shipping.townCity,
          province: orderData.shipping.state,
          country: orderData.shipping.country,
          zip: orderData.shipping.pinCode,
          phone: orderData.shipping.phone,
        },
        shipping_lines: shippingLines,
        financial_status: "pending",
        fulfillment_status: null,
        email: orderData.billing.email,
        phone: orderData.billing.phone,
        currency: "INR",
        total_price: totalPrice.toFixed(2),
        subtotal_price: subtotal.toFixed(2),
        total_tax: "0.00",
        taxes_included: false,
        note: orderData.orderNotes || "",
        tags: "ecomart-web-order",
        source_name: "ecomart-web",
        gateway: "Cash on Delivery",
        ...(discountApplications.length > 0 && {
          discount_applications: discountApplications,
        }),
      },
    };

    console.log("Sending order payload to Shopify:", orderPayload);

    // Make API request to Shopify Admin API
    const response = await fetch(`${SHOPIFY_ADMIN_API_URL}/orders.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Shopify API Error:", errorData);
      throw new Error(
        `Shopify API request failed: ${response.status} - ${JSON.stringify(
          errorData
        )}`
      );
    }

    const result = await response.json();
    console.log("Shopify order created successfully:", result.order);

    return {
      success: true,
      order: result.order,
      message: "Order created successfully in Shopify",
    };
  } catch (error) {
    console.error("Failed to create Shopify order:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to create order in Shopify",
    };
  }
}
