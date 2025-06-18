import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, DollarSign, Download, Check, ExternalLink, Bot, X } from 'lucide-react';
import { dbService } from '../services/database';
import { enrollmentService } from '../services/enrollment';
import { useAuth } from '../contexts/AuthContext';
import type { Course } from '../types/course';
import toast from 'react-hot-toast';

const CourseEnrollDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  //const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
  const [selectedContent, setSelectedContent] = useState<{ 
    type: 'video' | 'agent'; 
    url?: string; 
    title: string; 
    description: string;
    replicaId?: string;
    conversationalContext?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'video' | 'agent'>('content');
  const [creatingConversation, setCreatingConversation] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadCourse(id);
      loadProgress(id);
    }
  }, [id]);

  // Force reload course data when component mounts or id changes
  useEffect(() => {
    // Clear any cached data for this course
    const clearCourseCache = () => {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(`course-${id}`) || key.includes('course-progress')) {
          localStorage.removeItem(key);
        }
      });
    };

    clearCourseCache();
  }, [id]);

  const loadCourse = async (courseId: string) => {
    try {
      // Add timestamp to force fresh data
      const timestamp = Date.now();
      console.log(`Loading course ${courseId} at ${timestamp}`);
      
      const courseData = await dbService.getCourseById(courseId);
      if (courseData) {
        setCourse(courseData);
        console.log('Course loaded successfully:', courseData);
      } else {
        toast.error('Course not found. Redirecting to courses list.');
        navigate('/courses');
      }
    } catch (error) {
      console.error('Failed to load course:', error);
      toast.error(`Failed to load course: ${(error as Error).message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async (courseId: string) => {
    try {
      const progress = await enrollmentService.getProgress(courseId);
      const completedVideoIds = Object.keys(progress).filter(videoId => progress[videoId]);
      setCompletedVideos(new Set(completedVideoIds));
    } catch (error) {
      console.error('Failed to load progress:', error);
      toast.error(`Failed to load course progress: ${(error as Error).message || 'Unknown error'}`);
    }
  };

  const toggleVideoCompletion = async (videoId: string) => {
    if (!id) {
      toast.error('Course ID is missing for progress update.');
      return;
    }

    const isCompleted = completedVideos.has(videoId);
    const newCompleted = new Set(completedVideos);
    
    if (isCompleted) {
      newCompleted.delete(videoId);
    } else {
      newCompleted.add(videoId);
    }
    
    setCompletedVideos(newCompleted);

    try {
      await enrollmentService.updateProgress(id, videoId, !isCompleted);
      toast.success(isCompleted ? 'Video marked as incomplete.' : 'Video marked as complete!');
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error(`Failed to update progress: ${(error as Error).message || 'Please try again.'}`);
      // Revert the change
      setCompletedVideos(completedVideos);
    }
  };

  const openVideoTab = (videoUrl: string, videoTitle: string, videoDescription: string) => {
    setSelectedContent({ 
      type: 'video', 
      url: videoUrl, 
      title: videoTitle, 
      description: videoDescription 
    });
    setActiveTab('video');
    toast(`Now watching: ${videoTitle}`);
  };

  const createTavusConversation = async (agentId: string, replicaId: string, conversationalContext: string) => {
    setCreatingConversation(agentId);
    
    try {
      // Validate required parameters before making API call
      if (!replicaId || replicaId.trim() === '') {
        toast.error('AI assistant configuration incomplete: Replica ID missing. Please contact support.');
        setCreatingConversation(null);
        return;
      }

      if (!conversationalContext || conversationalContext.trim() === '') {
        toast.error('AI assistant configuration incomplete: Conversational context missing. Please contact support.');
        setCreatingConversation(null);
        return;
      }
      
      const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
      if (!tavusApiKey || tavusApiKey.trim() === '' || tavusApiKey === 'your-tavus-api-key') {
        toast.error('Tavus API key is not configured. Please check your environment variables or contact support.');
        setCreatingConversation(null);
        return;
      }
      
      toast.loading('Starting AI conversation...');

      // Create conversation using Tavus.io API
      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': tavusApiKey
        },
        body: JSON.stringify({
          replica_id: replicaId,
          conversational_context: conversationalContext,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Tavus API error response:', errorData);
        throw new Error(`Tavus API call failed with status ${response.status}: ${errorData.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (data.conversation_url) {
        toast.dismiss();
        window.open(data.conversation_url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        toast.success('Conversation started successfully! Please check the new pop-up window.');
      } else {
        toast.dismiss();
        throw new Error('No conversation URL received from Tavus API.');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Failed to create Tavus conversation:', error);
      toast.error(`Failed to start conversation: ${(error as Error).message || 'Please check console for details.'}`);
    } finally {
      setCreatingConversation(null);
    }
  };

  const handleAgentChat = (agentId: string, replicaId: string, conversationalContext: string) => {
    createTavusConversation(agentId, replicaId, conversationalContext);
  };

  const backToContent = () => {
    setActiveTab('content');
    setSelectedContent(null);
    toast('Back to course content.');
  };

  // Add refresh function to manually reload course data
  const refreshCourse = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Clear cache and reload
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(`course-${id}`)) {
          localStorage.removeItem(key);
        }
      });
      
      await loadCourse(id);
      await loadProgress(id);
      toast.success('Course content refreshed!');
    } catch (error) {
      console.error('Failed to refresh course:', error);
      toast.error('Failed to refresh course content');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="ml-4 text-gray-700">Loading course details...</p>
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
  const totalAgents = course.chapters.reduce((acc, chapter) => acc + (chapter.agents || []).length, 0);
  const completedCount = completedVideos.size;
  const progressPercentage = totalVideos > 0 ? (completedCount / totalVideos) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/courses')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600 mt-2">Enrolled Course</p>
          </div>
        </div>
        
        {/* Add refresh button */}
        <button
          onClick={refreshCourse}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Content'}
        </button>
      </div>

      {/* Tab Navigation */}
      {activeTab !== 'content' && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={backToContent}
                className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course Content
              </button>
              <div className="text-lg font-semibold text-gray-900">
                {selectedContent?.title}
              </div>
            </div>
            <button
              onClick={backToContent}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'content' && (
            <>
              {/* Course Description */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Course</h2>
                <p className="text-gray-700 leading-relaxed">{course.description}</p>
              </div>

              {/* Course Content Table */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Course Content</h2>
                    <div className="text-sm text-gray-600">
                      {completedCount} of {totalVideos} videos completed ({Math.round(progressPercentage)}%)
                    </div>
                  </div>
                  {totalVideos > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Content
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {course.chapters.map((chapter, chapterIndex) => (
                        <React.Fragment key={chapter.id}>
                          {/* Chapter Header */}
                          <tr className="bg-gray-50">
                            <td colSpan={5} className="px-6 py-4">
                              <div className="font-medium text-gray-900">
                                Chapter {chapterIndex + 1}: {chapter.title}
                              </div>
                              {chapter.description && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {chapter.description}
                                </div>
                              )}
                            </td>
                          </tr>
                          
                          {/* Videos */}
                          {chapter.videos.map((video, videoIndex) => (
                            <tr key={video.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-start">
                                  <Play className="w-4 h-4 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="font-medium text-gray-900 text-sm">
                                      {chapterIndex + 1}.{videoIndex + 1} {video.title}
                                    </div>
                                    {video.description && (
                                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        {video.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Video
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {video.duration || 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => toggleVideoCompletion(video.id)}
                                  className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                    completedVideos.has(video.id)
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                  }`}
                                >
                                  <Check className={`w-3 h-3 mr-1 ${
                                    completedVideos.has(video.id) ? 'text-green-600' : 'text-gray-400'
                                  }`} />
                                  {completedVideos.has(video.id) ? 'Completed' : 'Mark Done'}
                                </button>
                              </td>
                              <td className="px-6 py-4">
                                {video.url && (
                                  <button
                                    onClick={() => openVideoTab(video.url, video.title, video.description || '')}
                                    className="flex items-center px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Watch
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}

                          {/* Agents */}
                          {(chapter.agents || []).map((agent, agentIndex) => (
                            <tr key={agent.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-start">
                                  <Bot className="w-4 h-4 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="font-medium text-gray-900 text-sm">
                                      {chapterIndex + 1}.{agentIndex + 1} {agent.title}
                                    </div>
                                    {agent.description && (
                                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        {agent.description}
                                      </div>
                                    )}
                                    <div className="text-xs text-purple-600 mt-1">
                                      AI Assistant
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Agent
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                Interactive
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Available
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => handleAgentChat(
                                    agent.id,
                                    agent.replicaId, 
                                    agent.conversationalContext
                                  )}
                                  disabled={creatingConversation === agent.id}
                                  className="flex items-center px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Bot className="w-3 h-3 mr-1" />
                                  {creatingConversation === agent.id ? 'Starting...' : 'Chat'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Video Tab */}
          {activeTab === 'video' && selectedContent?.type === 'video' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                <iframe
                  src={selectedContent.url}
                  className="w-full h-full"
                  allowFullScreen
                  title={selectedContent.title}
                />
              </div>
              
              {selectedContent.description && (
                <div className="text-gray-700">
                  <h4 className="font-medium mb-2">Description:</h4>
                  <p>{selectedContent.description}</p>
                </div>
              )}
            </div>
          )}
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
                  <Play className="w-5 h-5 mr-2" />
                  <span>Videos</span>
                </div>
                <span className="font-semibold">{totalVideos}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Bot className="w-5 h-5 mr-2" />
                  <span>AI Assistants</span>
                </div>
                <span className="font-semibold">{totalAgents}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Check className="w-5 h-5 mr-2" />
                  <span>Progress</span>
                </div>
                <span className="font-semibold text-green-600">{Math.round(progressPercentage)}%</span>
              </div>
            </div>

            {course.courseMaterialUrl && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <a
                  href={course.courseMaterialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Course Materials
                </a>
              </div>
            )}
          </div>

          {/* Current Activity */}
          {activeTab !== 'content' && selectedContent && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Activity</h3>
              <div className="flex items-center space-x-3">
                {selectedContent.type === 'video' ? (
                  <Play className="w-8 h-8 text-blue-600" />
                ) : (
                  <Bot className="w-8 h-8 text-purple-600" />
                )}
                <div>
                  <div className="font-medium text-gray-900">{selectedContent.title}</div>
                  <div className="text-sm text-gray-600 capitalize">{selectedContent.type}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseEnrollDetail;