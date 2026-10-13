import { describe, it, expect } from "vitest"
import { badgeLabel, type Credential } from "./domain.js";
import { isCredentialActive } from "./domain.js";

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
describe("isCredentialActive", () => {
    it("returns true for active status", () => {
        const credential: Credential = { id: "cr-1", cardNumber: "123456", cardholderId: "ch-1", status: "active" };
        const result = isCredentialActive(credential);
        expect(result).toBe(true);
    }) 
    it("returns false for revoked status", () => {
        const credential: Credential = { id: "cr-1", cardNumber: "123456", cardholderId: "ch-1", status: "revoked" };
        const result = isCredentialActive(credential);
        expect(result).toBe(false);
    }) 
    it("returns false for lost status", () => {
        const credential: Credential = { id: "cr-1", cardNumber: "123456", cardholderId: "ch-1", status: "lost" };
        const result = isCredentialActive(credential);
        expect(result).toBe(false);
    })  
    it("returns false for suspended status", () => {
        const credential: Credential = { id: "cr-1", cardNumber: "123456", cardholderId: "ch-1", status: "suspended" };
        const result = isCredentialActive(credential);
        expect(result).toBe(false);
    }) 
})