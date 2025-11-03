import { DataSource } from 'typeorm';
import { GoodsReceipt } from '@entities/goods-receipt.entity';
import { PurchaseOrder } from '@entities/purchase-order.entity';
import { PurchaseOrderDetail } from '@entities/purchase-order-detail.entity';
import { Input } from '@entities/input.entity';
import { CreateGoodsReceiptDto } from '@dtos/goods-receipt.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';
import { PurchaseOrderStatus } from '@/enums';

export class GoodsReceiptService {
  constructor(private readonly dataSource: DataSource) {}

  public async create(data: CreateGoodsReceiptDto, userId: string): Promise<GoodsReceipt> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const purchaseOrderRepository = queryRunner.manager.getRepository(PurchaseOrder);
      const purchaseOrderDetailRepository = queryRunner.manager.getRepository(PurchaseOrderDetail);
      const goodsReceiptRepository = queryRunner.manager.getRepository(GoodsReceipt);
      const inputRepository = queryRunner.manager.getRepository(Input);

      const purchaseOrder = await purchaseOrderRepository.findOne({
        where: { id: data.purchaseOrderId },
        relations: ['details'],
      });

      if (!purchaseOrder) {
        throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de compra no encontrada');
      }

      const receipt = goodsReceiptRepository.create({
        purchaseOrderId: purchaseOrder.id,
        receivedById: userId,
      });

      if (data.notes) {
        receipt.notes = data.notes;
      }

      const savedReceipt = await goodsReceiptRepository.save(receipt);

      const receivedMap = new Map<string, number>();

      for (const detailDto of data.details) {
        const purchaseOrderDetail = await purchaseOrderDetailRepository.findOne({
          where: {
            id: detailDto.purchaseOrderDetailId,
            purchaseOrderId: purchaseOrder.id,
          },
          relations: ['input'],
        });

        if (!purchaseOrderDetail) {
          throw new HttpException(
            StatusCodes.NOT_FOUND,
            'Detalle de la orden de compra no encontrado'
          );
        }

        const input = purchaseOrderDetail.input;
        const currentStock = Number(input.stock ?? 0);
        const currentCost = Number(input.costPerUnit ?? 0);
        const receivedQuantity = Number(detailDto.quantityReceived);
        const receivedCost = Number(purchaseOrderDetail.unitPrice ?? 0);
        const newStock = currentStock + receivedQuantity;

        const newCost =
          newStock === 0
            ? currentCost
            : ((currentStock * currentCost) + (receivedQuantity * receivedCost)) / newStock;

        input.stock = Number(newStock.toFixed(2));
        input.costPerUnit = Number(newCost.toFixed(2));

        await inputRepository.save(input);

        receivedMap.set(
          purchaseOrderDetail.id,
          (receivedMap.get(purchaseOrderDetail.id) ?? 0) + receivedQuantity
        );
      }

      const isFullyReceived = (purchaseOrder.details ?? []).every(detail => {
        const orderedQuantity = Number(detail.quantity ?? 0);
        const receivedQuantity = receivedMap.get(detail.id) ?? 0;
        return receivedQuantity >= orderedQuantity;
      });

      purchaseOrder.status = isFullyReceived
        ? PurchaseOrderStatus.RECIBIDA
        : PurchaseOrderStatus.RECIBIDA_PARCIAL;

      await purchaseOrderRepository.save(purchaseOrder);

      await queryRunner.commitTransaction();

      return await this.dataSource.getRepository(GoodsReceipt).findOne({
        where: { id: savedReceipt.id },
        relations: ['purchaseOrder'],
      }) as GoodsReceipt;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
