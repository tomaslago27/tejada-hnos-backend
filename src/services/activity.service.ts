import { DataSource, Repository, In } from 'typeorm';
import { Activity } from '@/entities/activity.entity';
import { WorkOrder } from '@/entities/work-order.entity';
import { Input } from '@/entities/input.entity';
import { InputUsage } from '@/entities/input-usage.entity';
import { CreateActivityDto, UpdateActivityDto } from '@/dtos/activity.dto';
import { ActivityFilters } from '@/interfaces/filters.interface';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';
import { ActivityStatus } from '@/enums';

export class ActivityService {
    private activityRepository: Repository<Activity>;
    private workOrderRepository: Repository<WorkOrder>;
    private inputRepository: Repository<Input>;
    private inputUsageRepository: Repository<InputUsage>;
    private dataSource: DataSource;

    constructor(dataSource: DataSource) {
        this.dataSource = dataSource;
        this.activityRepository = dataSource.getRepository(Activity);
        this.workOrderRepository = dataSource.getRepository(WorkOrder);
        this.inputRepository = dataSource.getRepository(Input);
        this.inputUsageRepository = dataSource.getRepository(InputUsage);
    }

    /**
     * Crear una nueva actividad
     * IMPORTANTE: Si la actividad se crea con status APPROVED, se descuenta stock inmediatamente
     * Si se crea con status PENDING, el stock NO se descuenta hasta que sea aprobada
     * 
     * @param activityData CreateActivityDto
     * @returns Promise<Activity>
     */
    public async create(activityData: CreateActivityDto): Promise<Activity> {
        const { workOrderId, inputsUsed, status, ...activityFields } = activityData;

        if (!workOrderId) {
            throw new HttpException(StatusCodes.BAD_REQUEST, "El ID de la orden de trabajo es requerido.");
        }

        // Usar transacción para garantizar consistencia
        return await this.dataSource.transaction(async (transactionalEntityManager) => {
            const workOrder = await transactionalEntityManager.findOne(WorkOrder, { 
                where: { id: workOrderId } 
            });
            
            if (!workOrder) {
                throw new HttpException(StatusCodes.NOT_FOUND, "La orden de trabajo no fue encontrada.");
            }

            const newActivity = this.activityRepository.create({
                ...activityFields,
                status: status || ActivityStatus.PENDING,
                workOrderId: workOrderId,
                workOrder: workOrder,
            });

            // Si hay inputs y el status es APPROVED, validar y descontar stock
            if (inputsUsed && inputsUsed.length > 0) {
                const inputIds = inputsUsed.map(usage => usage.inputId);
                const inputs = await transactionalEntityManager.findBy(Input, { id: In(inputIds) });
                
                if (inputs.length !== inputIds.length) {
                    throw new HttpException(
                        StatusCodes.NOT_FOUND, 
                        "Uno o más insumos no fueron encontrados."
                    );
                }

                // Si la actividad se crea como APPROVED, validar y descontar stock
                if (status === ActivityStatus.APPROVED) {
                    await this.validateAndDeductStock(inputsUsed, inputs, transactionalEntityManager);
                }

                // Crear InputUsages capturando el costo histórico del Input al momento de la transacción
                newActivity.inputsUsed = inputsUsed.map(usageDto => {
                    const input = inputs.find(i => i.id === usageDto.inputId);
                    const historicCost = input ? Number(input.costPerUnit || 0) : 0;
                    
                    return this.inputUsageRepository.create({
                        inputId: usageDto.inputId,
                        quantityUsed: usageDto.quantityUsed,
                        historicCostPerUnit: historicCost, // Capturar costo histórico para precisión en reportes
                    });
                });
            }

            // Guardar la actividad (cascade guardará los InputUsage)
            const savedActivity = await transactionalEntityManager.save(Activity, newActivity);
            
            // Recargar con relaciones para retornar datos completos
            return await transactionalEntityManager.findOne(Activity, {
                where: { id: savedActivity.id },
                relations: ['workOrder', 'inputsUsed', 'inputsUsed.input']
            }) as Activity;
        });
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
            .leftJoinAndSelect('workOrder.plots', 'plots')
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

            // Filtro especial para CAPATAZ con campos gestionados
            if (filters.managedFieldIds && filters.managedFieldIds.length > 0) {
                // CAPATAZ ve actividades de OTs con parcelas en sus campos gestionados
                // O (si se especifica) OTs asignadas a un usuario específico
                if (filters.assignedToId) {
                    queryBuilder.andWhere(
                        '(plots.fieldId IN (:...managedFieldIds) OR workOrder.assignedToId = :assignedToId)',
                        { 
                            managedFieldIds: filters.managedFieldIds,
                            assignedToId: filters.assignedToId
                        }
                    );
                } else {
                    // Solo filtrar por campos gestionados (sin filtro de assignedToId)
                    queryBuilder.andWhere('plots.fieldId IN (:...managedFieldIds)', {
                        managedFieldIds: filters.managedFieldIds
                    });
                }
            } else if (filters.assignedToId) {
                // Filtro para OPERARIO o CAPATAZ sin campos: Solo actividades de OTs asignadas
                queryBuilder.andWhere('workOrder.assignedToId = :assignedToId', {
                    assignedToId: filters.assignedToId
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
     * Obtener una WorkOrder por su ID
     * Usado para validaciones de permisos en el controlador
     */
    public async getWorkOrderById(workOrderId: string): Promise<WorkOrder> {
        const workOrder = await this.workOrderRepository.findOne({
            where: { id: workOrderId }
        });

        if (!workOrder) {
            throw new HttpException(StatusCodes.NOT_FOUND, "La orden de trabajo no fue encontrada.");
        }

        return workOrder;
    }

    /**
     * Actualizar una actividad por su ID
     * 
     * REGLAS DE MODIFICACIÓN DE INPUTS:
     * - Solo se pueden modificar inputs si la actividad está en estado PENDING
     * - Si está APPROVED o REJECTED, no se pueden modificar inputs
     * 
     * REGLAS DE STOCK:
     * - Si cambia de PENDING → APPROVED: Se descuenta stock
     * - Si cambia de APPROVED → PENDING/REJECTED: Se devuelve stock
     * - Si cambia de REJECTED → APPROVED: Se descuenta stock
     * 
     * @param id ID de la actividad
     * @param activityData UpdateActivityDto
     * @returns Promise<Activity>
     */
    public async update(id: string, activityData: UpdateActivityDto): Promise<Activity> {
        const activity = await this.findById(id);
        const { inputsUsed, status: newStatus, ...activityFields } = activityData;
        const previousStatus = activity.status;

        // VALIDACIÓN: No permitir modificar inputs si NO está en PENDING
        // Las actividades APPROVED o REJECTED no pueden modificar sus insumos
        if (inputsUsed !== undefined && activity.status !== ActivityStatus.PENDING) {
            throw new HttpException(
                StatusCodes.FORBIDDEN,
                'No se pueden modificar los insumos de una actividad que ya fue aprobada o rechazada. ' +
                'Solo las actividades en estado PENDING pueden modificar sus insumos.'
            );
        }

        // Usar transacción para garantizar consistencia
        return await this.dataSource.transaction(async (transactionalEntityManager) => {
            // Actualizar campos básicos
            this.activityRepository.merge(activity, activityFields);
            
            // Si se proporciona un nuevo status
            if (newStatus !== undefined) {
                activity.status = newStatus;
            }

            // Manejar actualización de inputs (solo si está PENDING)
            if (inputsUsed !== undefined) {
                // Primero eliminar los InputUsage existentes
                if (activity.inputsUsed && activity.inputsUsed.length > 0) {
                    await transactionalEntityManager.remove(InputUsage, activity.inputsUsed);
                }

                if (inputsUsed.length > 0) {
                    const inputIds = inputsUsed.map(usage => usage.inputId);
                    const inputs = await transactionalEntityManager.findBy(Input, { id: In(inputIds) });
                    
                    if (inputs.length !== inputIds.length) {
                        throw new HttpException(
                            StatusCodes.NOT_FOUND, 
                            "Uno o más insumos no fueron encontrados."
                        );
                    }

                    // Crear nuevos InputUsage con la referencia a la actividad
                    activity.inputsUsed = inputsUsed.map(usageDto => 
                        this.inputUsageRepository.create({
                            activityId: activity.id,
                            inputId: usageDto.inputId,
                            quantityUsed: usageDto.quantityUsed,
                        })
                    );
                } else {
                    activity.inputsUsed = [];
                }
            }

            // MANEJO DE STOCK según cambio de estado
            const statusChanged = newStatus !== undefined && previousStatus !== newStatus;
            
            if (statusChanged && activity.inputsUsed && activity.inputsUsed.length > 0) {
                const inputIds = activity.inputsUsed.map(usage => usage.inputId);
                const inputs = await transactionalEntityManager.findBy(Input, { id: In(inputIds) });

                // Caso 1: PENDING → APPROVED (Descontar stock)
                if (previousStatus === ActivityStatus.PENDING && newStatus === ActivityStatus.APPROVED) {
                    await this.validateAndDeductStock(
                        activity.inputsUsed, 
                        inputs, 
                        transactionalEntityManager
                    );
                }

                // Caso 2: APPROVED → PENDING/REJECTED (Devolver stock)
                if (previousStatus === ActivityStatus.APPROVED && 
                    (newStatus === ActivityStatus.PENDING || newStatus === ActivityStatus.REJECTED)) {
                    await this.returnStock(
                        activity.inputsUsed, 
                        inputs, 
                        transactionalEntityManager
                    );
                }

                // Caso 3: REJECTED → APPROVED (Descontar stock)
                if (previousStatus === ActivityStatus.REJECTED && newStatus === ActivityStatus.APPROVED) {
                    await this.validateAndDeductStock(
                        activity.inputsUsed, 
                        inputs, 
                        transactionalEntityManager
                    );
                }
            }

            // Guardar la actividad (cascade guardará los InputUsage)
            const savedActivity = await transactionalEntityManager.save(Activity, activity);
            
            // Recargar con relaciones para retornar datos completos
            return await transactionalEntityManager.findOne(Activity, {
                where: { id: savedActivity.id },
                relations: ['workOrder', 'inputsUsed', 'inputsUsed.input']
            }) as Activity;
        });
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

    /**
     * Validar disponibilidad de stock y descontar del inventario
     * 
     * @param inputsUsed Array de InputUsage con las cantidades a usar
     * @param inputs Array de Input entities con el stock actual
     * @param transactionalEntityManager EntityManager para la transacción
     * @throws HttpException si no hay stock suficiente
     */
    private async validateAndDeductStock(
        inputsUsed: Array<{ inputId: string; quantityUsed: number }>,
        inputs: Input[],
        transactionalEntityManager: any
    ): Promise<void> {
        for (const usage of inputsUsed) {
            const input = inputs.find(i => i.id === usage.inputId);
            
            if (!input) {
                throw new HttpException(
                    StatusCodes.NOT_FOUND,
                    `El insumo con ID ${usage.inputId} no fue encontrado.`
                );
            }

            // Validar que haya stock suficiente
            if (input.stock < usage.quantityUsed) {
                throw new HttpException(
                    StatusCodes.BAD_REQUEST,
                    `Stock insuficiente para el insumo "${input.name}". ` +
                    `Disponible: ${input.stock} ${input.unit}, Requerido: ${usage.quantityUsed} ${input.unit}`
                );
            }

            // Descontar del stock
            input.stock -= usage.quantityUsed;
            await transactionalEntityManager.save(Input, input);
        }
    }

    /**
     * Devolver stock al inventario (cuando se rechaza o revierte una aprobación)
     * 
     * @param inputsUsed Array de InputUsage con las cantidades a devolver
     * @param inputs Array de Input entities
     * @param transactionalEntityManager EntityManager para la transacción
     */
    private async returnStock(
        inputsUsed: Array<{ inputId: string; quantityUsed: number }>,
        inputs: Input[],
        transactionalEntityManager: any
    ): Promise<void> {
        for (const usage of inputsUsed) {
            const input = inputs.find(i => i.id === usage.inputId);
            
            if (!input) {
                throw new HttpException(
                    StatusCodes.NOT_FOUND,
                    `El insumo con ID ${usage.inputId} no fue encontrado.`
                );
            }

            // Devolver al stock
            input.stock += usage.quantityUsed;
            await transactionalEntityManager.save(Input, input);
        }
    }
}
