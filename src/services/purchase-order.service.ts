import { DataSource, Repository } from 'typeorm';
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
    // Pendiente de implementación
    throw new Error('Pendiente de implementación');
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
    // Pendiente de implementación
    throw new Error('Pendiente de implementación');
  }

  public async delete(id: string): Promise<PurchaseOrder> {
    // Pendiente de implementación
    throw new Error('Pendiente de implementación');
  }
}
