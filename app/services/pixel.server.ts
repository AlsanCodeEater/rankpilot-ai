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
  // Check if pixel is already active — but verify against Shopify, not just our
  // DB: a reinstall deletes the store's web pixel while our row still says
  // "active", which left stores stuck on "Disconnected" with no way to fix it.
  const existingInstall = await getPixelInstall(shop);
  if (existingInstall?.status === "active" && existingInstall.webPixelId) {
    try {
      const res = await admin.graphql(`#graphql\n      query { webPixel { id } }`);
      const data = await res.json();
      if (data.data?.webPixel?.id) {
        return { success: true, pixel: existingInstall };
      }
    } catch (e) {
      // fall through and recreate
    }
    await prisma.pixelInstall.update({ where: { shop }, data: { status: "inactive" } });
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
    // If Shopify says a pixel already exists, adopt it instead of failing.
    const taken = errors.some((e: { code?: string; message?: string }) =>
      e.code === "TAKEN" || /already exists/i.test(e.message || ""));
    if (taken) {
      const res = await admin.graphql(`#graphql\n      query { webPixel { id } }`);
      const data = await res.json();
      const id = data.data?.webPixel?.id;
      if (id) {
        const pixel = await prisma.pixelInstall.upsert({
          where: { shop },
          update: { webPixelId: id, endpoint, secretHash: hashedSecret, status: "active" },
          create: { shop, webPixelId: id, endpoint, secretHash: hashedSecret, status: "active" },
        });
        return { success: true, pixel };
      }
    }
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
