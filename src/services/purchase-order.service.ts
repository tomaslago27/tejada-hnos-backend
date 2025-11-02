import { DataSource, In, Repository } from 'typeorm';
import { PurchaseOrder } from '@entities/purchase-order.entity';
import { PurchaseOrderDetail } from '@entities/purchase-order-detail.entity';
import { Supplier } from '@entities/supplier.entity';
import { Input } from '@entities/input.entity';
import { GoodsReceipt } from '@entities/goods-receipt.entity';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '@dtos/purchase-order.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';

export class PurchaseOrderService {
  private readonly purchaseOrderRepository: Repository<PurchaseOrder>;
  private readonly purchaseOrderDetailRepository: Repository<PurchaseOrderDetail>;
  private readonly supplierRepository: Repository<Supplier>;
  private readonly inputRepository: Repository<Input>;
  private readonly goodsReceiptRepository: Repository<GoodsReceipt>;

  constructor(private readonly dataSource: DataSource) {
    this.purchaseOrderRepository = this.dataSource.getRepository(PurchaseOrder);
    this.purchaseOrderDetailRepository = this.dataSource.getRepository(PurchaseOrderDetail);
    this.supplierRepository = this.dataSource.getRepository(Supplier);
    this.inputRepository = this.dataSource.getRepository(Input);
    this.goodsReceiptRepository = this.dataSource.getRepository(GoodsReceipt);
  }

  public async create(data: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const supplier = await this.supplierRepository.findOne({ where: { id: data.supplierId } });

    if (!supplier) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Proveedor no encontrado');
    }

    const detailInputIds = data.details?.map(detail => detail.inputId) ?? [];
    const uniqueInputIds = [...new Set(detailInputIds)];

    if (uniqueInputIds.length > 0) {
      const inputs = await this.inputRepository.findBy({ id: In(uniqueInputIds) });

      if (inputs.length !== uniqueInputIds.length) {
        throw new HttpException(StatusCodes.NOT_FOUND, 'Uno o más insumos no fueron encontrados');
      }
    }

    const totalAmount = (data.details ?? []).reduce((acc, detail) => {
      const quantity = Number(detail.quantity);
      const unitPrice = Number(detail.unitPrice);
      return acc + quantity * unitPrice;
    }, 0);

    const purchaseOrder = this.purchaseOrderRepository.create({
      ...data,
      totalAmount,
      supplier,
      details: (data.details ?? []).map(detail =>
        this.purchaseOrderDetailRepository.create(detail)
      ),
    });

    const savedPurchaseOrder = await this.purchaseOrderRepository.save(purchaseOrder);

    return this.findById(savedPurchaseOrder.id);
  }

  public async findAll(): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.find({
      relations: ['supplier', 'details'],
    });
  }

  public async findById(id: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderRepository.findOne({
      where: { id },
      relations: ['supplier', 'details'],
    });

    if (!purchaseOrder) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de compra no encontrada');
    }

    return purchaseOrder;
  }

  public async update(id: string, data: UpdatePurchaseOrderDto): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderRepository.findOne({
      where: { id },
      relations: ['details', 'supplier'],
    });

    if (!purchaseOrder) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de compra no encontrada');
    }

    if (data.supplierId && data.supplierId !== purchaseOrder.supplierId) {
      const supplier = await this.supplierRepository.findOne({ where: { id: data.supplierId } });

      if (!supplier) {
        throw new HttpException(StatusCodes.NOT_FOUND, 'Proveedor no encontrado');
      }

      purchaseOrder.supplierId = supplier.id;
      purchaseOrder.supplier = supplier;
    }

    if (data.status !== undefined) {
      purchaseOrder.status = data.status;
    }

    if (data.totalAmount !== undefined && (!data.details || data.details.length === 0)) {
      purchaseOrder.totalAmount = Number(data.totalAmount);
    }

    if (data.details && data.details.length > 0) {
      const detailInputIds = data.details.map(detail => detail.inputId);
      const uniqueInputIds = [...new Set(detailInputIds)];

      const inputs = await this.inputRepository.findBy({ id: In(uniqueInputIds) });

      if (inputs.length !== uniqueInputIds.length) {
        throw new HttpException(StatusCodes.NOT_FOUND, 'Uno o más insumos no fueron encontrados');
      }

      await this.purchaseOrderDetailRepository.delete({ purchaseOrderId: purchaseOrder.id });

      purchaseOrder.details = data.details.map(detail =>
        this.purchaseOrderDetailRepository.create({
          ...detail,
          purchaseOrderId: purchaseOrder.id,
        })
      );

      purchaseOrder.totalAmount = data.details.reduce((acc, detail) => {
        const quantity = Number(detail.quantity);
        const unitPrice = Number(detail.unitPrice);
        return acc + quantity * unitPrice;
      }, 0);
    }

    await this.purchaseOrderRepository.save(purchaseOrder);

    return this.findById(purchaseOrder.id);
  }

  public async delete(id: string): Promise<PurchaseOrder> {
    // Pendiente de implementación
    throw new Error('Pendiente de implementación');
  }
}
