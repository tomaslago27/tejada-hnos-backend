import { Request, Response } from 'express';
import { DataSource, Repository } from 'typeorm';
import { PurchaseOrder } from '@entities/purchase-order.entity';
import { PurchaseOrderDetail } from '@entities/purchase-order-detail.entity';
import { GoodsReceipt } from '@entities/goods-receipt.entity';
import { GoodsReceiptDetail } from '@entities/goods-receipt-detail.entity';
import { Input } from '@entities/input.entity';
import { PurchaseOrderStatus } from '@/enums';

/**
 * EJEMPLO DE SERVICIO/CONTROLADOR
 * 
 * Este archivo muestra cómo implementar las consultas y operaciones
 * para rastrear cantidades recibidas vs. pendientes en órdenes de compra.
 */

export class PurchaseOrderTrackingService {
  private purchaseOrderRepo: Repository<PurchaseOrder>;
  private goodsReceiptRepo: Repository<GoodsReceipt>;
  private inputRepo: Repository<Input>;

  constructor(private dataSource: DataSource) {
    this.purchaseOrderRepo = dataSource.getRepository(PurchaseOrder);
    this.goodsReceiptRepo = dataSource.getRepository(GoodsReceipt);
    this.inputRepo = dataSource.getRepository(Input);
  }

  /**
   * Obtener una orden de compra con TODO el detalle de recepciones
   */
  async getPurchaseOrderWithTracking(orderId: string) {
    const order = await this.purchaseOrderRepo.findOne({
      where: { id: orderId },
      relations: [
        'supplier',
        'details',
        'details.input',
        'details.receiptDetails',
        'details.receiptDetails.goodsReceipt',
        'details.receiptDetails.goodsReceipt.receivedBy',
        'receipts',
        'receipts.receivedBy',
        'receipts.details',
      ],
    });

    if (!order) {
      throw new Error('Orden de compra no encontrada');
    }

    // Transformar para incluir campos calculados
    return {
      ...order,
      details: order.details.map(detail => ({
        id: detail.id,
        input: {
          id: detail.input.id,
          name: detail.input.name,
          unit: detail.input.unit,
        },
        quantityOrdered: Number(detail.quantity),
        quantityReceived: detail.quantityReceived, // getter virtual
        quantityPending: detail.quantityPending,   // getter virtual
        isFullyReceived: detail.isFullyReceived,   // getter virtual
        percentageReceived: detail.quantity > 0 
          ? Math.round((detail.quantityReceived / Number(detail.quantity)) * 100) 
          : 0,
        unitPrice: Number(detail.unitPrice),
        totalOrdered: Number(detail.quantity) * Number(detail.unitPrice),
        totalReceived: detail.quantityReceived * Number(detail.unitPrice),
        receiptHistory: detail.receiptDetails.map(rd => ({
          receiptId: rd.goodsReceiptId,
          quantityReceived: Number(rd.quantityReceived),
          receivedAt: rd.goodsReceipt.receivedAt,
          receivedBy: {
            name: rd.goodsReceipt.receivedBy.name,
            lastName: rd.goodsReceipt.receivedBy.lastName,
          },
          notes: rd.notes,
        })),
      })),
      summary: {
        totalItems: order.details.length,
        fullyReceivedItems: order.details.filter(d => d.isFullyReceived).length,
        partiallyReceivedItems: order.details.filter(d => 
          d.quantityReceived > 0 && !d.isFullyReceived
        ).length,
        pendingItems: order.details.filter(d => d.quantityReceived === 0).length,
      },
    };
  }

  /**
   * Obtener solo los insumos pendientes de una orden
   */
  async getPendingItems(orderId: string) {
    const order = await this.purchaseOrderRepo.findOne({
      where: { id: orderId },
      relations: [
        'details',
        'details.input',
        'details.receiptDetails',
      ],
    });

    if (!order) {
      throw new Error('Orden de compra no encontrada');
    }

    // Filtrar solo los que tienen cantidad pendiente
    const pendingDetails = order.details.filter(
      detail => detail.quantityPending > 0
    );

    return pendingDetails.map(detail => ({
      inputId: detail.input.id,
      inputName: detail.input.name,
      unit: detail.input.unit,
      quantityOrdered: Number(detail.quantity),
      quantityReceived: detail.quantityReceived,
      quantityPending: detail.quantityPending,
      percentagePending: Math.round((detail.quantityPending / Number(detail.quantity)) * 100),
    }));
  }

