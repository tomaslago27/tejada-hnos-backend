# Guía de Pruebas - Sistema de Autorización

## 🚀 Preparación del Entorno

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar base de datos
Asegúrate de que tu archivo `.env` tenga la configuración correcta:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=tejada_hnos_test
```

### 3. Limpiar base de datos (opcional)
Si ya tienes datos previos:
```bash
npm run seed:clean
```

### 4. Popular base de datos con datos de prueba
```bash
npm run seed:test
```

---

## 👥 Usuarios de Prueba

### ADMIN
- **Email**: `admin@tejadahnos.com`
- **Password**: `admin123`
- **Permisos**: Acceso total sin restricciones

### CAPATACES

#### Capataz 1 - Juan Pérez
- **Email**: `capataz1@tejadahnos.com`
- **Password**: `capataz123`
- **Gestiona**: Campo Norte
- **Parcelas**: Parcela Norte A1, Parcela Norte A2
- **OTs**: OT-1 (Operario 1), OT-2 (asignada a él)

#### Capataz 2 - María González
- **Email**: `capataz2@tejadahnos.com`
- **Password**: `capataz123`
- **Gestiona**: Campo Sur
- **Parcelas**: Parcela Sur B1, Parcela Sur B2
- **OTs**: OT-3 (Operario 2), OT-4 (sin asignar)

#### Capataz 3 - Carlos Rodríguez
- **Email**: `capataz3@tejadahnos.com`
- **Password**: `capataz123`
- **Gestiona**: Ningún campo (caso especial)
- **OTs**: OT-6 (asignada a él)
- **Comportamiento**: Se comporta como OPERARIO (solo ve sus OTs asignadas)

### OPERARIOS

#### Operario 1 - Pedro Martínez
- **Email**: `operario1@tejadahnos.com`
- **Password**: `operario123`
- **OTs asignadas**: OT-1 (Campo Norte), OT-5 (Campo Este)
- **Actividades**: 2 actividades en OT-1

#### Operario 2 - Ana López
- **Email**: `operario2@tejadahnos.com`
- **Password**: `operario123`
- **OTs asignadas**: OT-3 (Campo Sur)
- **Actividades**: 1 actividad en OT-3

---

## 🧪 Casos de Prueba

### Iniciar el servidor
```bash
npm run dev
```

### Obtener tokens JWT
Primero, obtén los tokens de autenticación:

```http
### Login Admin
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@tejadahnos.com",
  "password": "admin123"
}

### Login Capataz 1
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "capataz1@tejadahnos.com",
  "password": "capataz123"
}

### Login Operario 1
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "operario1@tejadahnos.com",
  "password": "operario123"
}
```

---

## ✅ Test Cases por Rol

### 1. ADMIN - Acceso Total

```http
### Ver todos los campos (debería ver 3)
GET http://localhost:3000/api/fields
Authorization: Bearer {{adminToken}}

### Ver todas las parcelas (debería ver 5)
GET http://localhost:3000/api/plots
Authorization: Bearer {{adminToken}}

### Ver todas las OTs (debería ver 6)
GET http://localhost:3000/api/work-orders
Authorization: Bearer {{adminToken}}

### Ver todas las actividades (debería ver 5)
GET http://localhost:3000/api/activities
Authorization: Bearer {{adminToken}}
```

**Resultado Esperado**: ✅ Ve todos los recursos sin filtros

---

### 2. CAPATAZ 1 - Campo Norte

```http
### Ver campos (debería ver solo Campo Norte)
GET http://localhost:3000/api/fields
Authorization: Bearer {{capataz1Token}}

### Ver parcelas (debería ver 2: Norte A1, Norte A2)
GET http://localhost:3000/api/plots
Authorization: Bearer {{capataz1Token}}

### Ver OTs (debería ver 2: OT-1, OT-2)
GET http://localhost:3000/api/work-orders
Authorization: Bearer {{capataz1Token}}

### Ver actividades (debería ver 3: 2 de OT-1 + 1 de OT-2)
GET http://localhost:3000/api/activities
Authorization: Bearer {{capataz1Token}}

