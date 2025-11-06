import { DataSource, Repository, IsNull } from 'typeorm';
import { Supplier } from '@entities/supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto } from '@dtos/supplier.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';
import { SupplierFilters } from '@/interfaces/filters.interface';

export class SupplierService {
  private supplierRepository: Repository<Supplier>;

  constructor(private dataSource: DataSource) {
    this.supplierRepository = this.dataSource.getRepository(Supplier);
  }

  /**
   * Obtener todos los proveedores con su total de compras calculado
   */
  async findAll(filters: SupplierFilters): Promise<Supplier[]> {
    const query = this.supplierRepository
      .createQueryBuilder('supplier')
      .leftJoinAndSelect('supplier.purchaseOrders', 'orders')
      .leftJoinAndSelect('orders.details', 'details')
      .loadRelationCountAndMap('supplier.totalOrders', 'supplier.purchaseOrders')
      .addSelect(
        'COALESCE(SUM(details.unitPrice * details.quantity), 0)',
        'supplier_totalSpent'
      )
      .groupBy('supplier.id')
      .addGroupBy('orders.id')
      .addGroupBy('details.id');

    // Filtro por nombre del proveedor
    if (filters.searchTerm) {
      query.andWhere('supplier.name ILIKE :searchTerm OR supplier.taxId ILIKE :searchTerm', {
        searchTerm: `%${filters.searchTerm}%`,
      });
    }

    // Filtro por rango de total suministrado
    // Nota: Los filtros HAVING deben aplicarse después de GROUP BY
    if (filters.minTotalSupplied !== undefined || filters.maxTotalSupplied !== undefined) {
      const subQuery = this.supplierRepository
        .createQueryBuilder('s')
        .select('s.id')
        .leftJoin('s.purchaseOrders', 'po')
        .leftJoin('po.details', 'pod')
        .groupBy('s.id')
        .having('1=1'); // Base para agregar condiciones

      if (filters.minTotalSupplied !== undefined) {
        subQuery.andHaving('COALESCE(SUM(pod.unitPrice * pod.quantity), 0) >= :minTotal', {
          minTotal: filters.minTotalSupplied,
        });
      }

      if (filters.maxTotalSupplied !== undefined) {
        subQuery.andHaving('COALESCE(SUM(pod.unitPrice * pod.quantity), 0) <= :maxTotal', {
          maxTotal: filters.maxTotalSupplied,
        });
      }

      query.andWhere(`supplier.id IN (${subQuery.getQuery()})`)
        .setParameters(subQuery.getParameters());
    }

    // Incluir proveedores eliminados si se solicita
    if (filters.withDeleted) {
      query.withDeleted();
    }

    const suppliers = await query.getMany();

    // Calcular el total suministrado para cada proveedor manualmente
    // porque el SELECT con alias no se mapea automáticamente
    for (const supplier of suppliers) {
      let totalSpent = 0;
      if (supplier.purchaseOrders) {
        for (const order of supplier.purchaseOrders) {
          if (order.details) {
            for (const detail of order.details) {
              totalSpent += Number(detail.unitPrice) * Number(detail.quantity);
            }
          }
        }
      }
      (supplier as any).totalSupplied = totalSpent;
    }

    return suppliers;
  }

  /**
   * Obtener un proveedor por ID
   */
  async findById(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['purchaseOrders', 'purchaseOrders.details'],
    });

    if (!supplier) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Proveedor no encontrado');
    }

    // Calcular totalSupplied
    let totalSpent = 0;
    if (supplier.purchaseOrders) {
      for (const order of supplier.purchaseOrders) {
        if (order.details) {
          for (const detail of order.details) {
            totalSpent += Number(detail.unitPrice) * Number(detail.quantity);
          }
        }
      }
    }
    
    (supplier as any).totalSupplied = totalSpent;
    (supplier as any).totalOrders = supplier.purchaseOrders?.length || 0;

    return supplier;
  }

  /**
   * Crear un nuevo proveedor
   */
  async create(data: CreateSupplierDto): Promise<Supplier> {
    // Validar que no exista un proveedor con el mismo taxId si se proporciona
    if (data.taxId) {
      const existingSupplier = await this.supplierRepository.findOne({
        where: { taxId: data.taxId },
      });

      if (existingSupplier) {
        throw new HttpException(
          StatusCodes.CONFLICT,
          'Ya existe un proveedor con ese CUIT/CUIL'
        );
      }
    }

    // Validar que no exista un proveedor con el mismo nombre
    const existingByName = await this.supplierRepository.findOne({
      where: { name: data.name },
    });

    if (existingByName) {
      throw new HttpException(
        StatusCodes.CONFLICT,
        'Ya existe un proveedor con ese nombre'
      );
    }

    const supplier = this.supplierRepository.create(data);
    const savedSupplier = await this.supplierRepository.save(supplier);
    
    // Agregar totalSupplied como 0 para proveedores nuevos
    (savedSupplier as any).totalSupplied = 0;
    (savedSupplier as any).totalOrders = 0;
    
    return savedSupplier;
  }

  /**
   * Actualizar un proveedor
   */
  async update(id: string, data: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findById(id);

    // Validar que no exista otro proveedor con el mismo taxId
    if (data.taxId && data.taxId !== supplier.taxId) {
      const existingSupplier = await this.supplierRepository.findOne({
        where: { taxId: data.taxId },
      });

      if (existingSupplier && existingSupplier.id !== id) {
        throw new HttpException(
          StatusCodes.CONFLICT,
          'Ya existe otro proveedor con ese CUIT/CUIL'
        );
      }
    }

    // Validar que no exista otro proveedor con el mismo nombre
    if (data.name && data.name !== supplier.name) {
      const existingByName = await this.supplierRepository.findOne({
        where: { name: data.name },
      });

      if (existingByName && existingByName.id !== id) {
        throw new HttpException(
          StatusCodes.CONFLICT,
          'Ya existe otro proveedor con ese nombre'
        );
      }
    }

    this.supplierRepository.merge(supplier, data);
    const updatedSupplier = await this.supplierRepository.save(supplier);
    
    // Recalcular totalSupplied después de actualizar
    const supplierWithOrders = await this.supplierRepository.findOne({
      where: { id },
      relations: ['purchaseOrders', 'purchaseOrders.details'],
    });
    
    let totalSpent = 0;
    if (supplierWithOrders?.purchaseOrders) {
      for (const order of supplierWithOrders.purchaseOrders) {
        if (order.details) {
          for (const detail of order.details) {
            totalSpent += Number(detail.unitPrice) * Number(detail.quantity);
          }
        }
      }
    }
    
    (updatedSupplier as any).totalSupplied = totalSpent;
    (updatedSupplier as any).totalOrders = supplierWithOrders?.purchaseOrders?.length || 0;
    
    return updatedSupplier;
  }

  /**
   * Soft delete de un proveedor
   */
  async delete(id: string): Promise<Supplier> {
    const supplier = await this.findById(id);
    return await this.supplierRepository.softRemove(supplier);
  }

  /**
   * Restaurar un proveedor eliminado
   */
  async restore(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!supplier) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Proveedor no encontrado');
    }

    if (!supplier.deletedAt) {
      throw new HttpException(StatusCodes.BAD_REQUEST, 'El proveedor no está eliminado');
    }

    await this.supplierRepository.restore(id);
    return await this.findById(id);
  }

  /**
   * Eliminar permanentemente un proveedor
   */
  async hardDelete(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!supplier) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Proveedor no encontrado');
    }

    return await this.supplierRepository.remove(supplier);
  }
}
