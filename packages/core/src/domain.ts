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
