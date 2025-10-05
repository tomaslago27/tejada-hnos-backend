export enum UserStatus {
    ACTIVE,
    INACTIVE
}

export interface IUser {
    id?: number;
    username: string;
    password: string;
    status?: UserStatus;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    roleId?: number;
    employeeId?: number;
}
