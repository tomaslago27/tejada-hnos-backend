import { DataSource, Repository } from 'typeorm';
import { GoodsReceipt } from '@entities/goods-receipt.entity';
import { GoodsReceiptDetail } from '@entities/goods-receipt-detail.entity';
import { PurchaseOrder } from '@entities/purchase-order.entity';
import { PurchaseOrderDetail } from '@entities/purchase-order-detail.entity';
import { Input } from '@entities/input.entity';
import { CreateGoodsReceiptDto } from '@dtos/goods-receipt.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';
import { PurchaseOrderStatus } from '@/enums';

export class GoodsReceiptService {
  private readonly goodsReceiptRepository: Repository<GoodsReceipt>;
  private readonly goodsReceiptDetailRepository: Repository<GoodsReceiptDetail>;
  private readonly purchaseOrderRepository: Repository<PurchaseOrder>;
  private readonly purchaseOrderDetailRepository: Repository<PurchaseOrderDetail>;
  private readonly inputRepository: Repository<Input>;

  constructor(private readonly dataSource: DataSource) {
    this.goodsReceiptRepository = this.dataSource.getRepository(GoodsReceipt);
    this.goodsReceiptDetailRepository = this.dataSource.getRepository(GoodsReceiptDetail);
    this.purchaseOrderRepository = this.dataSource.getRepository(PurchaseOrder);
    this.purchaseOrderDetailRepository = this.dataSource.getRepository(PurchaseOrderDetail);
    this.inputRepository = this.dataSource.getRepository(Input);
  }

  /**
   * Crear una nueva recepción de mercadería
   * @param data Datos de la recepción
   * @param userId ID del usuario que registra la recepción
   * @returns Promise<GoodsReceipt> La recepción creada
   */
  public async create(data: CreateGoodsReceiptDto, userId: string): Promise<GoodsReceipt> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Validar que la orden de compra existe y está APROBADA
      const purchaseOrder = await manager.findOne(PurchaseOrder, {
        where: { id: data.purchaseOrderId },
        relations: ['details', 'details.input', 'details.receiptDetails'],
      });

      if (!purchaseOrder) {
        throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de compra no encontrada');
      }

