import { DataSource, Repository, In } from 'typeorm';
import { Activity } from '@/entities/activity.entity';
import { WorkOrder } from '@/entities/work-order.entity';
import { Input } from '@/entities/input.entity';
import { InputUsage } from '@/entities/input-usage.entity';
import { CreateActivityDto, UpdateActivityDto } from '@/dtos/activity.dto';
import { ActivityFilters } from '@/interfaces/filters.interface';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';

export class ActivityService {
    private activityRepository: Repository<Activity>;
    private workOrderRepository: Repository<WorkOrder>;
    private inputRepository: Repository<Input>;
    private inputUsageRepository: Repository<InputUsage>;

    constructor(dataSource: DataSource) {
        this.activityRepository = dataSource.getRepository(Activity);
        this.workOrderRepository = dataSource.getRepository(WorkOrder);
        this.inputRepository = dataSource.getRepository(Input);
        this.inputUsageRepository = dataSource.getRepository(InputUsage);
    }

    /**
     * Crear una nueva actividad
     * @param activityData CreateActivityDto
     * @returns Promise<Activity>
     */
    public async create(activityData: CreateActivityDto): Promise<Activity> {
        const { workOrderId, inputsUsed, ...activityFields } = activityData;

        if (!workOrderId) {
            throw new HttpException(StatusCodes.BAD_REQUEST, "El ID de la orden de trabajo es requerido.");
        }

        const workOrder = await this.workOrderRepository.findOne({ where: { id: workOrderId } });
        if (!workOrder) {
            throw new HttpException(StatusCodes.NOT_FOUND, "La orden de trabajo no fue encontrada.");
        }

        const newActivity = this.activityRepository.create({
            ...activityFields,
            workOrderId: workOrderId,
            workOrder: workOrder,
        });

        if (inputsUsed && inputsUsed.length > 0) {
            const inputIds = inputsUsed.map(usage => usage.inputId);
            const inputs = await this.inputRepository.findBy({ id: In(inputIds) });
            
            if (inputs.length !== inputIds.length) {
                throw new HttpException(StatusCodes.NOT_FOUND, "Uno o más insumos no fueron encontrados.");
            }

            newActivity.inputsUsed = inputsUsed.map(usageDto => 
                this.inputUsageRepository.create({
                    inputId: usageDto.inputId,
                    quantityUsed: usageDto.quantityUsed,
                })
            );
        }

        return await this.activityRepository.save(newActivity);
    }

    /**
     * Obtener todas las actividades con filtros opcionales
     * @param filters Filtros opcionales para la búsqueda
     * @returns Promise<Activity[]>
     * 
     * Ejemplos de uso:
     * - findAll() → Todas las actividades
     * - findAll({ type: 'RIEGO' }) → Solo actividades de riego
     * - findAll({ workOrderId: '123' }) → Actividades de una orden específica
     * - findAll({ startDate: new Date('2025-10-01'), endDate: new Date('2025-10-31') }) → Por rango de fechas
     */
    public async findAll(filters?: ActivityFilters): Promise<Activity[]> {
        const queryBuilder = this.activityRepository
            .createQueryBuilder('activity')
            .leftJoinAndSelect('activity.workOrder', 'workOrder')
            .leftJoinAndSelect('activity.inputsUsed', 'inputsUsed')
            .leftJoinAndSelect('inputsUsed.input', 'input');

        if (filters) {
            if (filters.workOrderId) {
                queryBuilder.andWhere('activity.workOrderId = :workOrderId', {
                    workOrderId: filters.workOrderId
                });
            }

            if (filters.type) {
                queryBuilder.andWhere('activity.type = :type', {
                    type: filters.type
                });
            }

            if (filters.startDate) {
                queryBuilder.andWhere('activity.executionDate >= :startDate', {
                    startDate: filters.startDate
                });
            }

            if (filters.endDate) {
                queryBuilder.andWhere('activity.executionDate <= :endDate', {
                    endDate: filters.endDate
                });
            }
        }

        queryBuilder.orderBy('activity.executionDate', 'DESC');

        return await queryBuilder.getMany();
    }

    /**
     * Buscar una actividad por su ID
     * @param id ID de la actividad
     * @returns Promise<Activity>
     */
    public async findById(id: string): Promise<Activity> {
        const activity = await this.activityRepository.findOne({
            where: { id },
            relations: ['workOrder', 'inputsUsed', 'inputsUsed.input']
        });

        if (!activity) {
            throw new HttpException(StatusCodes.NOT_FOUND, "La actividad no fue encontrada.");
        }

        return activity;
    }

    /**
     * Actualizar una actividad por su ID
     * @param id ID de la actividad
     * @param activityData UpdateActivityDto
     * @returns Promise<Activity>
     */
    public async update(id: string, activityData: UpdateActivityDto): Promise<Activity> {
        const activity = await this.findById(id);
        const { workOrderId, inputsUsed, ...activityFields } = activityData;

        this.activityRepository.merge(activity, activityFields);

        if (workOrderId !== undefined) {
            const workOrder = await this.workOrderRepository.findOne({ where: { id: workOrderId } });
            if (!workOrder) {
                throw new HttpException(StatusCodes.NOT_FOUND, "La orden de trabajo no fue encontrada.");
            }
            activity.workOrderId = workOrderId;
            activity.workOrder = workOrder;
        }

        if (inputsUsed !== undefined) {
            if (inputsUsed.length > 0) {
                const inputIds = inputsUsed.map(usage => usage.inputId);
                const inputs = await this.inputRepository.findBy({ id: In(inputIds) });
                
                if (inputs.length !== inputIds.length) {
                    throw new HttpException(StatusCodes.NOT_FOUND, "Uno o más insumos no fueron encontrados.");
                }

                activity.inputsUsed = inputsUsed.map(usageDto => 
                    this.inputUsageRepository.create({
                        inputId: usageDto.inputId,
                        quantityUsed: usageDto.quantityUsed,
                    })
                );
            } else {
                activity.inputsUsed = [];
            }
        }

        return await this.activityRepository.save(activity);
    }

    /**
     * Eliminar una actividad por su ID (soft delete)
     * @param id ID de la actividad
     * @returns Promise<Activity> La actividad eliminada
     */
    public async delete(id: string): Promise<Activity> {
        const activity = await this.findById(id);
        return await this.activityRepository.softRemove(activity);
    }

    /**
     * Restaurar una actividad por su ID
     * @param id ID de la actividad a restaurar
     * @returns Promise<Activity> La actividad restaurada
     */
    public async restore(id: string): Promise<Activity> {
        const activity = await this.activityRepository.findOne({
            where: { id },
            withDeleted: true,
        });

        if (!activity) {
            throw new HttpException(StatusCodes.NOT_FOUND, "La actividad no fue encontrada.");
        }

        return await this.activityRepository.recover(activity);
    }

    /**
     * Eliminar una actividad por su ID (hard delete)
     * @param id ID de la actividad a eliminar de la base de datos
     * @returns Promise<Activity> La actividad eliminada permanentemente
     */
    public async hardDelete(id: string): Promise<Activity> {
        const activity = await this.activityRepository.findOne({
            where: { id },
            withDeleted: true,
        });

        if (!activity) {
            throw new HttpException(StatusCodes.NOT_FOUND, "La actividad no fue encontrada.");
        }

        return await this.activityRepository.remove(activity);
    }
}
