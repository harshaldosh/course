import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, Users, DollarSign } from 'lucide-react';
import { dbService } from '../services/database';
import type { Course } from '../types/course';
import toast from 'react-hot-toast';

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadCourse(id);
    }
  }, [id]);

  const loadCourse = async (courseId: string) => {
    try {
      const courseData = await dbService.getCourseById(courseId);
      if (courseData) {
        setCourse(courseData);
        // Set first video as selected by default
        if (courseData.chapters.length > 0 && courseData.chapters[0].videos.length > 0) {
          setSelectedVideo(courseData.chapters[0].videos[0].url);
        }
      } else {
        toast.error('Course not found');
        navigate('/courses');
      }
    } catch (error) {
      console.error('Failed to load course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h2>
        <button
          onClick={() => navigate('/courses')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  const totalVideos = course.chapters.reduce((acc, chapter) => acc + chapter.videos.length, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/courses')}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-600 mt-2">Course Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              {selectedVideo ? (
                <iframe
                  src={selectedVideo}
                  className="w-full h-full"
                  allowFullScreen
                  title="Course Video"
                />
              ) : (
                <div className="text-center text-white">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a video to start watching</p>
                </div>
              )}
            </div>
          </div>

          {/* Course Description */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Course</h2>
            <p className="text-gray-700 leading-relaxed">{course.description}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Course Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Overview</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <DollarSign className="w-5 h-5 mr-2" />
                  <span>Price</span>
                </div>
                <span className="font-semibold text-primary-600">${course.fees}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>Chapters</span>
                </div>
                <span className="font-semibold">{course.chapters.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Users className="w-5 h-5 mr-2" />
                  <span>Videos</span>
                </div>
                <span className="font-semibold">{totalVideos}</span>
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Course Content</h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {course.chapters.map((chapter, chapterIndex) => (
                <div key={chapter.id} className="border-b border-gray-200 last:border-b-0">
                  <div className="p-4 bg-gray-50">
                    <h4 className="font-medium text-gray-900">
                      Chapter {chapterIndex + 1}: {chapter.title}
                    </h4>
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                    {chapter.videos.map((video, videoIndex) => (
                      <button
                        key={video.id}
                        onClick={() => setSelectedVideo(video.url)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          selectedVideo === video.url ? 'bg-primary-50 border-r-2 border-primary-600' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Play className="w-4 h-4 text-gray-400 mr-3" />
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {videoIndex + 1}. {video.title}
                              </p>
                              {video.duration && (
                                <p className="text-xs text-gray-500 mt-1">{video.duration}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;