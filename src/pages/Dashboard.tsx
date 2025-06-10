import React from 'react';
import { useTodos } from '../context/TodoContext';
import { TodoStatus } from '../types';
import { BarChart3, CheckSquare, Clock, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { todos } = useTodos();
  
  const todoCount = todos.filter(todo => todo.status === TodoStatus.TODO).length;
  const inProgressCount = todos.filter(todo => todo.status === TodoStatus.IN_PROGRESS).length;
  const completedCount = todos.filter(todo => todo.status === TodoStatus.DONE).length;
  const totalTodos = todos.length;
  
  // Get recent todos
  const recentTodos = [...todos]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);
  
  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <h1 className="page-heading">Welcome to TaskFlow</h1>
        <p className="subtitle">Manage your tasks and boost your productivity</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
            <CheckSquare size={24} color="#8B5CF6" />
          </div>
          <div className="stat-content">
            <h2 className="stat-value">{totalTodos}</h2>
            <p className="stat-label">Total Tasks</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)' }}>
            <Award size={24} color="#14B8A6" />
          </div>
          <div className="stat-content">
            <h2 className="stat-value">{completedCount}</h2>
            <p className="stat-label">Completed</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)' }}>
            <Clock size={24} color="#EC4899" />
          </div>
          <div className="stat-content">
            <h2 className="stat-value">{inProgressCount}</h2>
            <p className="stat-label">In Progress</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>
            <BarChart3 size={24} color="#EAB308" />
          </div>
          <div className="stat-content">
            <h2 className="stat-value">{todoCount}</h2>
            <p className="stat-label">To Do</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="recent-works">
          <div className="section-header">
            <h2 className="section-title">Recent Tasks</h2>
            <Link to="/todo" className="view-all">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="recent-grid">
            {recentTodos.length > 0 ? (
              recentTodos.map(todo => (
                <div key={todo.id} className="recent-item">
                  <div className="recent-item-content">
                    <h3 className="recent-item-title">{todo.title}</h3>
                    <div className="recent-item-meta">
                      <span className={`status-badge status-${todo.status.replace('_', '-')}`}>
                        {todo.status.replace('_', ' ')}
                      </span>
                      <span className="recent-item-date">
                        {new Date(todo.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No tasks yet. Start organizing your work!</p>
                <Link to="/todo" className="button-primary">
                  Create Task
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className="category-breakdown">
          <div className="section-header">
            <h2 className="section-title">Task Status</h2>
          </div>
          
          <div className="category-list">
            <div className="category-item">
              <div className="category-name">To Do</div>
              <div className="category-bar-container">
                <div 
                  className="category-bar" 
                  style={{ 
                    width: `${totalTodos > 0 ? (todoCount / totalTodos) * 100 : 0}%`,
                    backgroundColor: '#8B5CF6'
                  }}
                ></div>
              </div>
              <div className="category-count">{todoCount}</div>
            </div>
            
            <div className="category-item">
              <div className="category-name">In Progress</div>
              <div className="category-bar-container">
                <div 
                  className="category-bar" 
                  style={{ 
                    width: `${totalTodos > 0 ? (inProgressCount / totalTodos) * 100 : 0}%`,
                    backgroundColor: '#EC4899'
                  }}
                ></div>
              </div>
              <div className="category-count">{inProgressCount}</div>
            </div>
            
            <div className="category-item">
              <div className="category-name">Completed</div>
              <div className="category-bar-container">
                <div 
                  className="category-bar" 
                  style={{ 
                    width: `${totalTodos > 0 ? (completedCount / totalTodos) * 100 : 0}%`,
                    backgroundColor: '#14B8A6'
                  }}
                ></div>
              </div>
              <div className="category-count">{completedCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;