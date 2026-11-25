import { test } from "node:test";
import assert from "node:assert/strict";
import { parseOverpass, haversineKm, normalizePhone } from "../lib/nearbyCare";

test("haversine: Delhi to Gurugram is roughly 25 km", () => {
  const d = haversineKm(28.6139, 77.209, 28.4595, 77.0266);
  assert.ok(d > 20 && d < 30, String(d));
});
test("phone normalisation keeps only digits and +", () => {
  assert.equal(normalizePhone("+91 11 2345 6789; 1800"), "+911123456789");
  assert.equal(normalizePhone("12"), undefined);
  assert.equal(normalizePhone(undefined), undefined);
});
test("parses Overpass hospitals and clinics, drops unnamed and non-health items", () => {
  const json = { elements: [
    { type: "node", id: 1, lat: 28.62, lon: 77.21, tags: { amenity: "hospital", name: "City Hospital", phone: "+91 11 1111 2222", "addr:city": "Delhi" } },
    { type: "way", id: 2, center: { lat: 28.70, lon: 77.10 }, tags: { amenity: "clinic", name: "Care Clinic" } },
    { type: "node", id: 3, lat: 28.6, lon: 77.2, tags: { amenity: "hospital" } },
    { type: "node", id: 4, lat: 28.6, lon: 77.2, tags: { amenity: "cafe", name: "Cafe" } },
  ]};
  const sites = parseOverpass(json, 28.6139, 77.209);
  assert.equal(sites.length, 2);
  assert.equal(sites[0].name, "City Hospital");
  assert.equal(sites[0].phone, "+911111112222");
  assert.equal(sites[1].phone, undefined);
  assert.ok(sites[0].distanceKm <= sites[1].distanceKm);
});
test("empty or malformed response returns empty list", () => {
  assert.deepEqual(parseOverpass({}, 0, 0), []);
  assert.deepEqual(parseOverpass(null, 0, 0), []);
});
