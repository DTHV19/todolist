// Xử lý nghiệp vụ todo
const { v4: uuidv4 } = require('uuid');
const todoRepository = require('../repositories/todoRepository');

const getAllTodos = () => {
  return todoRepository.readTodos();
};

const getTodoById = (id) => {
  const todos = todoRepository.readTodos();
  return todos.find(t => t.id === id);
};

const createTodo = (title, description = '') => {
  const todos = todoRepository.readTodos();
  const newTodo = {
    id: uuidv4(),
    title: title.trim(),
    description: description.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  todos.push(newTodo);
  todoRepository.writeTodos(todos);
  return newTodo;
};

const updateTodo = (id, updates) => {
  const todos = todoRepository.readTodos();
  const todoIndex = todos.findIndex(t => t.id === id);
  if (todoIndex === -1) return null;
  const updatedTodo = {
    ...todos[todoIndex],
    ...(updates.title !== undefined && { title: updates.title.trim() }),
    ...(updates.description !== undefined && { description: updates.description.trim() }),
    ...(updates.completed !== undefined && { completed: updates.completed }),
    updatedAt: new Date().toISOString()
  };
  todos[todoIndex] = updatedTodo;
  todoRepository.writeTodos(todos);
  return updatedTodo;
};

const deleteTodo = (id) => {
  const todos = todoRepository.readTodos();
  const todoIndex = todos.findIndex(t => t.id === id);
  if (todoIndex === -1) return null;
  const deletedTodo = todos.splice(todoIndex, 1)[0];
  todoRepository.writeTodos(todos);
  return deletedTodo;
};

const toggleTodo = (id) => {
  const todos = todoRepository.readTodos();
  const todoIndex = todos.findIndex(t => t.id === id);
  if (todoIndex === -1) return null;
  todos[todoIndex].completed = !todos[todoIndex].completed;
  todos[todoIndex].updatedAt = new Date().toISOString();
  todoRepository.writeTodos(todos);
  return todos[todoIndex];
};

module.exports = {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodo
};
