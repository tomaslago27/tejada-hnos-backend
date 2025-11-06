import 'reflect-metadata';
import { DatabaseService } from '@services/database.service';
import { Supplier } from '@entities/supplier.entity';
import { Customer } from '@entities/customer.entity';
import { Input } from '@entities/input.entity';
import { PurchaseOrder } from '@entities/purchase-order.entity';
import { PurchaseOrderDetail } from '@entities/purchase-order-detail.entity';
import { GoodsReceipt } from '@entities/goods-receipt.entity';
import { GoodsReceiptDetail } from '@entities/goods-receipt-detail.entity';
import { User } from '@entities/user.entity';
import { InputUnit, PurchaseOrderStatus, UserRole } from '@/enums';
import bcrypt from 'bcrypt';

/**
 * Script para popular la base de datos con datos de prueba de:
 * - Proveedores
 * - Clientes
 * - Insumos
 * - Órdenes de Compra
 * - Remitos de Recepción
 * 
 * Ejecutar con: npm run seed:purchase
 */
async function seedPurchaseData() {
  try {
    console.log('🌱 Iniciando seed de datos de compras y ventas...\n');

    // Inicializar conexión a la base de datos
    await DatabaseService.initialize();
    const dataSource = DatabaseService.getDataSource();

    // Repositorios
    const supplierRepo = dataSource.getRepository(Supplier);
    const customerRepo = dataSource.getRepository(Customer);
    const inputRepo = dataSource.getRepository(Input);
    const purchaseOrderRepo = dataSource.getRepository(PurchaseOrder);
    const purchaseOrderDetailRepo = dataSource.getRepository(PurchaseOrderDetail);
    const goodsReceiptRepo = dataSource.getRepository(GoodsReceipt);
    const goodsReceiptDetailRepo = dataSource.getRepository(GoodsReceiptDetail);
    const userRepo = dataSource.getRepository(User);

    // ==========================================
    // 1. OBTENER O CREAR USUARIO ADMIN
    // ==========================================
    console.log('👤 Verificando usuario administrador...');
    
    let adminUser = await userRepo.findOne({
      where: { role: UserRole.ADMIN },
    });

    if (!adminUser) {
      console.log('   ⚠️  No se encontró usuario admin, creando uno...');
      adminUser = userRepo.create({
        email: 'admin@tejadahnos.com',
        name: 'Admin',
        lastName: 'Sistema',
        role: UserRole.ADMIN,
        passwordHash: await bcrypt.hash('admin123', 10),
        hourlyRate: 0,
      });
      await userRepo.save(adminUser);
      console.log('   ✅ Usuario admin creado');
    } else {
      console.log('   ✅ Usuario admin encontrado');
    }

    // ==========================================
    // 2. CREAR PROVEEDORES
    // ==========================================
    console.log('\n📦 Creando proveedores...');

    const suppliers = [
      {
        name: 'Agroquímicos del Sur S.A.',
        taxId: '30-71234567-8',
        address: 'Av. Industria 1234, Mendoza',
        contactEmail: 'ventas@agroquimicossur.com.ar',
        phoneNumber: '+54 261 4567890',
      },
      {
        name: 'Fertilizantes San Juan',
        taxId: '30-71234568-9',
        address: 'Ruta 40 Km 45, San Juan',
        contactEmail: 'pedidos@fertilizantessj.com.ar',
        phoneNumber: '+54 264 4123456',
      },
      {
        name: 'Semillas y Plantines Los Andes',
        taxId: '33-71234569-0',
        address: 'Calle Principal 567, Tupungato',
        contactEmail: 'info@semillaslosandes.com',
        phoneNumber: '+54 2622 489123',
      },
      {
        name: 'Herramientas Agrícolas Norte',
        taxId: '30-71234570-1',
        address: 'Parque Industrial Luján, Local 12',
        contactEmail: 'ventas@herramientasnorte.com.ar',
        phoneNumber: '+54 261 4789012',
      },
      {
        name: 'Sistemas de Riego Cuyo',
        taxId: '30-71234571-2',
        address: 'Zona Industrial Este, Galpón 5',
        contactEmail: 'contacto@riegocuyo.com',
        phoneNumber: '+54 261 4890123',
      },
    ];

    const createdSuppliers: Supplier[] = [];
    for (const supplierData of suppliers) {
      const supplier = supplierRepo.create(supplierData);
      await supplierRepo.save(supplier);
      createdSuppliers.push(supplier);
    }
    console.log(`   ✅ ${createdSuppliers.length} proveedores creados`);

    // ==========================================
    // 3. CREAR CLIENTES
    // ==========================================
    console.log('\n👥 Creando clientes...');

    const customers = [
      {
        name: 'Exportadora de Nueces Premium S.A.',
        taxId: '30-71234580-3',
        address: 'Av. Exportadores 890, Buenos Aires',
        contactEmail: 'compras@nuecespremiun.com.ar',
        phoneNumber: '+54 11 4567-8901',
      },
      {
        name: 'Distribuidora Frutas Secas del Oeste',
        taxId: '30-71234581-4',
        address: 'Mercado Central, Nave 15',
        contactEmail: 'pedidos@frutassecas.com',
        phoneNumber: '+54 11 4234-5678',
      },
      {
        name: 'Cooperativa Agrícola Regional',
        taxId: '33-71234582-5',
        address: 'Ruta Provincial 50, Km 23',
        contactEmail: 'administracion@coopregional.coop',
        phoneNumber: '+54 261 4123-4567',
      },
      {
        name: 'Almacenes Naturales del Sur',
        taxId: '30-71234583-6',
        address: 'Calle Comercio 456, Neuquén',
        contactEmail: 'ventas@naturalesdelsur.com.ar',
        phoneNumber: '+54 299 4456-7890',
      },
      {
        name: 'Industrias Alimenticias Gourmet',
        taxId: '30-71234584-7',
        address: 'Parque Industrial Rosario, Lote 23',
        contactEmail: 'compras@gourmetindustrias.com',
        phoneNumber: '+54 341 4567-8901',
      },
      {
        name: 'Supermercados del Valle',
        taxId: '30-71234585-8',
        address: 'Av. Principal 2345, Mendoza',
        contactEmail: 'proveedores@superdelvalle.com.ar',
        phoneNumber: '+54 261 4890-1234',
      },
    ];

    const createdCustomers: Customer[] = [];
    for (const customerData of customers) {
      const customer = customerRepo.create(customerData);
      await customerRepo.save(customer);
      createdCustomers.push(customer);
    }
    console.log(`   ✅ ${createdCustomers.length} clientes creados`);

    // ==========================================
    // 4. CREAR INSUMOS
    // ==========================================
    console.log('\n🧪 Creando insumos...');

    const inputs = [
      // Fertilizantes
      {
        name: 'Fertilizante NPK 15-15-15',
        unit: InputUnit.KG,
        stock: 0,
        costPerUnit: 850.00,
      },
      {
        name: 'Urea Granulada 46%',
        unit: InputUnit.KG,
        stock: 0,
        costPerUnit: 720.00,
      },
      {
        name: 'Superfosfato Triple',
        unit: InputUnit.KG,
        stock: 0,
        costPerUnit: 680.00,
      },
      // Agroquímicos
      {
        name: 'Herbicida Glifosato 48%',
        unit: InputUnit.LITRO,
        stock: 0,
        costPerUnit: 1250.00,
      },
      {
        name: 'Insecticida Cipermetrina',
        unit: InputUnit.LITRO,
        stock: 0,
        costPerUnit: 1580.00,
      },
      {
        name: 'Fungicida Azufre Mojable',
        unit: InputUnit.KG,
        stock: 0,
        costPerUnit: 890.00,
      },
      // Herramientas y equipos
      {
        name: 'Trampa Cromática Amarilla',
        unit: InputUnit.UNIDAD,
        stock: 0,
        costPerUnit: 125.00,
      },
      {
        name: 'Tijera de Poda Profesional',
        unit: InputUnit.UNIDAD,
        stock: 0,
        costPerUnit: 4500.00,
      },
      {
        name: 'Rastrillo Metálico',
        unit: InputUnit.UNIDAD,
        stock: 0,
        costPerUnit: 2300.00,
      },
      // Sistema de riego
      {
        name: 'Cinta de Riego por Goteo (rollo 100m)',
        unit: InputUnit.UNIDAD,
        stock: 0,
        costPerUnit: 8900.00,
      },
      {
        name: 'Goteros Autocompensados 2L/h',
        unit: InputUnit.UNIDAD,
        stock: 0,
        costPerUnit: 35.00,
      },
      {
        name: 'Válvula Solenoide 1"',
        unit: InputUnit.UNIDAD,
        stock: 0,
        costPerUnit: 12500.00,
      },
      // Otros insumos
      {
        name: 'Bolsas Cosecha 50kg',
        unit: InputUnit.UNIDAD,
        stock: 0,
        costPerUnit: 85.00,
      },
      {
        name: 'Estacas Metálicas 1.80m',
        unit: InputUnit.UNIDAD,
        stock: 0,
        costPerUnit: 890.00,
      },
      {
        name: 'Malla Antigranizo 4x100m',
        unit: InputUnit.UNIDAD,
        stock: 0,
        costPerUnit: 45000.00,
      },
    ];

    const createdInputs: Input[] = [];
    for (const inputData of inputs) {
      const input = inputRepo.create(inputData);
      await inputRepo.save(input);
      createdInputs.push(input);
    }
    console.log(`   ✅ ${createdInputs.length} insumos creados`);

    // ==========================================
    // 5. CREAR ÓRDENES DE COMPRA
    // ==========================================
    console.log('\n📋 Creando órdenes de compra...');

    // OC-1: Fertilizantes (Pendiente)
    const po1 = purchaseOrderRepo.create({
      status: PurchaseOrderStatus.PENDIENTE,
      totalAmount: 0,
      supplierId: createdSuppliers[1]!.id, // Fertilizantes San Juan
    });
    await purchaseOrderRepo.save(po1);

    const po1Details = [
      {
        purchaseOrderId: po1.id,
        inputId: createdInputs[0]!.id, // NPK
        quantity: 500,
        unitPrice: 850.00,
      },
      {
        purchaseOrderId: po1.id,
        inputId: createdInputs[1]!.id, // Urea
        quantity: 300,
        unitPrice: 720.00,
      },
      {
        purchaseOrderId: po1.id,
        inputId: createdInputs[2]!.id, // Superfosfato
        quantity: 200,
        unitPrice: 680.00,
      },
    ];

    let po1Total = 0;
    for (const detail of po1Details) {
      const poDetail = purchaseOrderDetailRepo.create(detail);
      await purchaseOrderDetailRepo.save(poDetail);
      po1Total += detail.quantity * detail.unitPrice;
    }
    po1.totalAmount = po1Total;
    await purchaseOrderRepo.save(po1);
    console.log(`   ✅ OC-1 creada: Fertilizantes ($${po1Total.toFixed(2)}) - ${PurchaseOrderStatus.PENDIENTE}`);

    // OC-2: Agroquímicos (Aprobada)
    const po2 = purchaseOrderRepo.create({
      status: PurchaseOrderStatus.APROBADA,
      totalAmount: 0,
      supplierId: createdSuppliers[0]!.id, // Agroquímicos del Sur
    });
    await purchaseOrderRepo.save(po2);

    const po2Details = [
      {
        purchaseOrderId: po2.id,
        inputId: createdInputs[3]!.id, // Glifosato
        quantity: 50,
        unitPrice: 1250.00,
      },
      {
        purchaseOrderId: po2.id,
        inputId: createdInputs[4]!.id, // Cipermetrina
        quantity: 30,
        unitPrice: 1580.00,
      },
      {
        purchaseOrderId: po2.id,
        inputId: createdInputs[5]!.id, // Azufre
        quantity: 100,
        unitPrice: 890.00,
      },
    ];

    let po2Total = 0;
    for (const detail of po2Details) {
      const poDetail = purchaseOrderDetailRepo.create(detail);
      await purchaseOrderDetailRepo.save(poDetail);
      po2Total += detail.quantity * detail.unitPrice;
    }
    po2.totalAmount = po2Total;
    await purchaseOrderRepo.save(po2);
    console.log(`   ✅ OC-2 creada: Agroquímicos ($${po2Total.toFixed(2)}) - ${PurchaseOrderStatus.APROBADA}`);

    // OC-3: Herramientas (Recibida - tendrá remito)
    const po3 = purchaseOrderRepo.create({
      status: PurchaseOrderStatus.RECIBIDA,
      totalAmount: 0,
      supplierId: createdSuppliers[3]!.id, // Herramientas Agrícolas Norte
    });
    await purchaseOrderRepo.save(po3);

    const po3Details = [
      {
        purchaseOrderId: po3.id,
        inputId: createdInputs[6]!.id, // Trampas
        quantity: 200,
        unitPrice: 125.00,
      },
      {
        purchaseOrderId: po3.id,
        inputId: createdInputs[7]!.id, // Tijeras
        quantity: 25,
        unitPrice: 4500.00,
      },
      {
        purchaseOrderId: po3.id,
        inputId: createdInputs[8]!.id, // Rastrillos
        quantity: 15,
        unitPrice: 2300.00,
      },
    ];

    let po3Total = 0;
    for (const detail of po3Details) {
      const poDetail = purchaseOrderDetailRepo.create(detail);
      await purchaseOrderDetailRepo.save(poDetail);
      po3Total += detail.quantity * detail.unitPrice;
    }
    po3.totalAmount = po3Total;
    await purchaseOrderRepo.save(po3);
    console.log(`   ✅ OC-3 creada: Herramientas ($${po3Total.toFixed(2)}) - ${PurchaseOrderStatus.RECIBIDA}`);

    // OC-4: Sistema de Riego (Recibida Parcial - tendrá remito parcial)
    const po4 = purchaseOrderRepo.create({
      status: PurchaseOrderStatus.RECIBIDA_PARCIAL,
      totalAmount: 0,
      supplierId: createdSuppliers[4]!.id, // Sistemas de Riego Cuyo
    });
    await purchaseOrderRepo.save(po4);

    const po4Details = [
      {
        purchaseOrderId: po4.id,
        inputId: createdInputs[9]!.id, // Cinta de riego
        quantity: 50,
        unitPrice: 8900.00,
      },
      {
        purchaseOrderId: po4.id,
        inputId: createdInputs[10]!.id, // Goteros
        quantity: 1000,
        unitPrice: 35.00,
      },
      {
        purchaseOrderId: po4.id,
        inputId: createdInputs[11]!.id, // Válvulas
        quantity: 20,
        unitPrice: 12500.00,
      },
    ];

    let po4Total = 0;
    for (const detail of po4Details) {
      const poDetail = purchaseOrderDetailRepo.create(detail);
      await purchaseOrderDetailRepo.save(poDetail);
      po4Total += detail.quantity * detail.unitPrice;
    }
    po4.totalAmount = po4Total;
    await purchaseOrderRepo.save(po4);
    console.log(`   ✅ OC-4 creada: Sistema de Riego ($${po4Total.toFixed(2)}) - ${PurchaseOrderStatus.RECIBIDA_PARCIAL}`);

    // OC-5: Insumos varios (Cerrada - recibida completamente)
    const po5 = purchaseOrderRepo.create({
      status: PurchaseOrderStatus.CERRADA,
      totalAmount: 0,
      supplierId: createdSuppliers[2]!.id, // Semillas y Plantines Los Andes
    });
    await purchaseOrderRepo.save(po5);

    const po5Details = [
      {
        purchaseOrderId: po5.id,
        inputId: createdInputs[12]!.id, // Bolsas
        quantity: 500,
        unitPrice: 85.00,
      },
      {
        purchaseOrderId: po5.id,
        inputId: createdInputs[13]!.id, // Estacas
        quantity: 300,
        unitPrice: 890.00,
      },
    ];

    let po5Total = 0;
    for (const detail of po5Details) {
      const poDetail = purchaseOrderDetailRepo.create(detail);
      await purchaseOrderDetailRepo.save(poDetail);
      po5Total += detail.quantity * detail.unitPrice;
    }
    po5.totalAmount = po5Total;
    await purchaseOrderRepo.save(po5);
    console.log(`   ✅ OC-5 creada: Insumos Varios ($${po5Total.toFixed(2)}) - ${PurchaseOrderStatus.CERRADA}`);

    // OC-6: Malla antigranizo (Cancelada)
    const po6 = purchaseOrderRepo.create({
      status: PurchaseOrderStatus.CANCELADA,
      totalAmount: 0,
      supplierId: createdSuppliers[3]!.id, // Herramientas Agrícolas Norte
    });
    await purchaseOrderRepo.save(po6);

    const po6Details = [
      {
        purchaseOrderId: po6.id,
        inputId: createdInputs[14]!.id, // Malla antigranizo
        quantity: 10,
        unitPrice: 45000.00,
      },
    ];

    let po6Total = 0;
    for (const detail of po6Details) {
      const poDetail = purchaseOrderDetailRepo.create(detail);
      await purchaseOrderDetailRepo.save(poDetail);
      po6Total += detail.quantity * detail.unitPrice;
    }
    po6.totalAmount = po6Total;
    await purchaseOrderRepo.save(po6);
    console.log(`   ✅ OC-6 creada: Malla Antigranizo ($${po6Total.toFixed(2)}) - ${PurchaseOrderStatus.CANCELADA}`);

    // ==========================================
    // 6. CREAR REMITOS DE RECEPCIÓN CON DETALLES
    // ==========================================
    console.log('\n📄 Creando remitos de recepción con detalles...');

    // Obtener los IDs de los detalles de órdenes creados
    const po3DetailsFromDb = await purchaseOrderDetailRepo.find({
      where: { purchaseOrderId: po3.id },
      relations: ['input'],
    });
    const po4DetailsFromDb = await purchaseOrderDetailRepo.find({
      where: { purchaseOrderId: po4.id },
      relations: ['input'],
    });
    const po5DetailsFromDb = await purchaseOrderDetailRepo.find({
      where: { purchaseOrderId: po5.id },
      relations: ['input'],
    });

    // ========================================
    // REMITO 1: OC-3 - Recepción COMPLETA de todas las herramientas
    // ========================================
    const gr1 = goodsReceiptRepo.create({
      purchaseOrderId: po3.id,
      receivedById: adminUser.id,
      notes: 'Recepción completa de herramientas. Todo en perfecto estado.',
      receivedAt: new Date('2025-10-15T10:30:00'),
    });
    await goodsReceiptRepo.save(gr1);

    // Crear detalles del remito 1 (recibimos TODO lo pedido)
    for (const orderDetail of po3DetailsFromDb) {
      const receiptDetail = goodsReceiptDetailRepo.create({
        goodsReceiptId: gr1.id,
        purchaseOrderDetailId: orderDetail.id,
        quantityReceived: orderDetail.quantity, // Recibimos la cantidad completa
        notes: `Recepción completa de ${orderDetail.input.name}`,
      });
      await goodsReceiptDetailRepo.save(receiptDetail);

      // Actualizar stock
      const input = await inputRepo.findOne({ where: { id: orderDetail.inputId } });
      if (input) {
        input.stock = Number(input.stock) + Number(orderDetail.quantity);
        input.costPerUnit = orderDetail.unitPrice;
        await inputRepo.save(input);
      }
    }
    console.log('   ✅ Remito 1: Recepción completa OC-3 (3 items de herramientas - 100%)');

    // ========================================
    // REMITO 2: OC-4 - Recepción PARCIAL 1 (cintas y goteros, sin válvulas)
    // ========================================
    const gr2 = goodsReceiptRepo.create({
      purchaseOrderId: po4.id,
      receivedById: adminUser.id,
      notes: 'Primera entrega parcial: cintas de riego y goteros. Faltan válvulas.',
      receivedAt: new Date('2025-10-20T14:00:00'),
    });
    await goodsReceiptRepo.save(gr2);

    // Detalle 1: Cintas de riego (recibimos 30 de 50)
    const cintaDetail = po4DetailsFromDb.find(d => d.input.name.includes('Cinta'));
    if (cintaDetail) {
      const receiptDetail1 = goodsReceiptDetailRepo.create({
        goodsReceiptId: gr2.id,
        purchaseOrderDetailId: cintaDetail.id,
        quantityReceived: 30, // Solo 30 de 50
        notes: 'Primera entrega parcial de cintas. Pendiente: 20 unidades',
      });
      await goodsReceiptDetailRepo.save(receiptDetail1);

      // Actualizar stock
      const input = await inputRepo.findOne({ where: { id: cintaDetail.inputId } });
      if (input) {
        input.stock = Number(input.stock) + 30;
        input.costPerUnit = cintaDetail.unitPrice;
        await inputRepo.save(input);
      }
    }

    // Detalle 2: Goteros (recibimos 500 de 1000)
    const goterosDetail = po4DetailsFromDb.find(d => d.input.name.includes('Goteros'));
    if (goterosDetail) {
      const receiptDetail2 = goodsReceiptDetailRepo.create({
        goodsReceiptId: gr2.id,
        purchaseOrderDetailId: goterosDetail.id,
        quantityReceived: 500, // Solo 500 de 1000
        notes: 'Primera entrega parcial de goteros. Pendiente: 500 unidades',
      });
      await goodsReceiptDetailRepo.save(receiptDetail2);

      // Actualizar stock
      const input = await inputRepo.findOne({ where: { id: goterosDetail.inputId } });
      if (input) {
        input.stock = Number(input.stock) + 500;
        input.costPerUnit = goterosDetail.unitPrice;
        await inputRepo.save(input);
      }
    }

    // Nota: NO recibimos válvulas en este remito (0 de 20)
    console.log('   ✅ Remito 2: Recepción parcial OC-4 - Parte 1 (2/3 items, parciales)');
    console.log('      • Cintas: 30/50 (60%)');
    console.log('      • Goteros: 500/1000 (50%)');
    console.log('      • Válvulas: 0/20 (0%) ⚠️');

    // ========================================
    // REMITO 3: OC-4 - Recepción PARCIAL 2 (completamos cintas y goteros)
    // ========================================
    const gr3 = goodsReceiptRepo.create({
      purchaseOrderId: po4.id,
      receivedById: adminUser.id,
      notes: 'Segunda entrega: completando cintas y goteros. Válvulas aún pendientes.',
      receivedAt: new Date('2025-10-25T09:15:00'),
    });
    await goodsReceiptRepo.save(gr3);

    // Detalle 1: Cintas restantes (20 de 50 totales - completamos)
    if (cintaDetail) {
      const receiptDetail1 = goodsReceiptDetailRepo.create({
        goodsReceiptId: gr3.id,
        purchaseOrderDetailId: cintaDetail.id,
        quantityReceived: 20, // Completamos las 20 restantes
        notes: 'Completado: recibidas 20 cintas finales (50/50 total)',
      });
      await goodsReceiptDetailRepo.save(receiptDetail1);

      // Actualizar stock
      const input = await inputRepo.findOne({ where: { id: cintaDetail.inputId } });
      if (input) {
        input.stock = Number(input.stock) + 20;
        await inputRepo.save(input);
      }
    }

    // Detalle 2: Goteros restantes (500 de 1000 totales - completamos)
    if (goterosDetail) {
      const receiptDetail2 = goodsReceiptDetailRepo.create({
        goodsReceiptId: gr3.id,
        purchaseOrderDetailId: goterosDetail.id,
        quantityReceived: 500, // Completamos los 500 restantes
        notes: 'Completado: recibidos 500 goteros finales (1000/1000 total)',
      });
      await goodsReceiptDetailRepo.save(receiptDetail2);

      // Actualizar stock
      const input = await inputRepo.findOne({ where: { id: goterosDetail.inputId } });
      if (input) {
        input.stock = Number(input.stock) + 500;
        await inputRepo.save(input);
      }
    }

    // Nota: Aún NO recibimos válvulas (0 de 20 pendientes)
    console.log('   ✅ Remito 3: Recepción parcial OC-4 - Parte 2 (2/3 items completos)');
    console.log('      • Cintas: 50/50 (100%) ✅');
    console.log('      • Goteros: 1000/1000 (100%) ✅');
    console.log('      • Válvulas: 0/20 (0%) ⚠️ AÚN PENDIENTE');

    // ========================================
    // REMITO 4: OC-5 - Recepción COMPLETA de insumos varios
    // ========================================
    const gr4 = goodsReceiptRepo.create({
      purchaseOrderId: po5.id,
      receivedById: adminUser.id,
      notes: 'Recepción completa. Material verificado y en buen estado.',
      receivedAt: new Date('2025-10-28T11:45:00'),
    });
    await goodsReceiptRepo.save(gr4);

    // Crear detalles del remito 4 (recibimos TODO lo pedido)
    for (const orderDetail of po5DetailsFromDb) {
      const receiptDetail = goodsReceiptDetailRepo.create({
        goodsReceiptId: gr4.id,
        purchaseOrderDetailId: orderDetail.id,
        quantityReceived: orderDetail.quantity, // Recibimos la cantidad completa
        notes: `Recepción completa de ${orderDetail.input.name}`,
      });
      await goodsReceiptDetailRepo.save(receiptDetail);

      // Actualizar stock
      const input = await inputRepo.findOne({ where: { id: orderDetail.inputId } });
      if (input) {
        input.stock = Number(input.stock) + Number(orderDetail.quantity);
        input.costPerUnit = orderDetail.unitPrice;
        await inputRepo.save(input);
      }
    }
    console.log('   ✅ Remito 4: Recepción completa OC-5 (2 items - 100%)');

    // ==========================================
    // RESUMEN
    // ==========================================
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ DATOS DE COMPRAS Y VENTAS CREADOS EXITOSAMENTE\n');
    console.log('📊 RESUMEN:');
    console.log(`   • ${createdSuppliers.length} Proveedores`);
    console.log(`   • ${createdCustomers.length} Clientes`);
    console.log(`   • ${createdInputs.length} Insumos`);
    console.log('   • 6 Órdenes de Compra');
    console.log('   • 4 Remitos de Recepción\n');

    console.log('📦 PROVEEDORES:');
    createdSuppliers.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.name} (${s.taxId})`);
    });

    console.log('\n👥 CLIENTES:');
    createdCustomers.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.taxId})`);
    });

    console.log('\n🧪 INSUMOS (con stock actualizado):');
    const inputsWithStock = await inputRepo.find({ order: { name: 'ASC' } });
    inputsWithStock.forEach((input) => {
      const stockInfo = Number(input.stock) > 0 
        ? `${input.stock} ${input.unit}` 
        : 'Sin stock';
      console.log(`   • ${input.name}: ${stockInfo} ($${input.costPerUnit}/ud)`);
    });

    console.log('\n📋 ÓRDENES DE COMPRA:');
    console.log(`   OC-1: ${createdSuppliers[1]!.name} - $${po1Total.toFixed(2)} - ${PurchaseOrderStatus.PENDIENTE}`);
    console.log(`   OC-2: ${createdSuppliers[0]!.name} - $${po2Total.toFixed(2)} - ${PurchaseOrderStatus.APROBADA}`);
    console.log(`   OC-3: ${createdSuppliers[3]!.name} - $${po3Total.toFixed(2)} - ${PurchaseOrderStatus.RECIBIDA} ✓`);
    console.log(`   OC-4: ${createdSuppliers[4]!.name} - $${po4Total.toFixed(2)} - ${PurchaseOrderStatus.RECIBIDA_PARCIAL} ⚠️`);
    console.log(`   OC-5: ${createdSuppliers[2]!.name} - $${po5Total.toFixed(2)} - ${PurchaseOrderStatus.CERRADA} ✓`);
    console.log(`   OC-6: ${createdSuppliers[3]!.name} - $${po6Total.toFixed(2)} - ${PurchaseOrderStatus.CANCELADA} ✗`);

    console.log('\n📄 REMITOS DE RECEPCIÓN CON DETALLES:');
    console.log('   • Remito 1: OC-3 - Recepción completa (3/3 items al 100%)');
    console.log('   • Remito 2: OC-4 - Recepción parcial 1:');
    console.log('     ├─ Cintas: 30/50 (60%)');
    console.log('     ├─ Goteros: 500/1000 (50%)');
    console.log('     └─ Válvulas: 0/20 (0%)');
    console.log('   • Remito 3: OC-4 - Recepción parcial 2:');
    console.log('     ├─ Cintas: +20 → 50/50 (100%) ✅');
    console.log('     ├─ Goteros: +500 → 1000/1000 (100%) ✅');
    console.log('     └─ Válvulas: 0/20 (0%) ⚠️');
    console.log('   • Remito 4: OC-5 - Recepción completa (2/2 items al 100%)');

    console.log('\n🎯 ESTADO FINAL DE ÓRDENES:');
    console.log('   • OC-3: RECIBIDA (todo completo)');
    console.log('   • OC-4: RECIBIDA_PARCIAL (faltan 20 válvulas)');
    console.log('   • OC-5: RECIBIDA (todo completo)');

    console.log('\n🧪 CASOS DE PRUEBA SUGERIDOS:');
    console.log('   1. GET /purchase-orders/:id/tracking');
    console.log('      → Ver cantidades recibidas vs pendientes por insumo');
    console.log('   2. GET /purchase-orders/:id/pending');
    console.log('      → Ver solo items pendientes (ej: OC-4 muestra 20 válvulas)');
    console.log('   3. POST /goods-receipts');
    console.log('      → Crear remito para completar OC-4 (20 válvulas)');
    console.log('   4. POST /goods-receipts');
    console.log('      → Crear remito para OC-2 (Aprobada, sin recepciones)');
    console.log('   5. Verificar campos calculados:');
    console.log('      • quantityReceived (suma automática de todos los remitos)');
    console.log('      • quantityPending (cantidad - recibido)');
    console.log('      • isFullyReceived (boolean)');
    console.log('   6. Verificar actualización automática de stock');
    console.log('   7. Verificar cambios automáticos de estado de órdenes\n');

    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear datos de compras:', error);
    process.exit(1);
  }
}

seedPurchaseData();
