const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Almacenamiento en memoria (en producción usarías una base de datos)
let tasks = [
  {
    id: '1',
    title: 'Completar proyecto To-Do List',
    description: 'Implementar todas las funcionalidades de la aplicación',
    completed: false,
    priority: 'high',
    category: 'work',
    dueDate: '2024-01-15',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Estudiar Angular e Ionic',
    description: 'Repasar conceptos de componentes y servicios',
    completed: true,
    priority: 'medium',
    category: 'study',
    dueDate: '2024-01-10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Rutas de la API

// GET /api/tasks - Obtener todas las tareas
app.get('/api/tasks', (req, res) => {
  try {
    // Filtros opcionales
    const { completed, priority, category, search } = req.query;
    let filteredTasks = [...tasks];

    if (completed !== undefined) {
      filteredTasks = filteredTasks.filter(task => 
        task.completed === (completed === 'true')
      );
    }

    if (priority) {
      filteredTasks = filteredTasks.filter(task => 
        task.priority === priority
      );
    }

    if (category) {
      filteredTasks = filteredTasks.filter(task => 
        task.category === category
      );
    }

    if (search) {
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: filteredTasks,
      total: filteredTasks.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las tareas',
      error: error.message
    });
  }
});

// GET /api/tasks/:id - Obtener una tarea específica
app.get('/api/tasks/:id', (req, res) => {
  try {
    const task = tasks.find(t => t.id === req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la tarea',
      error: error.message
    });
  }
});

// POST /api/tasks - Crear una nueva tarea
app.post('/api/tasks', (req, res) => {
  try {
    const { title, description, priority, category, dueDate } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El título es obligatorio'
      });
    }

    const newTask = {
      id: uuidv4(),
      title: title.trim(),
      description: description ? description.trim() : '',
      completed: false,
      priority: priority || 'medium',
      category: category || 'general',
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tasks.push(newTask);

    res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente',
      data: newTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear la tarea',
      error: error.message
    });
  }
});

// PUT /api/tasks/:id - Actualizar una tarea
app.put('/api/tasks/:id', (req, res) => {
  try {
    const taskIndex = tasks.findIndex(t => t.id === req.params.id);
    
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    const { title, description, completed, priority, category, dueDate } = req.body;

    if (title !== undefined && title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El título no puede estar vacío'
      });
    }

    const updatedTask = {
      ...tasks[taskIndex],
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(completed !== undefined && { completed }),
      ...(priority !== undefined && { priority }),
      ...(category !== undefined && { category }),
      ...(dueDate !== undefined && { dueDate }),
      updatedAt: new Date().toISOString()
    };

    tasks[taskIndex] = updatedTask;

    res.json({
      success: true,
      message: 'Tarea actualizada exitosamente',
      data: updatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la tarea',
      error: error.message
    });
  }
});

// DELETE /api/tasks/:id - Eliminar una tarea
app.delete('/api/tasks/:id', (req, res) => {
  try {
    const taskIndex = tasks.findIndex(t => t.id === req.params.id);
    
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    const deletedTask = tasks.splice(taskIndex, 1)[0];

    res.json({
      success: true,
      message: 'Tarea eliminada exitosamente',
      data: deletedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la tarea',
      error: error.message
    });
  }
});

// PATCH /api/tasks/:id/toggle - Cambiar estado de completado
app.patch('/api/tasks/:id/toggle', (req, res) => {
  try {
    const taskIndex = tasks.findIndex(t => t.id === req.params.id);
    
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    tasks[taskIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Estado de la tarea cambiado exitosamente',
      data: tasks[taskIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado de la tarea',
      error: error.message
    });
  }
});

// GET /api/stats - Obtener estadísticas
app.get('/api/stats', (req, res) => {
  try {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    
    const priorityStats = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    };

    const categoryStats = {};
    tasks.forEach(task => {
      categoryStats[task.category] = (categoryStats[task.category] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        total,
        completed,
        pending,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        priorityStats,
        categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API REST de To-Do List funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      'GET /api/tasks': 'Obtener todas las tareas',
      'GET /api/tasks/:id': 'Obtener una tarea específica',
      'POST /api/tasks': 'Crear una nueva tarea',
      'PUT /api/tasks/:id': 'Actualizar una tarea',
      'DELETE /api/tasks/:id': 'Eliminar una tarea',
      'PATCH /api/tasks/:id/toggle': 'Cambiar estado de completado',
      'GET /api/stats': 'Obtener estadísticas'
    }
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor API ejecutándose en http://localhost:${PORT}`);
  console.log(`📚 Documentación disponible en http://localhost:${PORT}/`);
});