  /**
   * Crear un remito de recepción con validaciones
   */
  async createGoodsReceipt(data: {
    purchaseOrderId: string;
    receivedById: string;
    notes?: string;
    details: Array<{
      purchaseOrderDetailId: string;
      quantityReceived: number;
      notes?: string;
    }>;
  }) {
    // 1. Obtener la orden con sus detalles
    const order = await this.purchaseOrderRepo.findOne({
      where: { id: data.purchaseOrderId },
      relations: ['details', 'details.input', 'details.receiptDetails'],
    });

    if (!order) {
      throw new Error('Orden de compra no encontrada');
    }

    // 2. Validar cada detalle
    for (const receiptDetail of data.details) {
      const orderDetail = order.details.find(
        d => d.id === receiptDetail.purchaseOrderDetailId
      );

      if (!orderDetail) {
        throw new Error(
          `Detalle de orden ${receiptDetail.purchaseOrderDetailId} no encontrado`
        );
      }

      const pendiente = orderDetail.quantityPending;
      if (receiptDetail.quantityReceived > pendiente) {
        throw new Error(
          `No se puede recibir ${receiptDetail.quantityReceived} ${orderDetail.input.unit} de "${orderDetail.input.name}". ` +
          `Solo quedan ${pendiente} ${orderDetail.input.unit} pendientes.`
        );
      }

      if (receiptDetail.quantityReceived <= 0) {
        throw new Error(
          `La cantidad recibida de "${orderDetail.input.name}" debe ser mayor a 0`
        );
      }
    }

    // 3. Crear el remito con sus detalles
    const receipt = this.goodsReceiptRepo.create({
      purchaseOrderId: data.purchaseOrderId,
      receivedById: data.receivedById,
      notes: data.notes,
      details: data.details,
    });

    await this.goodsReceiptRepo.save(receipt);

    // 4. Actualizar stock de insumos
    for (const receiptDetail of data.details) {
      const orderDetail = order.details.find(
        d => d.id === receiptDetail.purchaseOrderDetailId
      );
      
      if (orderDetail) {
        const input = await this.inputRepo.findOne({
          where: { id: orderDetail.inputId },
        });

        if (input) {
          input.stock = Number(input.stock) + receiptDetail.quantityReceived;
          input.costPerUnit = orderDetail.unitPrice; // Actualizar costo
          await this.inputRepo.save(input);
        }
      }
    }

    // 5. Actualizar estado de la orden
    const updatedOrder = await this.purchaseOrderRepo.findOne({
      where: { id: data.purchaseOrderId },
      relations: ['details', 'details.receiptDetails'],
    });

    if (updatedOrder) {
      const allReceived = updatedOrder.details.every(d => d.isFullyReceived);
      const someReceived = updatedOrder.details.some(d => d.quantityReceived > 0);

      if (allReceived) {
        updatedOrder.status = PurchaseOrderStatus.RECIBIDA;
      } else if (someReceived) {
        updatedOrder.status = PurchaseOrderStatus.RECIBIDA_PARCIAL;
      }

      await this.purchaseOrderRepo.save(updatedOrder);
    }

    // 6. Retornar el remito creado con todas las relaciones
    return await this.goodsReceiptRepo.findOne({
      where: { id: receipt.id },
      relations: [
        'purchaseOrder',
        'receivedBy',
        'details',
        'details.purchaseOrderDetail',
        'details.purchaseOrderDetail.input',
      ],
    });
  }

  /**
   * Obtener todas las órdenes con items pendientes
   */
  async getOrdersWithPendingItems() {
    const orders = await this.purchaseOrderRepo.find({
      where: {
        status: PurchaseOrderStatus.RECIBIDA_PARCIAL,
      },
      relations: [
        'supplier',
        'details',
        'details.input',
        'details.receiptDetails',
      ],
    });

    return orders
      .map(order => ({
        id: order.id,
        supplier: {
          id: order.supplier.id,
          name: order.supplier.name,
        },
        createdAt: order.createdAt,
        pendingItems: order.details
          .filter(d => d.quantityPending > 0)
          .map(d => ({
            inputName: d.input.name,
            unit: d.input.unit,
            quantityPending: d.quantityPending,
          })),
      }))
      .filter(order => order.pendingItems.length > 0);
  }

