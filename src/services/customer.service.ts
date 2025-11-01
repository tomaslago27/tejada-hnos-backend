import { DataSource, Repository, IsNull } from 'typeorm';
import { Customer } from '@entities/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from '@dtos/customer.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';
import { CustomerFilters } from '@/interfaces/filters.interface';

export class CustomerService {
  private customerRepository: Repository<Customer>;

  constructor(private dataSource: DataSource) {
    this.customerRepository = this.dataSource.getRepository(Customer);
  }

  /**
   * Obtener todos los clientes con su total gastado calculado
   */
  async findAll(filters: CustomerFilters): Promise<Customer[]> {
    const query = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.salesOrders', 'orders')
      .leftJoinAndSelect('orders.details', 'details')
      .loadRelationCountAndMap('customer.totalOrders', 'customer.salesOrders')
      .addSelect(
        'COALESCE(SUM(details.unitPrice * details.quantityKg), 0)',
        'customer_totalSpent'
      )
      .groupBy('customer.id')
      .addGroupBy('orders.id')
      .addGroupBy('details.id');

    // Filtro por nombre del cliente
    if (filters.searchTerm) {
      query.andWhere('customer.name ILIKE :searchTerm OR customer.taxId ILIKE :searchTerm', {
        searchTerm: `%${filters.searchTerm}%`,
      });
    }

    // Filtro por rango de total gastado
    // Nota: Los filtros HAVING deben aplicarse después de GROUP BY
    if (filters.minTotalPurchases !== undefined || filters.maxTotalPurchases !== undefined) {
      const subQuery = this.customerRepository
        .createQueryBuilder('c')
        .select('c.id')
        .leftJoin('c.salesOrders', 'so')
        .leftJoin('so.details', 'sod')
        .groupBy('c.id')
        .having('1=1'); // Base para agregar condiciones

      if (filters.minTotalPurchases !== undefined) {
        subQuery.andHaving('COALESCE(SUM(sod.unitPrice * sod.quantityKg), 0) >= :minTotal', {
          minTotal: filters.minTotalPurchases,
        });
      }

      if (filters.maxTotalPurchases !== undefined) {
        subQuery.andHaving('COALESCE(SUM(sod.unitPrice * sod.quantityKg), 0) <= :maxTotal', {
          maxTotal: filters.maxTotalPurchases,
        });
      }

      query.andWhere(`customer.id IN (${subQuery.getQuery()})`)
        .setParameters(subQuery.getParameters());
    }

    // Incluir clientes eliminados si se solicita
    if (filters.withDeleted) {
      query.withDeleted();
    }

    const customers = await query.getMany();

    // Calcular el total gastado para cada cliente manualmente
    // porque el SELECT con alias no se mapea automáticamente
    for (const customer of customers) {
      let totalSpent = 0;
      if (customer.salesOrders) {
        for (const order of customer.salesOrders) {
          if (order.details) {
            for (const detail of order.details) {
              totalSpent += Number(detail.unitPrice) * Number(detail.quantityKg);
            }
          }
        }
      }
      (customer as any).totalSpent = totalSpent;
    }

    return customers;
  }

  /**
   * Obtener un cliente por ID
   */
  async findById(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!customer) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Cliente no encontrado');
    }

    return customer;
  }

  /**
   * Crear un nuevo cliente
   */
  async create(data: CreateCustomerDto): Promise<Customer> {
    // Validar que no exista un cliente con el mismo taxId si se proporciona
    if (data.taxId) {
      const existingCustomer = await this.customerRepository.findOne({
        where: { taxId: data.taxId },
      });

      if (existingCustomer) {
        throw new HttpException(
          StatusCodes.CONFLICT,
          'Ya existe un cliente con ese CUIT/CUIL'
        );
      }
    }

    const customer = this.customerRepository.create(data);
    return await this.customerRepository.save(customer);
  }

  /**
   * Actualizar un cliente
   */
  async update(id: string, data: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findById(id);

    // Validar que no exista otro cliente con el mismo taxId
    if (data.taxId && data.taxId !== customer.taxId) {
      const existingCustomer = await this.customerRepository.findOne({
        where: { taxId: data.taxId },
      });

      if (existingCustomer && existingCustomer.id !== id) {
        throw new HttpException(
          StatusCodes.CONFLICT,
          'Ya existe otro cliente con ese CUIT/CUIL'
        );
      }
    }

    this.customerRepository.merge(customer, data);
    return await this.customerRepository.save(customer);
  }

  /**
   * Soft delete de un cliente
   */
  async delete(id: string): Promise<Customer> {
    const customer = await this.findById(id);
    return await this.customerRepository.softRemove(customer);
  }

  /**
   * Restaurar un cliente eliminado
   */
  async restore(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!customer) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Cliente no encontrado');
    }

    if (!customer.deletedAt) {
      throw new HttpException(StatusCodes.BAD_REQUEST, 'El cliente no está eliminado');
    }

    await this.customerRepository.restore(id);
    return await this.findById(id);
  }

  /**
   * Eliminar permanentemente un cliente
   */
  async hardDelete(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!customer) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Cliente no encontrado');
    }

    return await this.customerRepository.remove(customer);
  }
}
