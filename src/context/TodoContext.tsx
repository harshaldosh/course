import React, { createContext, useContext, useState, useEffect } from 'react';
import { Todo, TodoStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface TodoContextType {
  todos: Todo[];
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  getTodosByStatus: (status: TodoStatus) => Todo[];
  moveTodoToStatus: (id: string, newStatus: TodoStatus) => void;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos) : [];
  });

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (todo: Omit<Todo, 'id' | 'createdAt'>) => {
    const newTodo: Todo = {
      ...todo,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    
    setTodos(prevTodos => [...prevTodos, newTodo]);
    toast.success('Todo added successfully');
  };

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    setTodos(prevTodos => 
      prevTodos.map(todo => 
        todo.id === id 
          ? { ...todo, ...updates } 
          : todo
      )
    );
    toast.success('Todo updated successfully');
  };

  const deleteTodo = (id: string) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
    toast.success('Todo deleted successfully');
  };

  const getTodosByStatus = (status: TodoStatus) => {
    return todos.filter(todo => todo.status === status);
  };

  const moveTodoToStatus = (id: string, newStatus: TodoStatus) => {
    updateTodo(id, { status: newStatus });
    toast.success(`Todo moved to ${newStatus.replace('_', ' ')}`);
  };

  return (
    <TodoContext.Provider 
      value={{ 
        todos, 
        addTodo, 
        updateTodo, 
        deleteTodo, 
        getTodosByStatus,
        moveTodoToStatus
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};