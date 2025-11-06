import { DataSource, In, Repository } from 'typeorm';
import { PurchaseOrder } from '@entities/purchase-order.entity';
import { PurchaseOrderDetail } from '@entities/purchase-order-detail.entity';
import { Supplier } from '@entities/supplier.entity';
import { Input } from '@entities/input.entity';
import { CreatePurchaseOrderDto, PurchaseOrderDetailPriceDto, UpdatePurchaseOrderDto } from '@dtos/purchase-order.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';
import { PurchaseOrderStatus } from '@/enums';

export class PurchaseOrderService {
  private purchaseOrderRepository: Repository<PurchaseOrder>;

  constructor(private dataSource: DataSource) {
    this.purchaseOrderRepository = this.dataSource.getRepository(PurchaseOrder);
  }

  /**
   * Crear una nueva orden de compra
   * @param data Datos de la orden de compra a crear
   * @returns Promise<PurchaseOrder> La orden de compra creada
   */
  public async create(data: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    return await this.dataSource.transaction(async (manager) => {
      // Validar proveedor
      const supplier = await manager.findOne(Supplier, { where: { id: data.supplierId } });

      if (!supplier) {
        throw new HttpException(StatusCodes.NOT_FOUND, 'Proveedor no encontrado');
      }

      // Validar insumos y obtener sus datos
      const detailInputIds = data.details?.map(detail => detail.inputId) ?? [];
      const uniqueInputIds = [...new Set(detailInputIds)];

      if (uniqueInputIds.length === 0) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'Debe agregar al menos un insumo a la orden de compra');
      }

      const inputs = await manager.findBy(Input, { id: In(uniqueInputIds) });

      if (inputs.length !== uniqueInputIds.length) {
        throw new HttpException(StatusCodes.NOT_FOUND, 'Uno o más insumos no fueron encontrados');
      }

      // Crear un mapa de inputs para acceso rápido
      const inputMap = new Map(inputs.map(input => [input.id, input]));

      // Calcular totalAmount y preparar detalles con precios por defecto
      let totalAmount = 0;
      const details: PurchaseOrderDetail[] = [];

      for (const detail of data.details ?? []) {
        const input = inputMap.get(detail.inputId);
        if (!input) continue;

        // Si no se especifica unitPrice, tomar costPerUnit del insumo o 0
        const unitPrice = detail.unitPrice !== undefined && detail.unitPrice !== null
          ? Number(detail.unitPrice)
          : Number(input.costPerUnit) || 0;

        const quantity = Number(detail.quantity);
        totalAmount += quantity * unitPrice;

        const orderDetail = manager.create(PurchaseOrderDetail, {
          inputId: detail.inputId,
          quantity,
          unitPrice,
        });

        details.push(orderDetail);
      }

      // Crear la orden de compra con status PENDIENTE por defecto
      const purchaseOrder = manager.create(PurchaseOrder, {
        supplierId: data.supplierId,
        status: PurchaseOrderStatus.PENDIENTE,
        totalAmount,
        details,
      });

      // Guardar (cascade guardará los detalles automáticamente)
      const savedPurchaseOrder = await manager.save(PurchaseOrder, purchaseOrder);

      // Retornar con todas las relaciones cargadas
      const result = await manager.findOne(PurchaseOrder, {
        where: { id: savedPurchaseOrder.id },
        relations: [
          'supplier',
          'details',
          'details.input',
          'details.receiptDetails',
          'details.receiptDetails.goodsReceipt',
        ],
      });

      if (!result) {
        throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Error al crear la orden de compra');
      }

      return result;
    });
  }

  /**
   * Obtener todas las órdenes de compra
   * @returns Promise<PurchaseOrder[]> Lista de órdenes de compra
   */
  public async findAll(): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.find({
      relations: [
        'supplier',
        'details',
        'details.input',
        'details.receiptDetails',
        'details.receiptDetails.goodsReceipt',
      ],
    });
  }

  public async findById(id: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderRepository.findOne({
      where: { id },
      relations: [
        'supplier',
        'details',
        'details.input',
        'details.receiptDetails',
        'details.receiptDetails.goodsReceipt',
        'receipts',
        'receipts.receivedBy',
        'receipts.details',
      ],
    });

    if (!purchaseOrder) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de compra no encontrada');
    }

    return purchaseOrder;
  }

  /**
   * Actualizar una orden de compra por su ID
   * NOTA: Este método solo permite actualizar órdenes en estado PENDIENTE
   * No modifica el status (usar updateStatus para eso)
   * @param id ID de la orden de compra a actualizar
   * @param data Datos de la orden de compra a actualizar
   * @returns Promise<PurchaseOrder> La orden de compra actualizada
   */
  public async update(id: string, data: UpdatePurchaseOrderDto): Promise<PurchaseOrder> {
    return await this.dataSource.transaction(async (manager) => {
      // Buscar la orden con sus detalles
      const purchaseOrder = await manager.findOne(PurchaseOrder, {
        where: { id },
        relations: ['details', 'supplier'],
      });

      if (!purchaseOrder) {
        throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de compra no encontrada');
      }

      // Validar que la orden esté en estado PENDIENTE
      if (purchaseOrder.status !== PurchaseOrderStatus.PENDIENTE) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          `No se puede modificar una orden de compra en estado ${purchaseOrder.status}. Solo se pueden editar órdenes en estado PENDIENTE.`
        );
      }

      // Actualizar proveedor si es necesario
      if (data.supplierId && data.supplierId !== purchaseOrder.supplierId) {
        const supplier = await manager.findOne(Supplier, { where: { id: data.supplierId } });

        if (!supplier) {
          throw new HttpException(StatusCodes.NOT_FOUND, 'Proveedor no encontrado');
        }

        purchaseOrder.supplierId = supplier.id;
        purchaseOrder.supplier = supplier;
      }

      // Actualizar detalles si se proporcionan
      if (data.details && data.details.length > 0) {
        // Validar que todos los insumos existen
        const detailInputIds = data.details.map(detail => detail.inputId);
        const uniqueInputIds = [...new Set(detailInputIds)];

        const inputs = await manager.findBy(Input, { id: In(uniqueInputIds) });

        if (inputs.length !== uniqueInputIds.length) {
          throw new HttpException(StatusCodes.NOT_FOUND, 'Uno o más insumos no fueron encontrados');
        }

        // Crear mapas para comparación
        const existingDetailsMap = new Map(
          purchaseOrder.details.map(detail => [detail.inputId, detail])
        );
        const newDetailsMap = new Map(
          data.details.map(detail => [detail.inputId, detail])
        );

        // 1. Actualizar o mantener detalles existentes
        for (const existingDetail of purchaseOrder.details) {
          const newDetailData = newDetailsMap.get(existingDetail.inputId);

          if (newDetailData) {
            // Actualizar cantidad y/o precio si cambiaron
            if (newDetailData.quantity !== undefined) {
              existingDetail.quantity = Number(newDetailData.quantity);
            }
            if (newDetailData.unitPrice !== undefined) {
              existingDetail.unitPrice = Number(newDetailData.unitPrice);
            }
            await manager.save(PurchaseOrderDetail, existingDetail);
          } else {
            // 2. Eliminar detalles que ya no están en la lista
            await manager.remove(PurchaseOrderDetail, existingDetail);
          }
        }

        // 3. Agregar nuevos detalles que no existían
        for (const newDetailData of data.details) {
          if (!existingDetailsMap.has(newDetailData.inputId)) {
            const input = inputs.find(i => i.id === newDetailData.inputId);
            const unitPrice = newDetailData.unitPrice !== undefined && newDetailData.unitPrice !== null
              ? Number(newDetailData.unitPrice)
              : Number(input?.costPerUnit) || 0;

            const newDetail = manager.create(PurchaseOrderDetail, {
              purchaseOrderId: purchaseOrder.id,
              inputId: newDetailData.inputId,
              quantity: Number(newDetailData.quantity),
              unitPrice,
            });

            await manager.save(PurchaseOrderDetail, newDetail);
          }
        }

        // Recalcular totalAmount basado en los detalles actualizados
        const updatedDetails = await manager.find(PurchaseOrderDetail, {
          where: { purchaseOrderId: purchaseOrder.id },
        });

        purchaseOrder.totalAmount = updatedDetails.reduce((acc, detail) => {
          return acc + Number(detail.quantity) * Number(detail.unitPrice);
        }, 0);
      }

      // Guardar cambios en la orden
      await manager.save(PurchaseOrder, purchaseOrder);

      // Retornar con todas las relaciones cargadas
      const result = await manager.findOne(PurchaseOrder, {
        where: { id: purchaseOrder.id },
        relations: [
          'supplier',
          'details',
          'details.input',
          'details.receiptDetails',
          'details.receiptDetails.goodsReceipt',
          'receipts',
          'receipts.receivedBy',
          'receipts.details',
        ],
      });

      if (!result) {
        throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Error al actualizar la orden de compra');
      }

      return result;
    });
  }

  /**
   * Actualizar el estado de una orden de compra
   * Este método permite cambiar el estado y opcionalmente actualizar precios unitarios
   * (útil para aprobar una orden y establecer los precios finales negociados)
   * @param id ID de la orden de compra
   * @param status Nuevo estado
   * @param details Opcional: array con inputId y unitPrice para actualizar precios
   * @returns Promise<PurchaseOrder> La orden de compra actualizada
   */
  public async updateStatus(
    id: string,
    status: PurchaseOrderStatus,
    details?: Array<PurchaseOrderDetailPriceDto>
  ): Promise<PurchaseOrder> {
    return await this.dataSource.transaction(async (manager) => {
      const purchaseOrder = await manager.findOne(PurchaseOrder, {
        where: { id },
        relations: ['details', 'supplier'],
      });

      if (!purchaseOrder) {
        throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de compra no encontrada');
      }

      // Actualizar status
      purchaseOrder.status = status;

      // Si se proporcionan precios para actualizar (típicamente al aprobar)
      if (details && details.length > 0) {
        const pricesMap = new Map(
          details.map(item => [item.inputId, item.unitPrice])
        );

        for (const detail of purchaseOrder.details) {
          const newPrice = pricesMap.get(detail.inputId);
          if (newPrice !== undefined) {
            detail.unitPrice = Number(newPrice);
            await manager.save(PurchaseOrderDetail, detail);
          }
        }

        // Recalcular totalAmount
        purchaseOrder.totalAmount = purchaseOrder.details.reduce((acc, detail) => {
          return acc + Number(detail.quantity) * Number(detail.unitPrice);
        }, 0);
      }

      await manager.save(PurchaseOrder, purchaseOrder);

      // Retornar con todas las relaciones cargadas
      const result = await manager.findOne(PurchaseOrder, {
        where: { id: purchaseOrder.id },
        relations: [
          'supplier',
          'details',
          'details.input',
          'details.receiptDetails',
          'details.receiptDetails.goodsReceipt',
          'receipts',
          'receipts.receivedBy',
          'receipts.details',
        ],
      });

      if (!result) {
        throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Error al actualizar el estado de la orden de compra');
      }

      return result;
    });
  }

  /**
   * Eliminar una orden de compra por su ID (soft delete)
   * @param id ID de la orden de compra a eliminar
   * @returns Promise<PurchaseOrder> La orden de compra eliminada
   */
  public async delete(id: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderRepository.findOne({ where: { id } });

    if (!purchaseOrder) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de compra no encontrada');
    }

    return await this.purchaseOrderRepository.softRemove(purchaseOrder);
  }

  /**
   * Restaurar una orden de compra por su ID
   * @param id ID de la orden de compra a restaurar
   * @returns Promise<PurchaseOrder> La orden de compra restaurada
   */
  public async restore(id: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!purchaseOrder) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de compra no encontrada');
    }

    return await this.purchaseOrderRepository.recover(purchaseOrder);
  }

  /**
   * Eliminar una orden de compra por su ID (hard delete)
   * @param id ID de la orden de compra a eliminar
   * @returns Promise<PurchaseOrder> La orden de compra eliminada permanentemente
   */
  public async hardDelete(id: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!purchaseOrder) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de compra no encontrada');
    }

    return await this.purchaseOrderRepository.remove(purchaseOrder);
  }
}
