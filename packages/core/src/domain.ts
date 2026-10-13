export type Cardholder = {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
};
export type CredentialStatus = "active" | "suspended" | "lost" | "revoked";
export type Credential = {
    id: string;
    cardNumber: string;
    cardholderId: string;
    status: CredentialStatus;
};
export function badgeLabel(credential: Credential, cardholder: Cardholder): string {
    if(credential.cardholderId === cardholder.id) {
        return credential.cardNumber  + " (" + cardholder.lastName + ", " 
        + cardholder.firstName + ")"; 
    }
    return credential.cardNumber + " (unknown cardholder)";
};
export function isCredentialActive(credential: Credential): boolean {
    if(credential.status === "active") {
        return true;
    }
    return false;
}
export type Controller = {
  id: string;
  name: string;
};

export type Reader = {
  id: string;
  name: string;
  controllerId: string; // refers to Controller.id
  timezone: string;     // IANA name, e.g. "America/Chicago"
};