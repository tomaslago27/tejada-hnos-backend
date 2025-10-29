import { CreateWorkOrderDto, UpdateWorkOrderDto } from "@/dtos/work-order.dto";
import { WorkOrder } from "@/entities/work-order.entity";
import { Plot } from "@/entities/plot.entity";
import { User } from "@/entities/user.entity";
import { HttpException } from "@/exceptions/HttpException";
import { DataSource, Repository, In } from "typeorm";
import { StatusCodes } from "http-status-codes";
import { WorkOrderFilters } from "@/interfaces/filters.interface";


export class WorkOrderService {
  private workOrderRepository: Repository<WorkOrder>;
  private plotRepository: Repository<Plot>;
  private userRepository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.workOrderRepository = dataSource.getRepository(WorkOrder);
    this.plotRepository = dataSource.getRepository(Plot);
    this.userRepository = dataSource.getRepository(User);
  }

  /**
   * Crear una nueva orden de trabajo
   * @param workOrderData CreateWorkOrderDto
   * @returns Promise<WorkOrder>
   */
  public async create(workOrderData: CreateWorkOrderDto): Promise<WorkOrder> {
    const { assignedToUserId, plotIds, ...workOrderFields } = workOrderData;

    // Crear la nueva orden de trabajo con los campos básicos
    const newWorkOrder = this.workOrderRepository.create(workOrderFields);

    // Asignar usuario si se proporciona
    if (assignedToUserId) {
      const user = await this.userRepository.findOne({ where: { id: assignedToUserId } });
      if (!user) {
        throw new HttpException(StatusCodes.NOT_FOUND, "El usuario asignado no fue encontrado.");
      }
      newWorkOrder.assignedToId = assignedToUserId;
      newWorkOrder.assignedTo = user;
    }

    // Asignar parcelas si se proporcionan
    if (plotIds && plotIds.length > 0) {
      const plots = await this.plotRepository.findBy({ id: In(plotIds) });
      if (plots.length !== plotIds.length) {
        throw new HttpException(StatusCodes.NOT_FOUND, "Una o más parcelas no fueron encontradas.");
      }
      newWorkOrder.plots = plots;
    }

    return await this.workOrderRepository.save(newWorkOrder);
  }

  /**
   * Obtener todas las órdenes de trabajo con filtros opcionales
   * @param filters Filtros opcionales para la búsqueda
   * @returns Promise<WorkOrder[]>
   * 
   * Ejemplos de uso:
   * - findAll() → Todas las órdenes
   * - findAll({ status: 'PENDING' }) → Solo pendientes
   * - findAll({ assignedToId: '123', status: 'IN_PROGRESS' }) → En progreso del usuario 123
   * - findAll({ plotId: '456' }) → Órdenes de la parcela 456
   */
  public async findAll(filters?: WorkOrderFilters): Promise<WorkOrder[]> {
    const queryBuilder = this.workOrderRepository
      .createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.assignedTo', 'user')
      .leftJoinAndSelect('workOrder.plots', 'plots')
      .leftJoinAndSelect('workOrder.activities', 'activities');

    // Aplicar filtros dinámicamente
    if (filters) {
      if (filters.assignedToId) {
        queryBuilder.andWhere('workOrder.assignedToId = :assignedToId', { 
          assignedToId: filters.assignedToId 
        });
      }

      if (filters.status) {
        queryBuilder.andWhere('workOrder.status = :status', { 
          status: filters.status 
        });
      }

      if (filters.plotId) {
        queryBuilder.andWhere('plots.id = :plotId', { 
          plotId: filters.plotId 
        });
      }

      if (filters.startDate) {
        queryBuilder.andWhere('workOrder.scheduledDate >= :startDate', { 
          startDate: filters.startDate 
        });
      }

      if (filters.endDate) {
        queryBuilder.andWhere('workOrder.scheduledDate <= :endDate', { 
          endDate: filters.endDate 
        });
      }
    }

    // Ordenar por fecha creada (más recientes primero) por defecto
    queryBuilder.orderBy('workOrder.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Buscar una orden de trabajo por su ID
   * @param id ID de la orden de trabajo
   * @returns Promise<WorkOrder>
   */
  public async findById(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id },
      relations: ['assignedTo', 'plots', 'activities', 'activities.inputsUsed']
    });
    
    if (!workOrder) {
      throw new HttpException(StatusCodes.NOT_FOUND, "La orden de trabajo no fue encontrada.");
    }
    
    return workOrder;
  }

  /**
   * Actualizar una orden de trabajo por su ID
   * @param id ID de la orden de trabajo
   * @param workOrderData UpdateWorkOrderDto
   * @returns Promise<WorkOrder>
   */
  public async update(id: string, workOrderData: UpdateWorkOrderDto): Promise<WorkOrder> {
    const workOrder = await this.findById(id);
    const { assignedToUserId, plotIds, ...workOrderFields } = workOrderData;

    // Actualizar campos básicos
    this.workOrderRepository.merge(workOrder, workOrderFields);

    // Actualizar usuario asignado si se proporciona
    if (assignedToUserId !== undefined) {
      if (assignedToUserId === null) {
        workOrder.assignedToId = null;
        workOrder.assignedTo = null;
      } else {
        const user = await this.userRepository.findOne({ where: { id: assignedToUserId } });
        if (!user) {
          throw new HttpException(StatusCodes.NOT_FOUND, "El usuario asignado no fue encontrado.");
        }
        workOrder.assignedToId = assignedToUserId;
        workOrder.assignedTo = user;
      }
    }

    // Actualizar parcelas si se proporcionan
    if (plotIds !== undefined) {
      if (plotIds.length === 0) {
        workOrder.plots = [];
      } else {
        const plots = await this.plotRepository.findBy({ id: In(plotIds) });
        if (plots.length !== plotIds.length) {
          throw new HttpException(StatusCodes.NOT_FOUND, "Una o más parcelas no fueron encontradas.");
        }
        workOrder.plots = plots;
      }
    }

    return await this.workOrderRepository.save(workOrder);
  }

  /**
   * Eliminar una orden de trabajo por su ID (soft delete)
   * @param id ID de la orden de trabajo
   * @returns Promise<WorkOrder> La orden de trabajo eliminada
   */
  public async delete(id: string): Promise<WorkOrder> {
    const workOrder = await this.findById(id);
    // findById ya lanza excepción si no existe, no necesitamos validar de nuevo
    return await this.workOrderRepository.softRemove(workOrder);
  }

  /**
   * Eliminar una orden de trabajo por su ID (hard delete)
   * @param id ID de la orden de trabajo a eliminar de la base de datos
   * @returns Promise<WorkOrder> La orden de trabajo eliminada permanentemente
   */
  public async hardDelete(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!workOrder) {
      throw new HttpException(StatusCodes.NOT_FOUND, "La orden de trabajo no fue encontrada.");
    }

    return await this.workOrderRepository.remove(workOrder);
  }

  /**
   * Restaurar una orden de trabajo por su ID
   * @param id ID de la orden de trabajo a restaurar
   * @returns Promise<WorkOrder> La orden de trabajo restaurada
   */
  public async restore(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!workOrder) {
      throw new HttpException(StatusCodes.NOT_FOUND, "La orden de trabajo no fue encontrada.");
    }

    return await this.workOrderRepository.recover(workOrder);
  }
}
