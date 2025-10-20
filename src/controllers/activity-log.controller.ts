import { DataSource } from 'typeorm';
import { Request, Response } from 'express';
import { ActivityLogService } from '@/services/activity-log.service';

export class ActivityLogController {
    private activityLogService: ActivityLogService;

    constructor(dataSource: DataSource) {
        // Se inicializa el repositorio para poder interactuar con la tabla 'activity_logs'
        this.activityLogService = new ActivityLogService(dataSource);
    }

    // Se añade el método para crear un nuevo registro de actividad
    create = async (req: Request, res: Response) => {
        // 1. Se crea una nueva instancia de ActivityLog cons los datos recibidos
        const newActivityLog = await this.activityLogService.create(req.body);

        // 2. Se envía una respuesta exitosa
        return res.status(201).json({ message: 'Registro creado exitosamente', data: newActivityLog });
    };

    // Se añade el método para obtener todos los registros de actividad
    getAll = async (req: Request, res: Response) => {
        // 1. Se usa el repositorio para obtener todos los registros de actividad
        const activityLogs = await this.activityLogService.findAll();

        // 2. Se envía una respuesta con los registros obtenidos
        return res.status(200).json({ data: activityLogs });
    };

    // Se añade el método para obtener un registro de actividad por ID
    getById = async (req: Request, res: Response) => {
        // 1. Se obtiene el ID desde los parámetros de la URL
        const { id } = req.params;

        // 2. Validar si el ID fue proporcionado por la URL
        if (!id) return res.status(400).json({ message: 'No se proporcionó un ID' });

        // 3. Se usa el repositorio para buscar un solo registro de actividad por su ID
        const activityLog = await this.activityLogService.findById(id);

        // 4. Se verifica si se encontró el registro
        if (!activityLog) return res.status(404).json({ message: 'Registro no encontrado' });

        // 5. Si se lo encuentra, se envía una respuesta con el registro obtenido
        return res.status(200).json({ data: activityLog });
    };

    // Se añade método para actualizar un registro de actividad por ID
    update = async (req: Request, res: Response) => {
        // 1. Se obtiene el ID desde los parámetros de la URL
        const { id } = req.params;

        // 2. Se valida si el ID fue proporcionado en la URL
        if (!id) return res.status(400).json({ message: 'No se proporcionó un ID' });

        // 3. Se busca el registro actualizado
        const updatedLog = await this.activityLogService.update(id, req.body);

        // 4. Se envía una respuesta con el registro actualizado
        return res.status(200).json({ message: 'Registro actualizado exitosamente', data: updatedLog });
    };

    // Se añade el método para eliminar un registro de actividad por ID
    delete = async (req: Request, res: Response) => {
        // 1. Se obtiene el ID desde los parámetros de la URL
        const { id } = req.params;

        // 2. Se valida si el ID fue proporcionado en la URL
        if (!id) return res.status(400).json({ message: 'No se proporcionó un ID' });

        // 3. Se usa el repositorio para eliminar el registro de actividad
        await this.activityLogService.delete(id);

        // 4. Se envía una respuesta de éxito
        return res.status(204).send();
    };
}