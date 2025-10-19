import { DataSource } from 'typeorm';
import { Request, Response } from 'express';

export class ActivityLogController {
    private dataSource: DataSource;

    constructor(dataSource: DataSource) {
        this.dataSource = dataSource;
    }

    // Métodos para CRUD
}