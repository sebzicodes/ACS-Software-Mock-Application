
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