### Intentar ver parcela de Campo Sur (debería fallar)
GET http://localhost:3000/api/plots/{plotSur1Id}
Authorization: Bearer {{capataz1Token}}
```

**Resultados Esperados**:
- ✅ Ve solo recursos de Campo Norte y sus OTs asignadas
- ❌ 403 FORBIDDEN al acceder a parcela de Campo Sur

---

### 3. CAPATAZ 2 - Campo Sur

```http
### Ver campos (debería ver solo Campo Sur)
GET http://localhost:3000/api/fields
Authorization: Bearer {{capataz2Token}}

### Ver parcelas (debería ver 2: Sur B1, Sur B2)
GET http://localhost:3000/api/plots
Authorization: Bearer {{capataz2Token}}

### Ver OTs (debería ver 2: OT-3, OT-4)
GET http://localhost:3000/api/work-orders
Authorization: Bearer {{capataz2Token}}

### Ver actividades (debería ver 2: 1 de OT-3 + 1 de OT-4)
GET http://localhost:3000/api/activities
Authorization: Bearer {{capataz2Token}}

### Intentar modificar OT de Campo Norte (debería fallar)
PUT http://localhost:3000/api/work-orders/{wo1Id}
Authorization: Bearer {{capataz2Token}}
Content-Type: application/json

{
  "title": "Modificación no autorizada"
}
```

**Resultados Esperados**:
- ✅ Ve solo recursos de Campo Sur
- ❌ 403 FORBIDDEN al modificar OT de Campo Norte

---

### 4. CAPATAZ 3 - Sin Campos Gestionados

```http
### Ver campos (debería ver 0)
GET http://localhost:3000/api/fields
Authorization: Bearer {{capataz3Token}}

### Ver parcelas (debería ver 0)
GET http://localhost:3000/api/plots
Authorization: Bearer {{capataz3Token}}

### Ver OTs (debería ver solo 1: OT-6 asignada a él)
GET http://localhost:3000/api/work-orders
Authorization: Bearer {{capataz3Token}}

### Ver actividades (debería ver 0)
GET http://localhost:3000/api/activities
Authorization: Bearer {{capataz3Token}}
```

**Resultados Esperados**:
- ✅ Se comporta como OPERARIO: solo ve su OT asignada
- ✅ No ve campos ni parcelas de otros

---

### 5. OPERARIO 1 - OTs Asignadas

```http
### Ver campos (debería ver TODOS para el mapa)
GET http://localhost:3000/api/fields
Authorization: Bearer {{operario1Token}}

### Ver parcelas (debería ver TODAS para el mapa)
GET http://localhost:3000/api/plots
Authorization: Bearer {{operario1Token}}

### Ver OTs (debería ver solo 2: OT-1, OT-5)
GET http://localhost:3000/api/work-orders
Authorization: Bearer {{operario1Token}}

### Ver actividades (debería ver solo 2 de OT-1)
GET http://localhost:3000/api/activities
Authorization: Bearer {{operario1Token}}

### Intentar ver OT de otro operario (debería fallar)
GET http://localhost:3000/api/work-orders/{wo3Id}
Authorization: Bearer {{operario1Token}}

### Intentar crear actividad en OT de otro (debería fallar)
POST http://localhost:3000/api/work-orders/{wo3Id}/activities
Authorization: Bearer {{operario1Token}}
Content-Type: application/json

{
  "type": "RIEGO",
  "description": "Intento no autorizado",
  "executionDate": "2025-11-10T08:00:00",
  "duration": 2.0
}
```

**Resultados Esperados**:
- ✅ Ve campos y parcelas (para mapa interactivo)
- ✅ Solo ve OTs asignadas a él (OT-1, OT-5)
- ✅ Solo ve actividades de sus OTs
- ❌ 403 FORBIDDEN al acceder a OT de otro usuario
- ❌ 403 FORBIDDEN al crear actividad en OT ajena

---

### 6. OPERARIO 2 - OTs Asignadas

```http
### Ver OTs (debería ver solo 1: OT-3)
GET http://localhost:3000/api/work-orders
Authorization: Bearer {{operario2Token}}

