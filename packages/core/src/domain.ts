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
export function bridgeLabel(Credential: string | Cardholder : string) {
    if(Credential === Cardholder) {
        
    }
}