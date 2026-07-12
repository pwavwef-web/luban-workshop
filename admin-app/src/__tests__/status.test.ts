import { describe, expect, it } from "vitest";
import { canTransitionOrderStatus, normalizeOrderStatus, normalizeReservationStatus } from "@/lib/status";

describe("status transitions", () => {
  it("allows legacy order transitions", () => {
    expect(canTransitionOrderStatus("requested", "accepted")).toBe(true);
    expect(canTransitionOrderStatus("requested", "rejected")).toBe(true);
    expect(canTransitionOrderStatus("accepted", "preparing")).toBe(true);
    expect(canTransitionOrderStatus("preparing", "completed")).toBe(true);
    expect(canTransitionOrderStatus("completed", "pending")).toBe(true);
  });

  it("blocks unsafe order transitions", () => {
    expect(canTransitionOrderStatus("requested", "completed")).toBe(false);
    expect(canTransitionOrderStatus("rejected", "pending")).toBe(false);
  });

  it("normalizes unknown statuses", () => {
    expect(normalizeOrderStatus("")).toBe("pending");
    expect(normalizeReservationStatus("completed")).toBe("confirmed");
    expect(normalizeReservationStatus("nonsense")).toBe("pending");
  });
});
