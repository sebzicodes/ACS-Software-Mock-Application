import { describe, it, expect } from "./index.ts";

describe("null", () => {
     it("returns absent value", () => {
          expect(value(null)).toBe("absent value");
     });
});