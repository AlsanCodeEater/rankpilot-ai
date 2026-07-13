import prisma from "../db.server";
import crypto from "crypto";

export async function getPixelInstall(shop: string) {
  return prisma.pixelInstall.findUnique({
    where: { shop },
  });
}

export function createPixelSecret() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSecret(secret: string) {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export async function activateWebPixel(admin: any, shop: string) {
  // Check if pixel is already active
  const existingInstall = await getPixelInstall(shop);
  if (existingInstall?.status === "active" && existingInstall.webPixelId) {
    return { success: true, pixel: existingInstall };
  }

  // Generate a secret
  const secret = createPixelSecret();
  const hashedSecret = hashSecret(secret);
  
  // Use PIXEL_COLLECT_ENDPOINT if set, otherwise fallback to SHOPIFY_APP_URL
  const appUrl = process.env.SHOPIFY_APP_URL;
  if (!appUrl) throw new Error("SHOPIFY_APP_URL is not set");
  const endpoint = process.env.PIXEL_COLLECT_ENDPOINT || `${appUrl}/api/pixel/collect`;

  const webPixelInput = {
    settings: JSON.stringify({
      shop,
      endpoint,
      secret,
    }),
  };

  const response = await admin.graphql(
    `#graphql
    mutation WebPixelCreate($webPixel: WebPixelInput!) {
      webPixelCreate(webPixel: $webPixel) {
        userErrors {
          field
          message
          code
        }
        webPixel {
          id
          settings
        }
      }
    }`,
    {
      variables: {
        webPixel: webPixelInput,
      },
    }
  );

  const parsedData = await response.json();
  const errors = parsedData.data?.webPixelCreate?.userErrors;

  if (errors && errors.length > 0) {
    throw new Error(`Web Pixel Create Error: ${errors[0].message}`);
  }

  const webPixelId = parsedData.data?.webPixelCreate?.webPixel?.id;

  const pixel = await prisma.pixelInstall.upsert({
    where: { shop },
    update: {
      webPixelId,
      endpoint,
      secretHash: hashedSecret,
      status: "active",
    },
    create: {
      shop,
      webPixelId,
      endpoint,
      secretHash: hashedSecret,
      status: "active",
    },
  });

  return { success: true, pixel };
}

export function validatePixelRequest(payloadSecret: string, storedSecretHash: string) {
  const incomingHash = hashSecret(payloadSecret);
  return crypto.timingSafeEqual(Buffer.from(incomingHash), Buffer.from(storedSecretHash));
}
