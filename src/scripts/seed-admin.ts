import 'reflect-metadata';
import { DatabaseService } from '@services/database.service';
import { User } from '@entities/user.entity';
import { UserRole } from '@/enums';
import bcrypt from 'bcrypt';

/**
 * Script para crear un usuario administrador inicial
 * Ejecutar con: npm run seed:admin
 */
async function seedAdmin() {
  try {
    console.log('🌱 Iniciando seed de usuario administrador...');

    // Inicializar conexión a la base de datos
    await DatabaseService.initialize();

    const userRepository = DatabaseService.getDataSource().getRepository(User);

    // Verificar si ya existe un usuario admin
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@tejadahnos.com' },
    });

    if (existingAdmin) {
      console.log('⚠️  El usuario administrador ya existe.');
      process.exit(0);
    }

    // Crear usuario admin
    const adminUser = new User();
    adminUser.email = 'admin@tejadahnos.com';
    adminUser.name = 'Administrador';
    adminUser.lastName = 'Sistema';
    adminUser.role = UserRole.ADMIN;
    adminUser.passwordHash = await bcrypt.hash('admin123', 10);

    await userRepository.save(adminUser);

    console.log('✅ Usuario administrador creado exitosamente:');
    console.log('   Email: admin@tejadahnos.com');
    console.log('   Password: admin123');
    console.log('   Rol: ADMIN');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuario administrador:', error);
    process.exit(1);
  }
}

seedAdmin();
