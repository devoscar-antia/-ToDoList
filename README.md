# 📱 Todo List App

## 🛠️ **Tecnologías Utilizadas**

### **Frontend:** 🎨

- **Ionic Framework v8** - Framework híbrido para aplicaciones móviles
- **Angular v20** - Framework de desarrollo frontend con Standalone Components
- **TypeScript** - Lenguaje de programación tipado
- **SCSS/Sass** - Preprocesador CSS con variables y mixins
- **RxJS** - Programación reactiva y manejo de estado
- **Heroicons** - Biblioteca de iconos SVG personalizados

### **Backend:** ⚙️

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web para API REST
- **CORS** - Middleware para permitir peticiones cross-origin
- **UUID** - Generación de identificadores únicos

### **Base de Datos:** 🗄️

- **SQLite** - Base de datos local para funcionamiento offline
- **@capacitor-community/sqlite** - Plugin para acceso a SQLite en Capacitor

### **Herramientas de Desarrollo:** 🔧

- **Capacitor v7.4.2** - Runtime nativo para aplicaciones híbridas
- **Angular CLI** - Herramientas de línea de comandos para Angular
- **Gradle** - Sistema de construcción para Android
- **Android Studio** - IDE para desarrollo Android

### **Características Especiales:** ✨

- **Modo offline** con sincronización automática
- **Interfaz 100% en español** con sistema de internacionalización
- **Diseño responsive** para móviles y web
- **Animaciones CSS** para mejor experiencia de usuario

## 🚀 **Instrucciones de Instalación y Ejecución**

### **Prerrequisitos:** 📋

- Node.js 18+ instalado
- npm o yarn
- Android Studio (para generar APK)
- Dispositivo Android o emulador

### **1. Clonar y Instalar Dependencias:** 📥

```bash
git clone <url-del-repositorio>
cd todo-app
npm install
```

### **2. Ejecutar en Desarrollo (Web):** 🌐

```bash
npm start
```

La aplicación se abrirá en `http://localhost:4200/`

### **3. Construir para Producción:** 🏗️

```bash
npm run build
```

### **4. Generar APK para Android:** 📱

```bash
# Sincronizar con Capacitor
npx cap sync

# Abrir en Android Studio
npx cap open android

# Construir APK desde Android Studio
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

### **5. Ejecutar en Dispositivo Android:** 📲

```bash
# Conectar dispositivo Android via USB
# Habilitar "Depuración USB" en opciones de desarrollador
npx cap run android
```

### **6. Comandos Útiles:** 💡

```bash
# Limpiar cache
npm run clean

# Ejecutar tests
npm test

# Linting
npm run lint

# Construir y sincronizar
npm run build && npx cap sync
```

### **7. Estructura del Proyecto:** 📁

```
todo-app/
├── src/                    # Código fuente
│   ├── app/               # Componentes principales
│   ├── services/          # Servicios y lógica de negocio
│   ├── models/            # Interfaces y tipos
│   └── pipes/             # Pipes personalizados
├── android/               # Proyecto Android nativo
├── www/                   # Archivos web construidos
└── capacitor.config.ts    # Configuración de Capacitor
```

### **8. Configuración de Base de Datos:** 🗃️

- **Web:** Usa localStorage automáticamente
- **Android:** Usa SQLite local con sincronización automática
- **API:** Configurada para sincronización cuando hay conexión

### **9. Características de la Aplicación:** 🎯

- ✅ Crear, editar, eliminar y marcar tareas como completadas
- ✅ Prioridades (Alta, Media, Baja) y categorías personalizables
- ✅ Fechas de vencimiento con validación inteligente
- ✅ Funcionamiento offline completo
- ✅ Sincronización automática cuando hay conexión
- ✅ Interfaz en español con animaciones suaves
- ✅ Diseño responsive para todos los dispositivos

### **10. Solución de Problemas:** 🔧

- **Error de puerto:** Si el puerto 4200 está ocupado, usar `npm start -- --port 4201`
- **Error de SQLite en web:** Normal, la app usa localStorage como fallback
- **APK no se instala:** Habilitar "Instalar aplicaciones de fuentes desconocidas" en Android
- **Errores de build:** Ejecutar `npm run clean` y reinstalar dependencias
