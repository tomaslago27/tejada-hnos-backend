import { DataSource, Repository } from 'typeorm';
import { Request, Response } from 'express';
import { ActivityLog } from '@entities/activity-log.entity';

export class ActivityLogController {
    private dataSource: DataSource;
    private activityLogRepository: Repository<ActivityLog>;

    constructor(dataSource: DataSource) {
        this.dataSource = dataSource;
        // Se inicializa el repositorio para poder interactuar con la tabla 'activity_logs'
        this.activityLogRepository = this.dataSource.getRepository(ActivityLog);
    }

    // Se añade el método para crear un nuevo registro de actividad
    create = async (req: Request, res: Response) => {
        // 1. Se extrae los datos del cuerpos de la petición
        const { activityType, description, executionDate, plotId, createdByUserId } = req.body;

        // 2. Se crea una nueva instancia de ActivityLog cons los datos recibidos
        const newActivityLog = this.activityLogRepository.create({
            activityType,
            description,
            executionDate,
            plot: { id: plotId},
            createdByUser: { id: createdByUserId }
        });

        // 3. Se guarda la nueva instancia en la base de datos
        await this.activityLogRepository.save(newActivityLog);

        // 4. Se envía una respuesta exitosa
        return res.status(201).json({
            message: 'Registro de actividad creado exitosamente',
            data: newActivityLog,
        });
    };

    // Métodos para CRUD
}