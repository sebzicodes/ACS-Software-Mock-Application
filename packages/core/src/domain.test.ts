import { describe, it, expect } from "vitest"
import { badgeLabel } from "./domain.js";
describe("badge-label", () => {
    it("returns cardholder-id and the last and first name of cardholder when id from credential and cardholder are strictly equal" () => {
        expect(badgeLabel(credential = { id: "cr-1", cardNumber: "0048213", cardholderId: "ch-1" })).toBe
    })
})