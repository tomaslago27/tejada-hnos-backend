import { DataSource } from 'typeorm';
import { GoodsReceipt } from '@entities/goods-receipt.entity';
import { PurchaseOrder } from '@entities/purchase-order.entity';
import { PurchaseOrderDetail } from '@entities/purchase-order-detail.entity';
import { Input } from '@entities/input.entity';

export class GoodsReceiptService {
  constructor(private readonly dataSource: DataSource) {}

  public async create(): Promise<GoodsReceipt> {
    // Pendiente de implementación
    throw new Error('Pendiente de implementación');
  }
}
