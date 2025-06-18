import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import HomeRedirect from './components/HomeRedirect';
import AuthRedirect from './components/AuthRedirect';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseAdd from './pages/CourseAdd';
import CourseDetail from './pages/CourseDetail';
import CourseEdit from './pages/CourseEdit';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes with Layout */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:id" element={<CourseDetail />} />
              <Route path="courses/:id/edit" element={<CourseEdit />} />
              <Route path="courseadd" element={<CourseAdd />} />
              <Route path="students" element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Students</h1>
                  <p className="text-gray-600 mt-2">Students management coming soon...</p>
                </div>
              } />
              <Route path="settings" element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Settings</h1>
                  <p className="text-gray-600 mt-2">Settings panel coming soon...</p>
                </div>
              } />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<AuthRedirect />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;