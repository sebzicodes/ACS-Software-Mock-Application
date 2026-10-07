export type Cardholder = {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
};
export type Credential = {
    id: string;
    cardNumber: string;
    cardholderId: string;
};
export function badgeLabel(credential: Credential, cardholder: Cardholder): string {
    if(credential.id === cardholder.id) {
        return credential.cardholderId + cardholder.lastName + cardholder.firstName; 
    }
    return "Unknown Cardholder";
}