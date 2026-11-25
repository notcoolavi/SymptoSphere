import { test } from "node:test";
import assert from "node:assert/strict";
import { validatePhoto, PHOTO_MAX_BYTES } from "../lib/history";

const file = (type: string, size: number) => ({ type, size }) as unknown as File;

test("accepts JPG, PNG and WebP under 5 MB", () => {
  assert.equal(validatePhoto(file("image/jpeg", 1000)), null);
  assert.equal(validatePhoto(file("image/png", 1000)), null);
  assert.equal(validatePhoto(file("image/webp", PHOTO_MAX_BYTES)), null);
});
test("rejects non-image and oversized files", () => {
  assert.ok(validatePhoto(file("application/pdf", 1000)));
  assert.ok(validatePhoto(file("image/gif", 1000)));
  assert.ok(validatePhoto(file("image/jpeg", PHOTO_MAX_BYTES + 1)));
});
test("app works with no Supabase config (guest mode)", async () => {
  const { accountsEnabled, supabase } = await import("../lib/supabase");
  assert.equal(accountsEnabled, false);
  assert.equal(supabase, null);
});
