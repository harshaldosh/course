import React from 'react';
import type { Course } from '../types/course';
import { Clock, Users, DollarSign } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onClick: (course: Course) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
  const totalVideos = course.chapters.reduce((acc, chapter) => acc + chapter.videos.length, 0);

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
      onClick={() => onClick(course)}
    >
      <div className="aspect-video bg-gray-200 overflow-hidden">
        <img 
          src={course.image} 
          alt={course.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-3">
          {course.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{course.chapters.length} chapters</span>
          </div>
          
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{totalVideos} videos</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-primary-600 font-semibold">
            <DollarSign className="w-5 h-5 mr-1" />
            <span>${course.fees}</span>
          </div>
          
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            View Course
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;