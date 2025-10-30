import 'reflect-metadata';
import { DatabaseService } from '@services/database.service';
import { User } from '@entities/user.entity';
import { Field } from '@entities/field.entity';
import { Plot } from '@entities/plot.entity';
import { Variety } from '@entities/variety.entity';
import { WorkOrder } from '@entities/work-order.entity';
import { Activity } from '@entities/activity.entity';
import { UserRole, WorkOrderStatus, ActivityType } from '@/enums';
import bcrypt from 'bcrypt';

/**
 * Script para popular la base de datos con datos de prueba
 * para verificar el flujo de autorización del middleware
 * 
 * Ejecutar con: npm run seed:test
 */
async function seedTestData() {
  try {
    console.log('🌱 Iniciando seed de datos de prueba...\n');

    // Inicializar conexión a la base de datos
    await DatabaseService.initialize();
    const dataSource = DatabaseService.getDataSource();

    // Repositorios
    const userRepo = dataSource.getRepository(User);
    const fieldRepo = dataSource.getRepository(Field);
    const plotRepo = dataSource.getRepository(Plot);
    const varietyRepo = dataSource.getRepository(Variety);
    const workOrderRepo = dataSource.getRepository(WorkOrder);
    const activityRepo = dataSource.getRepository(Activity);

    // ==========================================
    // 1. CREAR USUARIOS
    // ==========================================
    console.log('👤 Creando usuarios...');

    // Admin
    const admin = userRepo.create({
      email: 'admin@tejadahnos.com',
      name: 'Admin',
      lastName: 'Principal',
      role: UserRole.ADMIN,
      passwordHash: await bcrypt.hash('admin123', 10),
      hourlyRate: 0,
    });
    await userRepo.save(admin);
    console.log('   ✅ Admin creado: admin@tejadahnos.com / admin123');

    // Capataz 1 (gestiona Campo Norte)
    const capataz1 = userRepo.create({
      email: 'capataz1@tejadahnos.com',
      name: 'Juan',
      lastName: 'Pérez',
      role: UserRole.CAPATAZ,
      passwordHash: await bcrypt.hash('capataz123', 10),
      hourlyRate: 25.50,
    });
    await userRepo.save(capataz1);
    console.log('   ✅ Capataz 1 creado: capataz1@tejadahnos.com / capataz123');

    // Capataz 2 (gestiona Campo Sur)
    const capataz2 = userRepo.create({
      email: 'capataz2@tejadahnos.com',
      name: 'María',
      lastName: 'González',
      role: UserRole.CAPATAZ,
      passwordHash: await bcrypt.hash('capataz123', 10),
      hourlyRate: 27.00,
    });
    await userRepo.save(capataz2);
    console.log('   ✅ Capataz 2 creado: capataz2@tejadahnos.com / capataz123');

    // Capataz 3 (sin campos gestionados)
    const capataz3 = userRepo.create({
      email: 'capataz3@tejadahnos.com',
      name: 'Carlos',
      lastName: 'Rodríguez',
      role: UserRole.CAPATAZ,
      passwordHash: await bcrypt.hash('capataz123', 10),
      hourlyRate: 24.00,
    });
    await userRepo.save(capataz3);
    console.log('   ✅ Capataz 3 creado (sin campos): capataz3@tejadahnos.com / capataz123');

    // Operario 1
    const operario1 = userRepo.create({
      email: 'operario1@tejadahnos.com',
      name: 'Pedro',
      lastName: 'Martínez',
      role: UserRole.OPERARIO,
      passwordHash: await bcrypt.hash('operario123', 10),
      hourlyRate: 18.50,
    });
    await userRepo.save(operario1);
    console.log('   ✅ Operario 1 creado: operario1@tejadahnos.com / operario123');

    // Operario 2
    const operario2 = userRepo.create({
      email: 'operario2@tejadahnos.com',
      name: 'Ana',
      lastName: 'López',
      role: UserRole.OPERARIO,
      passwordHash: await bcrypt.hash('operario123', 10),
      hourlyRate: 17.00,
    });
    await userRepo.save(operario2);
    console.log('   ✅ Operario 2 creado: operario2@tejadahnos.com / operario123\n');

    // ==========================================
    // 2. CREAR VARIEDADES
    // ==========================================
    console.log('🌾 Creando variedades...');

    const varietyTomate = varietyRepo.create({
      name: 'Tomate Cherry',
      description: 'Variedad de tomate pequeño y dulce',
    });
    await varietyRepo.save(varietyTomate);

    const varietyLechuga = varietyRepo.create({
      name: 'Lechuga Romana',
      description: 'Variedad de lechuga de hojas largas',
    });
    await varietyRepo.save(varietyLechuga);

    const varietyPimiento = varietyRepo.create({
      name: 'Pimiento Rojo',
      description: 'Variedad de pimiento dulce',
    });
    await varietyRepo.save(varietyPimiento);

    console.log('   ✅ 3 variedades creadas\n');

    // ==========================================
    // 3. CREAR CAMPOS (FIELDS)
    // ==========================================
    console.log('🏞️  Creando campos...');

    // Campo Norte (gestionado por Capataz 1)
    const campoNorte = fieldRepo.create({
      name: 'Campo Norte',
      area: 250,
      address: 'Camino Rural Km 12, Zona Norte',
      location: {
        type: 'Polygon',
        coordinates: [[
          [-74.5, 4.6],
          [-74.5, 4.7],
          [-74.4, 4.7],
          [-74.4, 4.6],
          [-74.5, 4.6],
        ]],
      },
      managerId: capataz1.id,
    });
    await fieldRepo.save(campoNorte);
    console.log(`   ✅ Campo Norte creado (Manager: ${capataz1.name})`);

    // Campo Sur (gestionado por Capataz 2)
    const campoSur = fieldRepo.create({
      name: 'Campo Sur',
      area: 180,
      address: 'Ruta Provincial 45, Zona Sur',
      location: {
        type: 'Polygon',
        coordinates: [[
          [-74.6, 4.5],
          [-74.6, 4.6],
          [-74.5, 4.6],
          [-74.5, 4.5],
          [-74.6, 4.5],
        ]],
      },
      managerId: capataz2.id,
    });
    await fieldRepo.save(campoSur);
    console.log(`   ✅ Campo Sur creado (Manager: ${capataz2.name})`);

    // Campo Este (sin manager asignado)
    const campoEste = fieldRepo.create({
      name: 'Campo Este',
      area: 321,
      address: 'Acceso Este S/N, Paraje Los Sauces',
      location: {
        type: 'Polygon',
        coordinates: [[
          [-74.3, 4.6],
          [-74.3, 4.7],
          [-74.2, 4.7],
          [-74.2, 4.6],
          [-74.3, 4.6],
        ]],
      },
    });
    await fieldRepo.save(campoEste);
    console.log('   ✅ Campo Este creado (sin manager)\n');

    // ==========================================
    // 4. CREAR PARCELAS (PLOTS)
    // ==========================================
    console.log('📍 Creando parcelas...');

    // Parcelas en Campo Norte
    const plotNorte1 = plotRepo.create({
      name: 'Parcela Norte A1',
      area: 80,
      fieldId: campoNorte.id,
      varietyId: varietyTomate.id,
      datePlanted: new Date('2025-09-01'),
      location: {
        type: 'Polygon',
        coordinates: [[
          [-74.5, 4.6],
          [-74.5, 4.65],
          [-74.45, 4.65],
          [-74.45, 4.6],
          [-74.5, 4.6],
        ]],
      },
    });
    await plotRepo.save(plotNorte1);

    const plotNorte2 = plotRepo.create({
      name: 'Parcela Norte A2',
      area: 91,
      fieldId: campoNorte.id,
      varietyId: varietyLechuga.id,
      datePlanted: new Date('2025-09-15'),
      location: {
        type: 'Polygon',
        coordinates: [[
          [-74.45, 4.65],
          [-74.45, 4.7],
          [-74.4, 4.7],
          [-74.4, 4.65],
          [-74.45, 4.65],
        ]],
      },
    });
    await plotRepo.save(plotNorte2);

    console.log('   ✅ 2 parcelas en Campo Norte');

    // Parcelas en Campo Sur
    const plotSur1 = plotRepo.create({
      name: 'Parcela Sur B1',
      area: 60,
      fieldId: campoSur.id,
      varietyId: varietyPimiento.id,
      datePlanted: new Date('2025-08-20'),
      location: {
        type: 'Polygon',
        coordinates: [[
          [-74.6, 4.5],
          [-74.6, 4.55],
          [-74.55, 4.55],
          [-74.55, 4.5],
          [-74.6, 4.5],
        ]],
      },
    });
    await plotRepo.save(plotSur1);

    const plotSur2 = plotRepo.create({
      name: 'Parcela Sur B2',
      area: 70,
      fieldId: campoSur.id,
      varietyId: varietyTomate.id,
      datePlanted: new Date('2025-09-10'),
      location: {
        type: 'Polygon',
        coordinates: [[
          [-74.55, 4.55],
          [-74.55, 4.6],
          [-74.5, 4.6],
          [-74.5, 4.55],
          [-74.55, 4.55],
        ]],
      },
    });
    await plotRepo.save(plotSur2);

    console.log('   ✅ 2 parcelas en Campo Sur');

    // Parcelas en Campo Este
    const plotEste1 = plotRepo.create({
      name: 'Parcela Este C1',
      area: 100,
      fieldId: campoEste.id,
      varietyId: varietyLechuga.id,
      datePlanted: new Date('2025-09-05'),
      location: {
        type: 'Polygon',
        coordinates: [[
          [-74.3, 4.6],
          [-74.3, 4.65],
          [-74.25, 4.65],
          [-74.25, 4.6],
          [-74.3, 4.6],
        ]],
      },
    });
    await plotRepo.save(plotEste1);

    console.log('   ✅ 1 parcela en Campo Este\n');

    // ==========================================
    // 5. CREAR ÓRDENES DE TRABAJO
    // ==========================================
    console.log('📋 Creando órdenes de trabajo...');

    // OT 1: En Campo Norte, asignada a Operario 1
    const wo1 = workOrderRepo.create({
      title: 'Riego Campo Norte - Tomate',
      description: 'Riego programado de parcela de tomates',
      scheduledDate: new Date('2025-11-01'),
      dueDate: new Date('2025-11-02'),
      status: WorkOrderStatus.PENDING,
      assignedToId: operario1.id,
      plots: [plotNorte1],
    });
    await workOrderRepo.save(wo1);
    console.log('   ✅ OT-1: Riego Campo Norte → Operario 1');

    // OT 2: En Campo Norte, asignada a Capataz 1
    const wo2 = workOrderRepo.create({
      title: 'Cosecha Campo Norte - Lechuga',
      description: 'Cosecha de lechugas maduras',
      scheduledDate: new Date('2025-11-03'),
      dueDate: new Date('2025-11-04'),
      status: WorkOrderStatus.IN_PROGRESS,
      assignedToId: capataz1.id,
      plots: [plotNorte2],
    });
    await workOrderRepo.save(wo2);
    console.log('   ✅ OT-2: Cosecha Campo Norte → Capataz 1');

    // OT 3: En Campo Sur, asignada a Operario 2
    const wo3 = workOrderRepo.create({
      title: 'Fumigación Campo Sur - Pimientos',
      description: 'Aplicación de tratamiento preventivo',
      scheduledDate: new Date('2025-11-05'),
      dueDate: new Date('2025-11-05'),
      status: WorkOrderStatus.PENDING,
      assignedToId: operario2.id,
      plots: [plotSur1],
    });
    await workOrderRepo.save(wo3);
    console.log('   ✅ OT-3: Fumigación Campo Sur → Operario 2');

    // OT 4: En Campo Sur, sin asignar (debería verla Capataz 2)
    const wo4 = workOrderRepo.create({
      title: 'Mantenimiento Campo Sur',
      description: 'Mantenimiento general de instalaciones',
      scheduledDate: new Date('2025-11-06'),
      dueDate: new Date('2025-11-07'),
      status: WorkOrderStatus.PENDING,
      plots: [plotSur2],
    });
    await workOrderRepo.save(wo4);
    console.log('   ✅ OT-4: Mantenimiento Campo Sur → Sin asignar');

    // OT 5: En Campo Este, asignada a Operario 1 (campo sin manager)
    const wo5 = workOrderRepo.create({
      title: 'Inspección Campo Este',
      description: 'Inspección general de cultivos',
      scheduledDate: new Date('2025-11-08'),
      dueDate: new Date('2025-11-08'),
      status: WorkOrderStatus.PENDING,
      assignedToId: operario1.id,
      plots: [plotEste1],
    });
    await workOrderRepo.save(wo5);
    console.log('   ✅ OT-5: Inspección Campo Este → Operario 1');

    // OT 6: Asignada a Capataz 3 (sin campos gestionados)
    const wo6 = workOrderRepo.create({
      title: 'Supervisión General',
      description: 'Supervisión de todas las operaciones',
      scheduledDate: new Date('2025-11-09'),
      dueDate: new Date('2025-11-10'),
      status: WorkOrderStatus.PENDING,
      assignedToId: capataz3.id,
      plots: [plotEste1],
    });
    await workOrderRepo.save(wo6);
    console.log('   ✅ OT-6: Supervisión → Capataz 3 (sin campos)\n');

    // ==========================================
    // 6. CREAR ACTIVIDADES
    // ==========================================
    console.log('⚡ Creando actividades...');

    // Actividades para OT-1 (Operario 1)
    const act1 = activityRepo.create({
      type: ActivityType.RIEGO,
      executionDate: new Date('2025-11-01T08:00:00'),
      hoursWorked: 2.5,
      workOrderId: wo1.id,
      details: {
        type: ActivityType.RIEGO,
        details: {
          duracionHoras: 2.5,
          metodo: 'GOTEO',
        },
      },
    });
    await activityRepo.save(act1);

    const act2 = activityRepo.create({
      type: ActivityType.RIEGO,
      executionDate: new Date('2025-11-01T14:00:00'),
      hoursWorked: 2.0,
      workOrderId: wo1.id,
      details: {
        type: ActivityType.RIEGO,
        details: {
          duracionHoras: 2.0,
          metodo: 'GOTEO',
        },
      },
    });
    await activityRepo.save(act2);
    console.log('   ✅ 2 actividades en OT-1 (Operario 1)');

    // Actividades para OT-2 (Capataz 1)
    const act3 = activityRepo.create({
      type: ActivityType.COSECHA,
      executionDate: new Date('2025-11-03T07:00:00'),
      hoursWorked: 4.0,
      workOrderId: wo2.id,
      details: {
        type: ActivityType.COSECHA,
        details: {
          maquinaria: 'Manual',
        },
      },
    });
    await activityRepo.save(act3);
    console.log('   ✅ 1 actividad en OT-2 (Capataz 1)');

    // Actividades para OT-3 (Operario 2)
    const act4 = activityRepo.create({
      type: ActivityType.APLICACION,
      executionDate: new Date('2025-11-05T06:00:00'),
      hoursWorked: 3.5,
      workOrderId: wo3.id,
      details: {
        type: ActivityType.APLICACION,
        details: {
          maquinaria: 'Fumigadora Manual',
          condicionesClimaticas: 'Viento leve, 18°C',
        },
      },
    });
    await activityRepo.save(act4);
    console.log('   ✅ 1 actividad en OT-3 (Operario 2)');

    // Actividades para OT-4 (sin asignar)
    const act5 = activityRepo.create({
      type: ActivityType.MANTENIMIENTO,
      executionDate: new Date('2025-11-06T09:00:00'),
      hoursWorked: 5.0,
      workOrderId: wo4.id,
      details: {
        type: ActivityType.MANTENIMIENTO,
        details: {
          descripcion: 'Reparación de sistema de riego - Cambio de válvulas principales',
        },
      },
    });
    await activityRepo.save(act5);
    console.log('   ✅ 1 actividad en OT-4 (sin asignar)\n');

    // ==========================================
    // RESUMEN
    // ==========================================
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE\n');
    console.log('📊 RESUMEN:');
    console.log('   • 6 Usuarios (1 Admin, 3 Capataces, 2 Operarios)');
    console.log('   • 3 Variedades');
    console.log('   • 3 Campos');
    console.log('   • 5 Parcelas');
    console.log('   • 6 Órdenes de Trabajo');
    console.log('   • 5 Actividades\n');

    console.log('👤 USUARIOS PARA TESTING:\n');
    console.log('   ADMIN:');
    console.log('   • admin@tejadahnos.com / admin123');
    console.log('   → Acceso total sin restricciones\n');
    
    console.log('   CAPATACES:');
    console.log('   • capataz1@tejadahnos.com / capataz123');
    console.log('     → Gestiona: Campo Norte (2 parcelas, 2 OTs)');
    console.log('   • capataz2@tejadahnos.com / capataz123');
    console.log('     → Gestiona: Campo Sur (2 parcelas, 2 OTs)');
    console.log('   • capataz3@tejadahnos.com / capataz123');
    console.log('     → Sin campos gestionados (1 OT asignada)\n');
    
    console.log('   OPERARIOS:');
    console.log('   • operario1@tejadahnos.com / operario123');
    console.log('     → OTs asignadas: OT-1, OT-5 (2 OTs, 2 actividades)');
    console.log('   • operario2@tejadahnos.com / operario123');
    console.log('     → OTs asignadas: OT-3 (1 OT, 1 actividad)\n');

    console.log('🧪 CASOS DE PRUEBA SUGERIDOS:\n');
    console.log('   1. Capataz1 → debe ver OT-1, OT-2 (Campo Norte)');
    console.log('   2. Capataz2 → debe ver OT-3, OT-4 (Campo Sur)');
    console.log('   3. Capataz3 → solo debe ver OT-6 (sin campos)');
    console.log('   4. Operario1 → solo debe ver OT-1, OT-5');
    console.log('   5. Operario2 → solo debe ver OT-3');
    console.log('   6. Admin → debe ver todas las OTs (1-6)\n');

    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear datos de prueba:', error);
    process.exit(1);
  }
}

seedTestData();
