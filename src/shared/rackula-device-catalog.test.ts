import { describe, expect, it } from "vitest";
import { findRackulaDeviceTemplate, rackulaGenericDeviceTypes } from "./rackula-device-catalog";

describe("rackula device catalog", () => {
  it("imports the Rackula generic starter library", () => {
    expect(rackulaGenericDeviceTypes).toHaveLength(64);
    expect(findRackulaDeviceTemplate("1u-server")?.model).toBe("Server");
    expect(findRackulaDeviceTemplate("48-port-switch")?.category).toBe("network");
    expect(findRackulaDeviceTemplate("1u-half-switch")?.slotWidth).toBe(1);
  });

  it("preserves Rackula container slot metadata", () => {
    const carrier = findRackulaDeviceTemplate("carrier-1u-2x2");

    expect(carrier?.subdeviceRole).toBe("parent");
    expect(carrier?.slots).toHaveLength(4);
    expect(carrier?.slots?.[0]).toMatchObject({
      id: "r0-c0",
      widthFraction: 0.5,
      heightUnits: 0.5
    });
  });
});