  /**
   * Reporte de insumos pendientes agrupados por proveedor
   */
  async getPendingItemsBySupplier() {
    const orders = await this.purchaseOrderRepo.find({
      where: [
        { status: PurchaseOrderStatus.APROBADA },
        { status: PurchaseOrderStatus.RECIBIDA_PARCIAL },
      ],
      relations: [
        'supplier',
        'details',
        'details.input',
        'details.receiptDetails',
      ],
    });

    const report: Record<string, any> = {};

    for (const order of orders) {
      const supplierName = order.supplier.name;
      
      if (!report[supplierName]) {
        report[supplierName] = {
          supplierId: order.supplier.id,
          supplierName: supplierName,
          pendingOrders: [],
        };
      }

      const pendingDetails = order.details.filter(d => d.quantityPending > 0);
      
      if (pendingDetails.length > 0) {
        report[supplierName].pendingOrders.push({
          orderId: order.id,
          orderDate: order.createdAt,
          items: pendingDetails.map(d => ({
            inputName: d.input.name,
            unit: d.input.unit,
            quantityOrdered: Number(d.quantity),
            quantityReceived: d.quantityReceived,
            quantityPending: d.quantityPending,
          })),
        });
      }
    }

    return Object.values(report);
  }
}

/**
 * EJEMPLO DE CONTROLADOR
 */
export class PurchaseOrderTrackingController {
  constructor(private service: PurchaseOrderTrackingService) {}

  /**
   * GET /api/purchase-orders/:id/tracking
   * Obtener orden con detalle completo de recepciones
   */
  async getOrderTracking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await this.service.getPurchaseOrderWithTracking(id);
      return res.json(data);
    } catch (error) {
      return res.status(404).json({ 
        message: error instanceof Error ? error.message : 'Error desconocido' 
      });
    }
  }

  /**
   * GET /api/purchase-orders/:id/pending
   * Obtener solo items pendientes de una orden
   */
  async getPendingItems(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await this.service.getPendingItems(id);
      return res.json(data);
    } catch (error) {
      return res.status(404).json({ 
        message: error instanceof Error ? error.message : 'Error desconocido' 
      });
    }
  }

  /**
   * POST /api/goods-receipts
   * Crear nuevo remito de recepción
   */
  async createReceipt(req: Request, res: Response) {
    try {
      const data = req.body;
      // @ts-ignore - receivedById vendría del usuario autenticado
      data.receivedById = req.user?.id;

      const receipt = await this.service.createGoodsReceipt(data);
      return res.status(201).json(receipt);
    } catch (error) {
      return res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Error al crear remito' 
      });
    }
  }

  /**
   * GET /api/purchase-orders/pending-items
   * Obtener todas las órdenes con items pendientes
   */
  async getOrdersWithPending(req: Request, res: Response) {
    try {
      const data = await this.service.getOrdersWithPendingItems();
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ 
        message: 'Error al obtener órdenes pendientes' 
      });
    }
  }

  /**
   * GET /api/reports/pending-by-supplier
   * Reporte de pendientes agrupados por proveedor
   */
  async getPendingBySupplier(req: Request, res: Response) {
    try {
      const data = await this.service.getPendingItemsBySupplier();
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ 
        message: 'Error al generar reporte' 
      });
    }
  }
}

/**
 * EJEMPLO DE USO EN ROUTES
 * 
 * import { Router } from 'express';
 * import { DatabaseService } from '@services/database.service';
 * 
 * const router = Router();
 * const service = new PurchaseOrderTrackingService(DatabaseService.getDataSource());
 * const controller = new PurchaseOrderTrackingController(service);
 * 
 * router.get('/purchase-orders/:id/tracking', (req, res) => controller.getOrderTracking(req, res));
 * router.get('/purchase-orders/:id/pending', (req, res) => controller.getPendingItems(req, res));
 * router.get('/purchase-orders/pending-items', (req, res) => controller.getOrdersWithPending(req, res));
 * router.post('/goods-receipts', (req, res) => controller.createReceipt(req, res));
 * router.get('/reports/pending-by-supplier', (req, res) => controller.getPendingBySupplier(req, res));
 * 
 * export default router;
 */
