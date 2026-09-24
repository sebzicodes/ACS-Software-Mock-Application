import { describe, it, expect } from "vitest"
import { numberOrNull } from "./index.js";
describe("null", () => {
     it("returns absent value for null", () => {
          expect(numberOrNull(null)).toBe("absent value");
     })
     it("returns string for number", () => {
          expect(numberOrNull(5)).toBe("this is 5");
     })
});