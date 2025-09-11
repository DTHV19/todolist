const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const todosFilePath = path.join(__dirname, '..', 'data', 'todos.json');

// Helper functions
const readTodos = () => {
  try {
    const data = fs.readFileSync(todosFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeTodos = (todos) => {
  try {
    fs.writeFileSync(todosFilePath, JSON.stringify(todos, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing todos:', error);
    return false;
  }
};

// GET all todos
router.get('/', (req, res) => {
  try {
    const todos = readTodos();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// GET todo by id
router.get('/:id', (req, res) => {
  try {
    const todos = readTodos();
    const todo = todos.find(t => t.id === req.params.id);
    
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

// POST new todo
router.post('/', (req, res) => {
  try {
    const { title, description = '' } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const todos = readTodos();
    const newTodo = {
      id: uuidv4(),
      title: title.trim(),
      description: description.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    todos.push(newTodo);
    
    if (writeTodos(todos)) {
      res.status(201).json(newTodo);
    } else {
      res.status(500).json({ error: 'Failed to save todo' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PUT update todo
router.put('/:id', (req, res) => {
  try {
    const todos = readTodos();
    const todoIndex = todos.findIndex(t => t.id === req.params.id);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const { title, description, completed } = req.body;
    const updatedTodo = {
      ...todos[todoIndex],
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(completed !== undefined && { completed }),
      updatedAt: new Date().toISOString()
    };

    todos[todoIndex] = updatedTodo;
    
    if (writeTodos(todos)) {
      res.json(updatedTodo);
    } else {
      res.status(500).json({ error: 'Failed to update todo' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE todo
router.delete('/:id', (req, res) => {
  try {
    const todos = readTodos();
    const todoIndex = todos.findIndex(t => t.id === req.params.id);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const deletedTodo = todos.splice(todoIndex, 1)[0];
    
    if (writeTodos(todos)) {
      res.json({ message: 'Todo deleted successfully', todo: deletedTodo });
    } else {
      res.status(500).json({ error: 'Failed to delete todo' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// PATCH toggle todo completion
router.patch('/:id/toggle', (req, res) => {
  try {
    const todos = readTodos();
    const todoIndex = todos.findIndex(t => t.id === req.params.id);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    todos[todoIndex].completed = !todos[todoIndex].completed;
    todos[todoIndex].updatedAt = new Date().toISOString();
    
    if (writeTodos(todos)) {
      res.json(todos[todoIndex]);
    } else {
      res.status(500).json({ error: 'Failed to toggle todo' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle todo' });
  }
});

module.exports = router;