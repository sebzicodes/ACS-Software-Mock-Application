import { describe, it, expect } from "vitest"
import { badgeLabel, type Credential } from "./domain.js";

describe("badgelabel", () => {
    it("labels badge with linked cardholder", () => {

        const credential: Credential = { id: "cr-1", cardNumber: "0024813", cardholderId: "ch-1", status: "active" };
        
        const cardholder = { id: "ch-1", firstName: "John", lastName: "Smith", employeeId: "0123456" };

        const result = badgeLabel(credential, cardholder);

        expect(result).toBe("0024813 (Smith, John)");
    });
    it("describes badge without linked cardholder", () => {
        const credential: Credential = { id: "cr-1", cardNumber: "0024813", cardholderId: "ch-1", status: "active" };
        
        const cardholder = { id: "ch-2", firstName: "John", lastName: "Smith", employeeId: "0123456" };

        const result = badgeLabel(credential, cardholder);

        expect(result).toBe("0024813 (unknown cardholder)");

    });
    
});