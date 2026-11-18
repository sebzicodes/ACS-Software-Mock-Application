import { describe, it, expect } from "vitest";
import { badgeLabel, type Credential } from "./domain.js";
import { isCredentialActive } from "./domain.js";
import { controllerForReader, type Controller , type Reader} from "./domain.js";
import { isWithinSchedule, type Schedule } from "./domain.js";
import { grantsAccess, type AccessLevel } from "./domain.js";

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
describe("isWithinSchedule", () => {
    it("returns true when minute equals start", () => {
        const weekDay : Schedule = {
            id: "",
            name: "workweek",
            windows: [ {
                days: ["mon", "tue", "wed", "thu", "fri"],
                start: 420,
                end: 1080
            }]
        }
        const result = isWithinSchedule(weekDay, "mon", 420);
        expect(result).toBe(true);
    })
    it("returns true when minute is between start and end", () => {
        const weekDay : Schedule = {
            id: "",
            name: "workweek",
            windows: [ {
                days: ["mon", "tue", "wed", "thu", "fri"],
                start: 420,
                end: 1080
            }]
        }
        const result = isWithinSchedule(weekDay, "mon", 1079);
        expect(result).toBe(true);
    })
    it("returns false when minute equals end", () => {
        const weekDay : Schedule = {
            id: "",
            name: "workweek",
            windows: [ {
                days: ["mon", "tue", "wed", "thu", "fri"],
                start: 420,
                end: 1080
            }]
        }
        const result = isWithinSchedule(weekDay, "mon", 1080);
        expect(result).toBe(false);
    })
    it("returns false when day is outside window", () => {
        const weekDay : Schedule = {
            id: "",
            name: "workweek",
            windows: [ {
                days: ["mon", "tue", "wed", "thu", "fri"],
                start: 420,
                end: 1080
            }]
        }
        const result = isWithinSchedule(weekDay, "sat", 600);
        expect(result).toBe(false);
    })
    it("Allows saturday match with second window", () => {
        const withSaturday : Schedule = {
            id: "",
            name: "workweek + Saturday",
            windows: [ {
                days: ["mon", "tue", "wed", "thu", "fri"],
                start: 420,
                end: 1080
            }, {
                days: ["sat"],
                start: 480,
                end: 720
            } ]
        }
        const result = isWithinSchedule(withSaturday, "sat", 600);
        expect(result).toBe(true);
    })
    it("returns true when minute is before midnight", () => {
        const graveyard : Schedule = {
            id: "",
            name: "night",
            windows: [{
                days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
                start: 1320,
                end: 1440
            }, {
                days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
                start: 0,
                end: 360
            }]
        }
        const result = isWithinSchedule(graveyard, "tue", 1380 );
        expect(result).toBe(true);
    })
    it("returns true when minute is past midnight", () => {
        const graveyard : Schedule = {
            id: "",
            name: "night",
            windows: [{
                days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
                start: 1320,
                end: 1440
            }, {
                days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
                start: 0,
                end: 360
            }]
        }
        const result = isWithinSchedule(graveyard, "wed", 120);
        expect(result).toBe(true);
    })
    it("returns false when minute is past end", () => {
        const graveyard : Schedule = {
            id: "",
            name: "night",
            windows: [{
                days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
                start: 1320,
                end: 1440
            }, {
                days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
                start: 0,
                end: 360
            }]
        }
        const result = isWithinSchedule(graveyard, "wed", 360);
        expect(result).toBe(false);
    })
    it("returns false when window is empty", () => {
        const noWindows : Schedule = {
            id: "",
            name: "workweek",
            windows: []
        }
        const result = isWithinSchedule(noWindows, "mon", 600 );
        expect(result).toBe(false);
    })
})
describe("grantsAccess", () => {
    it("Grants when the reader’s schedule covers the time", () => {
        const workWeek : Schedule = {
            id: "ww-2",
            name: "work-week-swing",
            windows: [{
                days: ["mon", "tue", "wed", "thu", "fri"],
                start: 780,
                end: 1380
            }]
        }
        const access : AccessLevel = {
            id: "al-sec",
            name: "access-level-security",
            entries: [{
                readerId: "fr-1",
                scheduleId: "ww-2"
            }]
        }
        const result = grantsAccess(access, "fr-1", "mon", 780, [workWeek]);
        expect(result).toBe(true);
    })
    it("Denies when the reader’s schedule doesn’t cover the time", () => {
        const workWeek : Schedule = {
            id: "ww-2",
            name: "work-week-swing",
            windows: [{
                days: ["mon", "tue", "wed", "thu", "fri"],
                start: 780,
                end: 1380
            }]
        }
        const access : AccessLevel = {
            id: "al-sec",
            name: "access-level-security",
            entries: [{
                readerId: "fr-1",
                scheduleId: "ww-2"
            }]
        }
        const result = grantsAccess(access, "fr-1", "mon", 750, [workWeek]);
        expect(result).toBe(false);
    })
    it("Denies when the level has no entry for the readerId", () => {
        const workWeek : Schedule = {
            id: "ww-2",
            name: "work-week-swing",
            windows: [{
                days: ["mon", "tue", "wed", "thu", "fri"],
                start: 780,
                end: 1380
            }]
        }
        const access : AccessLevel = {
            id: "al-sec",
            name: "access-level-security",
            entries: [{
                readerId: "",
                scheduleId: "ww-2"
            }]
        }
        const result = grantsAccess(access, "fr-1", "mon", 750, [workWeek]);
        expect(result).toBe(false);
    })
    it("Denies when the entry’s scheduleId isn’t in schedules", () => {
        const workWeek : Schedule = {
            id: "ww-2",
            name: "work-week-swing",
            windows: [{
                days: ["mon", "tue", "wed", "thu", "fri"],
                start: 780,
                end: 1380
            }]
        }
        const access : AccessLevel = {
            id: "al-sec",
            name: "access-level-security",
            entries: [{
                readerId: "fr-1",
                scheduleId: "ww-2"
            }]
        }
        const result = grantsAccess(access, "fr-2", "mon", 750, [workWeek]);
        expect(result).toBe(false);
    })
    it("Grants on reader’s second assigned schedule when first doesnt cover", () => {
        const  workWeekDay: Schedule = {
            id: "ww-1",
            name: "work-week-1",
            windows: [{
                days: ["mon", "tue", "wed", "thu", "fri"],
                start: 420,
                end: 780
            }]
        }
        const workWeekSwing: Schedule = {
            id: "ww-2",
            name: "work-week-2",
            windows: [{
                days: ["mon", "tue", "wed", "thu", "fri"],
                start: 780,
                end: 1380
            }]
        }
        const access : AccessLevel = {
            id: "al-sec",
            name: "access-level-security",
            entries: [{
                readerId: "fr-1",
                scheduleId: "ww-1"
            }, {
                readerId: "fr-1",
                scheduleId: "ww-2"
            }]
        }
        const result = grantsAccess(access, "fr-1", "mon", 790, [workWeekDay, workWeekSwing]);
        expect(result).toBe(true);
    })
    it("Denies at the lobby when only the garage has a 24/7 entry", () => {
        const  workWeekDay: Schedule = {
            id: "ww-1",
            name: "work-week-1",
            windows: [{
                days: ["mon", "tue", "wed", "thu", "fri"],
                start: 420,
                end: 780
            }] 
        }
        const workWeekFull: Schedule = {
            id: "ww-24-7",
            name: "work-week-24-7",
            windows: [{
                days: ["mon", "tue", "wed", "thu", "fri"],
                start: 0,
                end: 500
            }, {
                days: ["mon", "tue", "wed", "thu", "fri"],
                start: 500,
                end: 1440
            }]
        }
        const access : AccessLevel = {
            id: "al-sec",
            name: "access-level-security",
            entries: [{
                readerId: "fr-1",
                scheduleId: "ww-1"
            }, {
                readerId: "g-1",
                scheduleId: "ww-24-7"
            }]
        }
        const result = grantsAccess(access, "fr-1", "mon", 1380, [workWeekDay, workWeekFull]);
        expect(result).toBe(false);
    })
    it("Denies when entries is empty", () => {
        const workWeek : Schedule = {
            id: "ww-2",
            name: "work-week-swing",
            windows: [{
                days: ["mon", "tue", "wed", "thu", "fri"],
                start: 780,
                end: 1380
            }]
        }
        const access : AccessLevel = {
            id: "al-sec",
            name: "access-level-security",
            entries: []
        }
        const result = grantsAccess(access, "fr-1", "mon", 750, [workWeek]);
        expect(result).toBe(false);
    })
})