import { describe, expect, it } from "vitest";
import { formatBlend } from "./labels";

describe("formatBlend", () => {
  it("shows a single origin without a percentage", () => {
    expect(
      formatBlend([{ originId: "ethiopia-yirgacheffe", percentage: 1 }]),
    ).toBe("Ethiopia Yirgacheffe");
  });

  it("shows each origin with its percentage, in order", () => {
    expect(
      formatBlend([
        { originId: "ethiopia-yirgacheffe", percentage: 0.7 },
        { originId: "kenya-nyeri", percentage: 0.3 },
      ]),
    ).toBe("70% Ethiopia Yirgacheffe, 30% Kenya Nyeri");
  });

  it("supports a 3-origin blend", () => {
    expect(
      formatBlend([
        { originId: "ethiopia-yirgacheffe", percentage: 0.5 },
        { originId: "colombia-huila", percentage: 0.3 },
        { originId: "kenya-nyeri", percentage: 0.2 },
      ]),
    ).toBe("50% Ethiopia Yirgacheffe, 30% Colombia Huila, 20% Kenya Nyeri");
  });
});
