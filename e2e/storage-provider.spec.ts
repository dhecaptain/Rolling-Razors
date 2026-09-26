import { expect, test } from "@playwright/test";
import { CloudinaryStorageProvider } from "../server/storage/cloudinary";
import { SupabaseStorageProvider } from "../server/storage/supabase";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

test.describe("cloud storage privacy", () => {
  test("Cloudinary stores private uploads as authenticated assets with signed delivery URLs", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const form = init?.body as FormData;
      expect(form.get("type")).toBe("authenticated");
      return new Response(JSON.stringify({
        public_id: "rolling-razors/work-order/wo-1/photo",
        format: "png",
        secure_url: "https://res.cloudinary.com/demo/image/upload/v1/photo.png",
        bytes: png.length,
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as typeof fetch;

    try {
      const provider = new CloudinaryStorageProvider({
        cloudName: "demo",
        apiKey: "test-key",
        apiSecret: "test-secret",
      });
      const result = await provider.upload(png, {
        category: "work-order-before",
        entityId: "wo-1",
        originalFilename: "seat.png",
        mimeType: "image/png",
      });

      expect(result.isPrivate).toBe(true);
      const deliveryUrl = await provider.getSignedUrl(result.key);
      expect(deliveryUrl).toMatch(/\/image\/authenticated\/s--[^/]+--\//);
      expect(deliveryUrl).not.toContain("/image/upload/");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("Supabase does not expose private uploads publicly when URL signing fails", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      return new Response("signing unavailable", { status: 503 });
    }) as typeof fetch;

    try {
      const provider = new SupabaseStorageProvider({
        url: "https://storage.example.test",
        serviceRoleKey: "test-key",
      });
      await expect(provider.getSignedUrl("booking-reference/booking-1/seat.png"))
        .rejects.toThrow(/could not create a private asset URL/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
