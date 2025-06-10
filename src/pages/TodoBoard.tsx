import React, { useState } from 'react';
import { TodoProvider, useTodos } from '../context/TodoContext';
import { Todo, TodoStatus } from '../types';
import { Plus, X, Calendar, Edit, Trash2 } from 'lucide-react';
import './TodoBoard.css';

const TodoBoard: React.FC = () => {
  return (
    <TodoProvider>
      <div className="todo-page fade-in">
        <div className="todo-header">
          <h1 className="page-heading">Todo Board</h1>
          <p className="subtitle">Manage your tasks with this Kanban-style board</p>
        </div>
        
        <KanbanBoard />
      </div>
    </TodoProvider>
  );
};

const KanbanBoard: React.FC = () => {
  const { todos, addTodo, updateTodo, deleteTodo, getTodosByStatus, moveTodoToStatus } = useTodos();
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [isEditingTodo, setIsEditingTodo] = useState<string | null>(null);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');
  const [currentStatus, setCurrentStatus] = useState<TodoStatus>(TodoStatus.TODO);
  
  const todoItems = getTodosByStatus(TodoStatus.TODO);
  const inProgressItems = getTodosByStatus(TodoStatus.IN_PROGRESS);
  const doneItems = getTodosByStatus(TodoStatus.DONE);
  
  const handleAddNewTodo = () => {
    setIsAddingTodo(true);
    setCurrentStatus(TodoStatus.TODO);
    setNewTodoTitle('');
    setNewTodoDescription('');
    setNewTodoDueDate('');
  };
  
  const handleSaveTodo = () => {
    if (!newTodoTitle.trim()) return;
    
    if (isEditingTodo) {
      updateTodo(isEditingTodo, {
        title: newTodoTitle,
        description: newTodoDescription,
        dueDate: newTodoDueDate ? new Date(newTodoDueDate).getTime() : undefined,
      });
      setIsEditingTodo(null);
    } else {
      addTodo({
        title: newTodoTitle,
        description: newTodoDescription,
        status: currentStatus,
        dueDate: newTodoDueDate ? new Date(newTodoDueDate).getTime() : undefined,
      });
      setIsAddingTodo(false);
    }
    
    setNewTodoTitle('');
    setNewTodoDescription('');
    setNewTodoDueDate('');
  };
  
  const handleCancelAdd = () => {
    setIsAddingTodo(false);
    setIsEditingTodo(null);
    setNewTodoTitle('');
    setNewTodoDescription('');
    setNewTodoDueDate('');
  };
  
  const handleEditTodo = (todo: Todo) => {
    setIsEditingTodo(todo.id);
    setCurrentStatus(todo.status);
    setNewTodoTitle(todo.title);
    setNewTodoDescription(todo.description || '');
    setNewTodoDueDate(todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '');
  };
  
  const handleDeleteTodo = (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTodo(id);
    }
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };
  
  return (
    <div className="kanban-board">
      <div className="kanban-column">
        <div className="column-header">
          <h2>To Do</h2>
          <button className="column-add-button" onClick={handleAddNewTodo}>
            <Plus size={18} />
          </button>
        </div>
        
        <div className="todo-list">
          {isAddingTodo && currentStatus === TodoStatus.TODO && (
            <div className="todo-form-card">
              <input
                type="text"
                placeholder="Task title"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                className="todo-title-input"
              />
              
              <textarea
                placeholder="Description (optional)"
                value={newTodoDescription}
                onChange={(e) => setNewTodoDescription(e.target.value)}
                className="todo-description-input"
              ></textarea>
              
              <div className="form-group">
                <label>Due Date (optional)</label>
                <input
                  type="date"
                  value={newTodoDueDate}
                  onChange={(e) => setNewTodoDueDate(e.target.value)}
                  className="todo-date-input"
                />
              </div>
              
              <div className="todo-form-actions">
                <button className="button-secondary" onClick={handleCancelAdd}>
                  Cancel
                </button>
                <button className="button-primary" onClick={handleSaveTodo}>
                  Add Task
                </button>
              </div>
            </div>
          )}
          
          {todoItems.map(todo => (
            <div key={todo.id} className="todo-card" draggable>
              {isEditingTodo === todo.id ? (
                <div className="todo-form-card">
                  <input
                    type="text"
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    className="todo-title-input"
                  />
                  
                  <textarea
                    value={newTodoDescription}
                    onChange={(e) => setNewTodoDescription(e.target.value)}
                    className="todo-description-input"
                  ></textarea>
                  
                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      value={newTodoDueDate}
                      onChange={(e) => setNewTodoDueDate(e.target.value)}
                      className="todo-date-input"
                    />
                  </div>
                  
                  <div className="todo-form-actions">
                    <button className="button-secondary" onClick={handleCancelAdd}>
                      Cancel
                    </button>
                    <button className="button-primary" onClick={handleSaveTodo}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="todo-title">{todo.title}</h3>
                  
                  {todo.description && (
                    <p className="todo-description">{todo.description}</p>
                  )}
                  
                  {todo.dueDate && (
                    <div className="todo-due-date">
                      <Calendar size={14} />
                      <span>Due: {formatDate(todo.dueDate)}</span>
                    </div>
                  )}
                  
                  <div className="todo-actions">
                    <button 
                      className="todo-action-button" 
                      onClick={() => moveTodoToStatus(todo.id, TodoStatus.IN_PROGRESS)}
                    >
                      Start
                    </button>
                    
                    <div className="todo-edit-actions">
                      <button 
                        className="todo-icon-button" 
                        onClick={() => handleEditTodo(todo)}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="todo-icon-button danger" 
                        onClick={() => handleDeleteTodo(todo.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {todoItems.length === 0 && !isAddingTodo && (
            <div className="empty-column">
              <p>No tasks yet</p>
              <button className="button-text" onClick={handleAddNewTodo}>
                + Add a task
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="kanban-column">
        <div className="column-header">
          <h2>In Progress</h2>
          <button 
            className="column-add-button" 
            onClick={() => {
              setIsAddingTodo(true);
              setCurrentStatus(TodoStatus.IN_PROGRESS);
            }}
          >
            <Plus size={18} />
          </button>
        </div>
        
        <div className="todo-list">
          {isAddingTodo && currentStatus === TodoStatus.IN_PROGRESS && (
            <div className="todo-form-card">
              <input
                type="text"
                placeholder="Task title"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                className="todo-title-input"
              />
              
              <textarea
                placeholder="Description (optional)"
                value={newTodoDescription}
                onChange={(e) => setNewTodoDescription(e.target.value)}
                className="todo-description-input"
              ></textarea>
              
              <div className="form-group">
                <label>Due Date (optional)</label>
                <input
                  type="date"
                  value={newTodoDueDate}
                  onChange={(e) => setNewTodoDueDate(e.target.value)}
                  className="todo-date-input"
                />
              </div>
              
              <div className="todo-form-actions">
                <button className="button-secondary" onClick={handleCancelAdd}>
                  Cancel
                </button>
                <button className="button-primary" onClick={handleSaveTodo}>
                  Add Task
                </button>
              </div>
            </div>
          )}
          
          {inProgressItems.map(todo => (
            <div key={todo.id} className="todo-card" draggable>
              {isEditingTodo === todo.id ? (
                <div className="todo-form-card">
                  <input
                    type="text"
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    className="todo-title-input"
                  />
                  
                  <textarea
                    value={newTodoDescription}
                    onChange={(e) => setNewTodoDescription(e.target.value)}
                    className="todo-description-input"
                  ></textarea>
                  
                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      value={newTodoDueDate}
                      onChange={(e) => setNewTodoDueDate(e.target.value)}
                      className="todo-date-input"
                    />
                  </div>
                  
                  <div className="todo-form-actions">
                    <button className="button-secondary" onClick={handleCancelAdd}>
                      Cancel
                    </button>
                    <button className="button-primary" onClick={handleSaveTodo}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="todo-title">{todo.title}</h3>
                  
                  {todo.description && (
                    <p className="todo-description">{todo.description}</p>
                  )}
                  
                  {todo.dueDate && (
                    <div className="todo-due-date">
                      <Calendar size={14} />
                      <span>Due: {formatDate(todo.dueDate)}</span>
                    </div>
                  )}
                  
                  <div className="todo-actions">
                    <div className="status-actions">
                      <button 
                        className="todo-action-button" 
                        onClick={() => moveTodoToStatus(todo.id, TodoStatus.TODO)}
                      >
                        Back
                      </button>
                      <button 
                        className="todo-action-button" 
                        onClick={() => moveTodoToStatus(todo.id, TodoStatus.DONE)}
                      >
                        Complete
                      </button>
                    </div>
                    
                    <div className="todo-edit-actions">
                      <button 
                        className="todo-icon-button" 
                        onClick={() => handleEditTodo(todo)}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="todo-icon-button danger" 
                        onClick={() => handleDeleteTodo(todo.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {inProgressItems.length === 0 && !isAddingTodo && (
            <div className="empty-column">
              <p>No tasks in progress</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="kanban-column">
        <div className="column-header">
          <h2>Done</h2>
          <button 
            className="column-add-button" 
            onClick={() => {
              setIsAddingTodo(true);
              setCurrentStatus(TodoStatus.DONE);
            }}
          >
            <Plus size={18} />
          </button>
        </div>
        
        <div className="todo-list">
          {isAddingTodo && currentStatus === TodoStatus.DONE && (
            <div className="todo-form-card">
              <input
                type="text"
                placeholder="Task title"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                className="todo-title-input"
              />
              
              <textarea
                placeholder="Description (optional)"
                value={newTodoDescription}
                onChange={(e) => setNewTodoDescription(e.target.value)}
                className="todo-description-input"
              ></textarea>
              
              <div className="form-group">
                <label>Due Date (optional)</label>
                <input
                  type="date"
                  value={newTodoDueDate}
                  onChange={(e) => setNewTodoDueDate(e.target.value)}
                  className="todo-date-input"
                />
              </div>
              
              <div className="todo-form-actions">
                <button className="button-secondary" onClick={handleCancelAdd}>
                  Cancel
                </button>
                <button className="button-primary" onClick={handleSaveTodo}>
                  Add Task
                </button>
              </div>
            </div>
          )}
          
          {doneItems.map(todo => (
            <div key={todo.id} className="todo-card" draggable>
              {isEditingTodo === todo.id ? (
                <div className="todo-form-card">
                  <input
                    type="text"
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    className="todo-title-input"
                  />
                  
                  <textarea
                    value={newTodoDescription}
                    onChange={(e) => setNewTodoDescription(e.target.value)}
                    className="todo-description-input"
                  ></textarea>
                  
                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      value={newTodoDueDate}
                      onChange={(e) => setNewTodoDueDate(e.target.value)}
                      className="todo-date-input"
                    />
                  </div>
                  
                  <div className="todo-form-actions">
                    <button className="button-secondary" onClick={handleCancelAdd}>
                      Cancel
                    </button>
                    <button className="button-primary" onClick={handleSaveTodo}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="todo-title">{todo.title}</h3>
                  
                  {todo.description && (
                    <p className="todo-description">{todo.description}</p>
                  )}
                  
                  {todo.dueDate && (
                    <div className="todo-due-date">
                      <Calendar size={14} />
                      <span>Due: {formatDate(todo.dueDate)}</span>
                    </div>
                  )}
                  
                  <div className="todo-actions">
                    <button 
                      className="todo-action-button" 
                      onClick={() => moveTodoToStatus(todo.id, TodoStatus.IN_PROGRESS)}
                    >
                      Move to In Progress
                    </button>
                    
                    <div className="todo-edit-actions">
                      <button 
                        className="todo-icon-button" 
                        onClick={() => handleEditTodo(todo)}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="todo-icon-button danger" 
                        onClick={() => handleDeleteTodo(todo.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {doneItems.length === 0 && !isAddingTodo && (
            <div className="empty-column">
              <p>No completed tasks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoBoard;