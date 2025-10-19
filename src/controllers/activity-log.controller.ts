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

    // Se añade el método para obtener todos los registros de actividad
    getAll = async (req: Request, res: Response) => {
        // 1. Se usa el repositorio para obtener todos los registros de actividad
        const activityLogs = await this.activityLogRepository.find();

        // 2. Se envía una respuesta con los registros obtenidos
        return res.status(200).json({
            message: 'Registros de actividad obtenidos exitosamente',
            data: activityLogs,
        });
    };

    // Se añade el método para obtener un registro de actividad por ID
    getById = async (req: Request, res: Response) => {
        // 1. Se obtiene el ID desde los parámetros de la URL
        const { id: activityId} = req.params;

        // 2. Validar si el ID fue proporcionado por la URL
        if (!activityId) {
            // Si no hay ID, se envía una respuesta de error
            return res.status(400).json({
                message: 'No se proporcionó un ID de registro',
            });
        }

        // 3. Se usa el repositorio para buscar un solo registro de actividad por su ID
        const activityLog = await this.activityLogRepository.findOneBy({
            id: activityId,
        });

        // 4. Se verifica si se encontró el registro
        if (!activityLog) {
            // si no se encontró, se envía una respuesta de error
            return res.status(404).json({
                message: 'Registro de actividad no encontrado',
            });
        }

        // 5. Si se lo encuentra, se envía una respuesta con el registro obtenido
        return res.status(200).json({
            message: 'Registro de actividad obtenido exitosamente',
            data: activityLog,
        });
    };

    // Se añade método para actualizar un registro de actividad por ID
    update = async (req: Request, res: Response) => {
        // Se obtiene el ID desde los parámetros de la URL
        const { id: activityId } = req.params;
        const activityData = req.body;

        // 2. Se valida si el ID fue proporcionado en la URL
        if (!activityId) {
            // Si no hay ID, se envía una respuesta de error
            return res.status(400).json({
                message: 'No se proporcionó un ID de registro',
            });
        }

        // 3. Se usa el repositorio para actualizar el registro de actividad
        await this.activityLogRepository.update(activityId, activityData);

        // 4. Se busca el registro actualizado
        const updatedActivityLog = await this.activityLogRepository.findOneBy({
            id: activityId
        });
        // 5. Se envía una respuesta con el registro actualizado
        return res.status(200).json({
            message: 'Registro de actividad actualizado exitosamente',
            data: updatedActivityLog,
        });
    };

    // Se añade el método para eliminar un registro de actividad por ID
    delete = async (req: Request, res: Response) => {
        // 1. Se obtiene el ID desde los parámetros de la URL
        const { id: activityId } = req.params;

        // 2. Se valida si el ID fue proporcionado en la URL
        if (!activityId) {
            // Si no hay ID, se envía una respuesta de error
            return res.status(400).json({
                message: 'No se proporcionó un ID de registro',
            });
        }

        // 3. Se usa el repositorio para eliminar el registro de actividad
        await this.activityLogRepository.delete(activityId);

        // 4. Se envía una respuesta de éxito
        return res.status(204).send();
    };
}