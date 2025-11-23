import 'reflect-metadata';
import { DatabaseService } from '@services/database.service';
import { User } from '@entities/user.entity';
import { UserRole } from '@/enums';
import bcrypt from 'bcrypt';

/**
 * Script para crear usuarios de prueba usados en `docs/report-api-tests.http`.
 *
 * Emails/Passwords creados:
 * - admin@tejadahnos.com / admin123
 * - capataz@tejadahnos.com / Capataz123!
 * - operario@tejadahnos.com / Operario123!
 *
 * Ejecutar con: npx ts-node -r tsconfig-paths/register src/scripts/seed-test-users.ts
 */
async function seedTestUsers() {
  try {
    console.log('🌱 Iniciando seed de usuarios de prueba...');
    await DatabaseService.initialize();
    const ds = DatabaseService.getDataSource();
    const userRepo = ds.getRepository(User);

    // Helper para crear si no existe
    const ensureUser = async (email: string, password: string, role: UserRole, name = 'Test', lastName = 'User', hourlyRate?: number) => {
      const existing = await userRepo.findOne({ where: { email } });
      if (existing) {
        console.log(`   ⚠️ Usuario ya existe: ${email}`);
        return existing;
      }

      const user = userRepo.create({
        email,
        name,
        lastName,
        role,
        passwordHash: await bcrypt.hash(password, 10),
        hourlyRate: hourlyRate ?? 0,
      } as any);

      await userRepo.save(user);
      console.log(`   ✅ Usuario creado: ${email} / ${password} (role: ${role})`);
      return user;
    };

    // Admin (may already exist in seeds)
    await ensureUser('admin@tejadahnos.com', 'admin123', UserRole.ADMIN, 'Admin', 'Principal', 0);

    // Usuarios usados por los tests HTTP del docs
    await ensureUser('capataz@tejadahnos.com', '1capataz123', UserRole.CAPATAZ, 'Capataz', 'Prueba', 25);
    await ensureUser('operario@tejadahnos.com', '1operario123', UserRole.OPERARIO, 'Operario', 'Prueba', 18);

    console.log('\n✅ Seed de usuarios de prueba completado.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuarios de prueba:', error);
    process.exit(1);
  }
}

seedTestUsers();
