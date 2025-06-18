import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseAdd from './pages/CourseAdd';
import CourseDetail from './pages/CourseDetail';
import CourseEdit from './pages/CourseEdit';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} /> 
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:id" element={<CourseDetail />} />
            <Route path="courses/:id/edit" element={<CourseEdit />} />
            <Route path="courseadd" element={<CourseAdd />} />
            <Route path="students" element={<div className="p-6"><h1 className="text-2xl font-bold">Students</h1><p className="text-gray-600 mt-2">Students management coming soon...</p></div>} />
            <Route path="settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-600 mt-2">Settings panel coming soon...</p></div>} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;