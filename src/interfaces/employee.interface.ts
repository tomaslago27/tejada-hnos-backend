export interface IEmployee {
    id?: number;
    firstName: string;
    lastName: string;
    dni: string;
    email?: string;
    phone?: string;
    position?: string;
    salary?: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