      if (purchaseOrder.status !== PurchaseOrderStatus.APROBADA && 
          purchaseOrder.status !== PurchaseOrderStatus.RECIBIDA_PARCIAL) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          `No se puede registrar recepción para una orden en estado ${purchaseOrder.status}. La orden debe estar APROBADA o en RECIBIDA_PARCIAL.`
        );
      }

      // 2. Validar que todos los detalles pertenecen a la orden
      const purchaseOrderDetailIds = purchaseOrder.details.map(d => d.id);
      const invalidDetails = data.details.filter(
        detail => !purchaseOrderDetailIds.includes(detail.purchaseOrderDetailId)
      );

      if (invalidDetails.length > 0) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          'Uno o más detalles no pertenecen a esta orden de compra'
        );
      }

      // 3. Validar que las cantidades no excedan lo pendiente
      for (const detailDto of data.details) {
        const poDetail = purchaseOrder.details.find(d => d.id === detailDto.purchaseOrderDetailId);
        
        if (!poDetail) continue;

        const orderedQuantity = Number(poDetail.quantity);
        const alreadyReceived = poDetail.quantityReceived; // Usa el getter de la entidad
        const pendingQuantity = orderedQuantity - alreadyReceived;
        const receivingNow = Number(detailDto.quantityReceived);

        if (receivingNow > pendingQuantity) {
          throw new HttpException(
            StatusCodes.BAD_REQUEST,
            `No se puede recibir ${receivingNow} ${poDetail.input.unit} de "${poDetail.input.name}". ` +
            `Cantidad pendiente: ${pendingQuantity.toFixed(2)} ${poDetail.input.unit}`
          );
        }
      }

      // 4. Crear la recepción principal
      const receipt = manager.create(GoodsReceipt, {
        purchaseOrderId: purchaseOrder.id,
        receivedById: userId,
      });
      
      if (data.notes) {
        receipt.notes = data.notes;
      }

      const savedReceipt = await manager.save(GoodsReceipt, receipt);

      // 5. Crear los detalles de la recepción y actualizar inventario
      for (const detailDto of data.details) {
        const poDetail = purchaseOrder.details.find(d => d.id === detailDto.purchaseOrderDetailId);
        
        if (!poDetail) continue;

        // Crear el detalle de recepción
        const receiptDetail = manager.create(GoodsReceiptDetail, {
          goodsReceiptId: savedReceipt.id,
          purchaseOrderDetailId: detailDto.purchaseOrderDetailId,
          quantityReceived: Number(detailDto.quantityReceived),
        });
        
        if (detailDto.notes) {
          receiptDetail.notes = detailDto.notes;
        }

        await manager.save(GoodsReceiptDetail, receiptDetail);

        // Actualizar el inventario del insumo con costo promedio ponderado
        const input = poDetail.input;
        const currentStock = Number(input.stock || 0);
        const currentCost = Number(input.costPerUnit || 0);
        const receivedQuantity = Number(detailDto.quantityReceived);
        const receivedCost = Number(poDetail.unitPrice || 0);

        const newStock = currentStock + receivedQuantity;
        const newCost = newStock === 0
          ? currentCost
          : ((currentStock * currentCost) + (receivedQuantity * receivedCost)) / newStock;

        input.stock = Number(newStock.toFixed(2));
        input.costPerUnit = Number(newCost.toFixed(2));

        await manager.save(Input, input);
      }

      // 6. Actualizar el estado de la orden de compra
      // Recargar detalles con las recepciones actualizadas
      const updatedPODetails = await manager.find(PurchaseOrderDetail, {
        where: { purchaseOrderId: purchaseOrder.id },
        relations: ['receiptDetails'],
      });

      const allFullyReceived = updatedPODetails.every(detail => {
        const orderedQuantity = Number(detail.quantity);
        const receivedQuantity = detail.quantityReceived; // Usa el getter
        return receivedQuantity >= orderedQuantity;
      });

      purchaseOrder.status = allFullyReceived
        ? PurchaseOrderStatus.RECIBIDA
        : PurchaseOrderStatus.RECIBIDA_PARCIAL;

      await manager.save(PurchaseOrder, purchaseOrder);

      // 7. Retornar la recepción con todas las relaciones
      const result = await manager.findOne(GoodsReceipt, {
        where: { id: savedReceipt.id },
        relations: [
          'purchaseOrder',
          'purchaseOrder.supplier',
          'receivedBy',
          'details',
          'details.purchaseOrderDetail',
          'details.purchaseOrderDetail.input',
        ],
      });

      if (!result) {
        throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Error al crear la recepción');
      }

      return result;
    });
  }

  /**
   * Obtener todas las recepciones
   * @returns Promise<GoodsReceipt[]> Lista de recepciones
   */
  public async findAll(): Promise<GoodsReceipt[]> {
    return this.goodsReceiptRepository.find({
      relations: [
        'purchaseOrder',
        'purchaseOrder.supplier',
        'receivedBy',
        'details',
        'details.purchaseOrderDetail',
        'details.purchaseOrderDetail.input',
      ],
      order: { receivedAt: 'DESC' },
    });
  }

  /**
   * Obtener una recepción por su ID
   * @param id ID de la recepción
   * @returns Promise<GoodsReceipt> La recepción
   */
  public async findById(id: string): Promise<GoodsReceipt> {
    const receipt = await this.goodsReceiptRepository.findOne({
      where: { id },
      relations: [
        'purchaseOrder',
        'purchaseOrder.supplier',
        'purchaseOrder.details',
        'purchaseOrder.details.input',
        'receivedBy',
        'details',
        'details.purchaseOrderDetail',
        'details.purchaseOrderDetail.input',
      ],
    });

    if (!receipt) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Recepción no encontrada');
    }

    return receipt;
  }

  /**
   * Obtener todas las recepciones de una orden de compra
   * @param purchaseOrderId ID de la orden de compra
   * @returns Promise<GoodsReceipt[]> Lista de recepciones
   */
  public async findByPurchaseOrder(purchaseOrderId: string): Promise<GoodsReceipt[]> {
    const purchaseOrder = await this.purchaseOrderRepository.findOne({
      where: { id: purchaseOrderId },
    });

    if (!purchaseOrder) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de compra no encontrada');
    }

    return this.goodsReceiptRepository.find({
      where: { purchaseOrderId },
      relations: [
        'receivedBy',
        'details',
        'details.purchaseOrderDetail',
        'details.purchaseOrderDetail.input',
      ],
      order: { receivedAt: 'DESC' },
    });
  }
}
