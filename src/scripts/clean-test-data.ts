import 'reflect-metadata';
import { DatabaseService } from '@services/database.service';
import { User } from '@entities/user.entity';
import { Field } from '@entities/field.entity';
import { Plot } from '@entities/plot.entity';
import { Variety } from '@entities/variety.entity';
import { WorkOrder } from '@entities/work-order.entity';
import { Activity } from '@entities/activity.entity';
import { InputUsage } from '@entities/input-usage.entity';

/**
 * Script para limpiar todos los datos de prueba de la base de datos
 * CUIDADO: Este script eliminará TODOS los datos
 * 
 * Ejecutar con: npm run seed:clean
 */
async function cleanTestData() {
  try {
    console.log('🧹 Iniciando limpieza de base de datos...\n');
    console.log('⚠️  ADVERTENCIA: Se eliminarán TODOS los datos de la base de datos.');
    console.log('⏳ Esperando 3 segundos...\n');

    // Esperar 3 segundos para dar chance de cancelar
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Inicializar conexión a la base de datos
    await DatabaseService.initialize();
    const dataSource = DatabaseService.getDataSource();

    console.log('🗑️  Eliminando datos...');

    // Orden de eliminación: de dependientes a independientes
    await dataSource.createQueryBuilder().delete().from(InputUsage).execute();
    console.log('   ✅ InputUsages eliminados');

    await dataSource.createQueryBuilder().delete().from(Activity).execute();
    console.log('   ✅ Activities eliminadas');

    await dataSource.createQueryBuilder().delete().from(WorkOrder).execute();
    console.log('   ✅ WorkOrders eliminadas');

    await dataSource.createQueryBuilder().delete().from(Plot).execute();
    console.log('   ✅ Plots eliminadas');

    await dataSource.createQueryBuilder().delete().from(Field).execute();
    console.log('   ✅ Fields eliminados');

    await dataSource.createQueryBuilder().delete().from(Variety).execute();
    console.log('   ✅ Varieties eliminadas');

    await dataSource.createQueryBuilder().delete().from(User).execute();
    console.log('   ✅ Users eliminados');

    console.log('\n✅ Base de datos limpiada exitosamente');
    console.log('💡 Puedes ejecutar "npm run seed:test" para crear nuevos datos de prueba\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al limpiar datos:', error);
    process.exit(1);
  }
}

cleanTestData();