### Ver actividades (debería ver solo 1 de OT-3)
GET http://localhost:3000/api/activities
Authorization: Bearer {{operario2Token}}

### Crear actividad en su propia OT (debería funcionar)
POST http://localhost:3000/api/work-orders/{wo3Id}/activities
Authorization: Bearer {{operario2Token}}
Content-Type: application/json

{
  "type": "FUMIGACION",
  "description": "Segunda aplicación de fungicida",
  "executionDate": "2025-11-05T14:00:00",
  "duration": 2.5
}

### Intentar filtrar por otro assignedToId (debería fallar)
GET http://localhost:3000/api/work-orders?assignedToId={operario1Id}
Authorization: Bearer {{operario2Token}}
```

**Resultados Esperados**:
- ✅ Solo ve OT-3 asignada a él
- ✅ Puede crear actividades en su OT
- ❌ 403 FORBIDDEN al filtrar por otro usuario

---

## 📊 Matriz de Validación

| Usuario | GET Fields | GET Plots | GET Work Orders | GET /work-orders/:id | POST Activity |
|---------|-----------|-----------|----------------|---------------------|---------------|
| Admin | ✅ Todos | ✅ Todas | ✅ Todas (6) | ✅ Cualquiera | ✅ En cualquier OT |
| Capataz 1 | ✅ Solo Norte | ✅ 2 del Norte | ✅ 2 (OT-1, OT-2) | ✅ Si es de su campo | ✅ En OTs de su campo |
| Capataz 2 | ✅ Solo Sur | ✅ 2 del Sur | ✅ 2 (OT-3, OT-4) | ✅ Si es de su campo | ✅ En OTs de su campo |
| Capataz 3 | ❌ 0 | ❌ 0 | ✅ 1 (OT-6) | ✅ Solo OT-6 | ✅ Solo en OT-6 |
| Operario 1 | ✅ Todos | ✅ Todas | ✅ 2 (OT-1, OT-5) | ✅ Solo OT-1, OT-5 | ✅ Solo en OT-1, OT-5 |
| Operario 2 | ✅ Todos | ✅ Todas | ✅ 1 (OT-3) | ✅ Solo OT-3 | ✅ Solo en OT-3 |

---

## 🐛 Troubleshooting

### Error: "Usuario no autenticado"
- Verifica que el token JWT sea válido
- Asegúrate de usar el header `Authorization: Bearer <token>`

### Error: "La orden de trabajo no fue encontrada"
- Verifica que el ID de la OT sea correcto
- Usa los IDs generados en tu base de datos

### No veo los datos esperados
- Ejecuta `npm run seed:clean` y luego `npm run seed:test`
- Verifica que el servidor esté corriendo

### Campos o parcelas vacíos
- Verifica que el middleware `authorizeFieldAccess` esté aplicado correctamente en las rutas
- Revisa los logs del servidor para errores

---

## 🧹 Limpiar Datos

Para eliminar todos los datos de prueba:

```bash
npm run seed:clean
```

⚠️ **ADVERTENCIA**: Esto eliminará TODOS los datos de la base de datos.

---

## 📝 Notas

- Los tokens JWT expiran después de cierto tiempo (configurado en `JWT_EXPIRES_IN`)
- Si un token expira, simplemente haz login nuevamente
- Los datos de prueba son consistentes: cada vez que ejecutes `npm run seed:test` obtendrás los mismos datos
- Para crear variaciones, puedes modificar el script `seed-test-data.ts`

---

## 🎯 Objetivos de las Pruebas

1. ✅ Verificar que ADMIN tenga acceso total
2. ✅ Verificar que CAPATACES solo vean recursos de sus campos
3. ✅ Verificar que CAPATAZ sin campos se comporte como OPERARIO
4. ✅ Verificar que OPERARIOS solo vean sus OTs asignadas
5. ✅ Verificar que OPERARIOS vean campos/parcelas para el mapa
6. ✅ Verificar que nadie pueda acceder a recursos fuera de su alcance
7. ✅ Verificar que las actividades solo se creen en OTs autorizadas

---

**Última actualización**: 30 de octubre de 2025
