import 'reflect-metadata';
import { DatabaseService } from '@services/database.service';

/**
 * Script para limpiar y recrear completamente la base de datos
 * CUIDADO: Este script eliminará TODAS las tablas y las recreará
 * 
 * Ejecutar con: npm run seed:clean
 */
async function cleanTestData() {
  try {
    console.log('🧹 Iniciando limpieza COMPLETA de base de datos...\n');
    console.log('⚠️  ADVERTENCIA: Se eliminarán TODAS las tablas y se recrearán desde cero.');
    console.log('⏳ Esperando 3 segundos para cancelar (Ctrl+C)...\n');

    // Esperar 3 segundos para dar chance de cancelar
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Inicializar conexión a la base de datos
    await DatabaseService.initialize();
    const dataSource = DatabaseService.getDataSource();

    console.log('🗑️  Eliminando todas las tablas...');

    // Eliminar todas las tablas usando dropDatabase
    await dataSource.dropDatabase();
    console.log('   ✅ Todas las tablas eliminadas');

    console.log('\n🏗️  Recreando estructura de base de datos...');

    // Sincronizar schema (recrear todas las tablas)
    await dataSource.synchronize();
    console.log('   ✅ Estructura de base de datos recreada');

    console.log('\n✅ Base de datos limpiada y recreada exitosamente');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. npm run seed:admin    → Crear usuario administrador');
    console.log('   2. npm run seed:test     → Crear datos de prueba (campos, órdenes, etc.)');
    console.log('   3. npm run seed:purchase → Crear datos de compras (proveedores, insumos, etc.)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al limpiar base de datos:', error);
    if (error instanceof Error) {
      console.error('   Detalle:', error.message);
    }
    process.exit(1);
  }
}

cleanTestData();
