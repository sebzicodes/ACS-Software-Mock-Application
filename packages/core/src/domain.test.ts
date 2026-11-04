import { describe, it, expect } from "vitest"
import { badgeLabel, type Credential } from "./domain.js";
import { isCredentialActive } from "./domain.js";
import { controllerForReader, type Controller , type Reader} from "./domain.js";

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
describe("controllerForReader", () => {
    it("returns controller for reader upon match", () => {
        const controllers: Controller[] = [
            { id:"03", name: "Con03" }, { id:"02", name: "Con02" },
        ];
        const reader : Reader = {
            id: "re02", name: "Reader 02", controllerId: "02", timezone: "UTC"
        };
        const result = controllerForReader(reader, controllers);
        expect(result).toBe(controllers[1]);
    });
    it("returns null for no matching controllers/readers", () => {
        const controllers: Controller[] = [
            { id:"03", name: "Con03" }, { id:"02", name: "Con02" },
        ];
        const reader : Reader = {
            id: "re04", name: "Reader 04", controllerId: "04", timezone: "UTC"
        };
        const result = controllerForReader(reader, controllers);
        expect(result).toBe(null);
    });
    it("returns null for empty controller array", () => {
        const controllers: Controller[] = [];
        const reader : Reader = {
            id: "re02", name: "Reader 03", controllerId: "02", timezone: "UTC"
        };
        const result = controllerForReader(reader, controllers);
        expect(result).toBe(null);
    });
    it("returns controller for multiple readers upon match", () => {
        const controllers: Controller[] = [
            { id:"01", name: "Con01" }, { id:"02", name: "Con02" }, { id:"03", name: "Con03" }, { id:"04", name: "Con04" },
        ];
        const reader1 : Reader = {
            id: "re01", name: "Reader 01", controllerId: "01", timezone: "UTC"
        };
        const reader2 : Reader = {
            id: "re02", name: "Reader 02", controllerId: "02", timezone: "UTC"
        };
        const result1 = controllerForReader(reader1, controllers);
        expect(result1).toBe(controllers[0]);
        const result2 = controllerForReader(reader2, controllers);
        expect(result2).toBe(controllers[1]);
    });
    
})