/**
 * Script de migración para poblar el campo historicCostPerUnit en InputUsages existentes
 * 
 * Ejecutar con: npm run migrate:historic-cost
 * 
 * Este script:
 * 1. Busca todos los InputUsages que tienen historicCostPerUnit = 0 o null
 * 2. Obtiene el Input relacionado y captura su costPerUnit actual
 * 3. Actualiza el InputUsage con ese valor histórico
 * 
 * NOTA: Este es un enfoque simple que asume que el costo actual del Input
 * es una aproximación razonable del costo histórico. Para mayor precisión,
 * se podría buscar en PurchaseOrderDetails por fecha/transacción.
 */

import "reflect-metadata";
import { DatabaseService } from "@services/database.service";
import { InputUsage } from "@entities/input-usage.entity";
import { Input } from "@entities/input.entity";

const migrateHistoricCost = async () => {
  try {
    console.log('🚀 Iniciando migración de costos históricos...\n');

    // Inicializar conexión a la base de datos
    const dataSource = await DatabaseService.initialize();
    console.log('✅ Conexión a la base de datos establecida\n');

    const inputUsageRepository = dataSource.getRepository(InputUsage);
    const inputRepository = dataSource.getRepository(Input);

    // Obtener todos los InputUsages que necesitan migración
    const inputUsages = await inputUsageRepository
      .createQueryBuilder('inputUsage')
      .where('inputUsage.historicCostPerUnit = 0 OR inputUsage.historicCostPerUnit IS NULL')
      .getMany();

    console.log(`📊 Encontrados ${inputUsages.length} registros de InputUsage para migrar\n`);

    if (inputUsages.length === 0) {
      console.log('✨ No hay registros para migrar. Todo está actualizado.\n');
      await DatabaseService.shutdown();
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    // Procesar en lotes para mejor rendimiento
    const batchSize = 100;
    for (let i = 0; i < inputUsages.length; i += batchSize) {
      const batch = inputUsages.slice(i, i + batchSize);
      
      await dataSource.transaction(async (manager) => {
        for (const inputUsage of batch) {
          try {
            // Obtener el Input relacionado
            const input = await manager.findOne(Input, {
              where: { id: inputUsage.inputId }
            });

            if (!input) {
              console.warn(`⚠️  Input no encontrado para InputUsage ${inputUsage.id}`);
              errorCount++;
              continue;
            }

            // Actualizar con el costo actual del Input
            const historicCost = Number(input.costPerUnit || 0);
            
            await manager.update(InputUsage, inputUsage.id, {
              historicCostPerUnit: historicCost
            });

            migratedCount++;
          } catch (error) {
            console.error(`❌ Error al migrar InputUsage ${inputUsage.id}:`, error);
            errorCount++;
          }
        }
      });

      const progress = Math.min(i + batchSize, inputUsages.length);
      console.log(`📈 Progreso: ${progress}/${inputUsages.length} registros procesados`);
    }

    console.log('\n✅ Migración completada\n');
    console.log(`📊 Resumen:`);
    console.log(`   - Registros migrados exitosamente: ${migratedCount}`);
    console.log(`   - Registros con errores: ${errorCount}`);
    console.log(`   - Total procesados: ${migratedCount + errorCount}\n`);

    // Cerrar conexión
    await DatabaseService.shutdown();
    console.log('👋 Conexión cerrada. Script finalizado.\n');
    
  } catch (error) {
    console.error('❌ Error fatal durante la migración:', error);
    await DatabaseService.shutdown();
    process.exit(1);
  }
};

// Ejecutar migración
migrateHistoricCost();
