# 🚀 API REST - To-Do List

API REST completa para la aplicación To-Do List desarrollada en Node.js con Express.

## 📋 Características

- ✅ **Operaciones CRUD completas** para tareas
- 🔍 **Filtros y búsqueda** avanzada
- 📊 **Estadísticas** en tiempo real
- 🎯 **Prioridades** (Alta, Media, Baja)
- 📁 **Categorías** personalizables
- 📅 **Fechas de vencimiento**
- 🔄 **CORS habilitado** para desarrollo frontend

## 🛠️ Instalación

```bash
cd api
npm install
```

## 🚀 Ejecución

### Desarrollo (con auto-reload)
```bash
npm run dev
```

### Producción
```bash
npm start
```

La API estará disponible en: `http://localhost:3000`

## 📚 Endpoints

### 🔍 Obtener Tareas

#### GET /api/tasks
Obtiene todas las tareas con filtros opcionales.

**Query Parameters:**
- `completed` (boolean): Filtrar por estado
- `priority` (string): Filtrar por prioridad (high/medium/low)
- `category` (string): Filtrar por categoría
- `search` (string): Búsqueda en título y descripción

**Ejemplo:**
```bash
GET /api/tasks?completed=false&priority=high&category=work&search=proyecto
```

#### GET /api/tasks/:id
Obtiene una tarea específica por ID.

### ➕ Crear Tarea

#### POST /api/tasks
Crea una nueva tarea.

**Body:**
```json
{
  "title": "Nueva tarea",
  "description": "Descripción opcional",
  "priority": "high",
  "category": "work",
  "dueDate": "2024-01-15"
}
```

### ✏️ Actualizar Tarea

#### PUT /api/tasks/:id
Actualiza una tarea existente.

**Body:** Mismos campos que POST (todos opcionales)

### 🗑️ Eliminar Tarea

#### DELETE /api/tasks/:id
Elimina una tarea por ID.

### 🔄 Cambiar Estado

#### PATCH /api/tasks/:id/toggle
Cambia el estado de completado de una tarea.

### 📊 Estadísticas

#### GET /api/stats
Obtiene estadísticas generales de las tareas.

## 📊 Estructura de Datos

### Tarea
```json
{
  "id": "uuid",
  "title": "string (requerido)",
  "description": "string (opcional)",
  "completed": "boolean",
  "priority": "high|medium|low",
  "category": "string",
  "dueDate": "YYYY-MM-DD (opcional)",
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}
```

### Respuesta de la API
```json
{
  "success": "boolean",
  "message": "string (opcional)",
  "data": "object|array",
  "total": "number (opcional)",
  "error": "string (solo en errores)"
}
```

## 🔧 Configuración

### Variables de Entorno
- `PORT`: Puerto del servidor (default: 3000)

### CORS
La API está configurada para aceptar peticiones desde cualquier origen en desarrollo.

## 🧪 Testing

Puedes probar la API usando:

- **Postman** o **Insomnia**
- **cURL** desde terminal
- **Thunder Client** (extensión de VS Code)
- **Frontend de la aplicación**

## 📝 Ejemplos de Uso

### Crear una tarea
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implementar API",
    "description": "Crear endpoints REST",
    "priority": "high",
    "category": "development"
  }'
```

### Obtener tareas pendientes
```bash
curl "http://localhost:3000/api/tasks?completed=false"
```

### Cambiar estado de completado
```bash
curl -X PATCH http://localhost:3000/api/tasks/1/toggle
```

## 🚧 Próximas Mejoras

- [ ] **Base de datos** (MongoDB/PostgreSQL)
- [ ] **Autenticación** JWT
- [ ] **Validación** de datos con Joi
- [ ] **Logging** con Winston
- [ ] **Tests** unitarios y de integración
- [ ] **Documentación** con Swagger
- [ ] **Rate limiting**
- [ ] **Compresión** de respuestas

## 📞 Soporte

Para dudas o problemas, revisa los logs del servidor o contacta al desarrollador.
