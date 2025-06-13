import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { dbService } from '../services/database';
import type { Chapter, Video } from '../types/course';
import toast from 'react-hot-toast';

const CourseAdd: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    description: '',
    fees: 0
  });
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'fees' ? parseFloat(value) || 0 : value
    }));
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      title: '',
      videos: []
    };
    setChapters(prev => [...prev, newChapter]);
  };

  const updateChapter = (chapterId: string, title: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId ? { ...chapter, title } : chapter
    ));
  };

  const removeChapter = (chapterId: string) => {
    setChapters(prev => prev.filter(chapter => chapter.id !== chapterId));
  };

  const addVideo = (chapterId: string) => {
    const newVideo: Video = {
      id: crypto.randomUUID(),
      title: '',
      url: '',
      duration: ''
    };
    
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, videos: [...chapter.videos, newVideo] }
        : chapter
    ));
  };

  const updateVideo = (chapterId: string, videoId: string, field: keyof Video, value: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? {
            ...chapter,
            videos: chapter.videos.map(video => 
              video.id === videoId ? { ...video, [field]: value } : video
            )
          }
        : chapter
    ));
  };

  const removeVideo = (chapterId: string, videoId: string) => {
    setChapters(prev => prev.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, videos: chapter.videos.filter(video => video.id !== videoId) }
        : chapter
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.image) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      await dbService.addCourse({
        ...formData,
        chapters
      });
      
      toast.success('Course created successfully!');
      navigate('/courses');
    } catch (error) {
      console.error('Failed to create course:', error);
      toast.error('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/courses')}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Course</h1>
          <p className="text-gray-600 mt-2">Create a new course with chapters and videos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Course Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Fees ($) *
              </label>
              <input
                type="number"
                name="fees"
                value={formData.fees}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Image URL *
            </label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Chapters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Chapters & Videos</h2>
            <button
              type="button"
              onClick={addChapter}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Chapter
            </button>
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No chapters added yet. Click "Add Chapter" to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {chapters.map((chapter, chapterIndex) => (
                <div key={chapter.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1 mr-4">
                      <input
                        type="text"
                        placeholder={`Chapter ${chapterIndex + 1} Title`}
                        value={chapter.title}
                        onChange={(e) => updateChapter(chapter.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => addVideo(chapter.id)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeChapter(chapter.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Videos */}
                  <div className="space-y-3 ml-4">
                    {chapter.videos.map((video, videoIndex) => (
                      <div key={video.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500 w-8">{videoIndex + 1}.</span>
                        <input
                          type="text"
                          placeholder="Video Title"
                          value={video.title}
                          onChange={(e) => updateVideo(chapter.id, video.id, 'title', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="url"
                          placeholder="Video URL"
                          value={video.url}
                          onChange={(e) => updateVideo(chapter.id, video.id, 'url', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Duration (e.g., 10:30)"
                          value={video.duration || ''}
                          onChange={(e) => updateVideo(chapter.id, video.id, 'duration', e.target.value)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeVideo(chapter.id, video.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {chapter.videos.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No videos added to this chapter yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/courses')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseAdd;