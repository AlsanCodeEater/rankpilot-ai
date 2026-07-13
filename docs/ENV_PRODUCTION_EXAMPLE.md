# Production Environment Variables Example

This file documents all required environment variables for a production deployment of RankPilot AI. 
**NEVER commit real secrets to source control. Use this as a template.**

```env
# Application Environment
NODE_ENV="production"
APP_NAME="RankPilot AI"

# Shopify App Credentials
# Obtain these from the Shopify Partner Dashboard
SHOPIFY_API_KEY="your_production_client_id_here"
SHOPIFY_API_SECRET="your_production_client_secret_here"
SCOPES="read_products,write_products,read_inventory,read_locations,write_pixels,read_customer_events"

# Application Routing
SHOPIFY_APP_URL="https://app.yourdomain.com"
APP_URL="https://app.yourdomain.com"

# Database Configuration
# Production database connection string (e.g., PostgreSQL or MySQL)
DATABASE_URL="postgresql://username:password@hostname:5432/database_name"

# AI Provider Configuration
# Set the active provider ("zai" or "openai" or "openrouter")
AI_PROVIDER="zai"

# ZAI Configuration (If AI_PROVIDER="zai")
ZAI_API_KEY="your_zai_api_key_here"
ZAI_BASE_URL="https://api.zai.example.com"
ZAI_MODEL="glm-4.7-flash"

# OpenRouter Configuration (If AI_PROVIDER="openrouter")
OPENROUTER_API_KEY="your_openrouter_api_key_here"
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
OPENROUTER_MODEL="anthropic/claude-3-haiku"

# Web Pixel Configuration
# Secret used to validate incoming pixel requests
PIXEL_COLLECT_SECRET="generate_a_strong_random_secret_string"
PIXEL_COLLECT_ENDPOINT="https://app.yourdomain.com/api/pixel/collect"

# Billing Configuration
# Set to 'false' ONLY when launching for real charges. Leave 'true' for beta testing.
BILLING_TEST_MODE="true"
```
