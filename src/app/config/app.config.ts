export const AppConfig = {
    // Configuración de la API
    api: {
        baseUrl: 'http://localhost:3000/api',
        timeout: 10000, // 10 segundos
        retryAttempts: 3
    },

    // Configuración de sincronización
    sync: {
        autoSyncInterval: 30000, // 30 segundos
        maxRetryAttempts: 3,
        retryDelay: 5000 // 5 segundos
    },

    // Configuración de la base de datos local
    database: {
        name: 'todo_app',
        version: 1,
        encryption: false
    },

    // Configuración de la aplicación
    app: {
        name: 'Todo App',
        version: '1.0.0',
        debug: true
    }
};
