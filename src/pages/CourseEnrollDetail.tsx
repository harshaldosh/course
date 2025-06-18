import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, DollarSign, Download, Check, ExternalLink, Bot, X, FileText, BookOpen } from 'lucide-react';
import { dbService } from '../services/database';
import { enrollmentService } from '../services/enrollment';
import type { Course } from '../types/course';
import toast from 'react-hot-toast';
import '../styles/course-management.css';

const CourseEnrollDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
  const [completedDocuments, setCompletedDocuments] = useState<Set<string>>(new Set());
  const [selectedContent, setSelectedContent] = useState<{ 
    type: 'video' | 'document'; 
    url?: string; 
    title: string; 
    description: string;
    replicaId?: string;
    conversationalContext?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'video' | 'document' | 'agent'>('content');
  const [creatingConversation, setCreatingConversation] = useState<string | null>(null);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);

  useEffect(() => {
    if (id) {
      loadCourse(id);
      loadProgress(id);
    }
  }, [id]);

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
      
      // Load document progress from localStorage for now
      const savedDocuments = localStorage.getItem(`course-progress-documents-${courseId}`);
      if (savedDocuments) {
        setCompletedDocuments(new Set(JSON.parse(savedDocuments)));
      }
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
      setCompletedVideos(completedVideos);
    }
  };

  const toggleDocumentCompletion = (documentId: string) => {
    if (!id) return;

    const newCompleted = new Set(completedDocuments);
    if (newCompleted.has(documentId)) {
      newCompleted.delete(documentId);
    } else {
      newCompleted.add(documentId);
    }
    
    setCompletedDocuments(newCompleted);
    localStorage.setItem(`course-progress-documents-${id}`, JSON.stringify([...newCompleted]));
    
    toast.success(newCompleted.has(documentId) ? 'Document marked as complete!' : 'Document marked as incomplete.');
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

  const openDocumentTab = (documentUrl: string, documentTitle: string, documentDescription: string) => {
    setSelectedContent({ 
      type: 'document', 
      url: documentUrl, 
      title: documentTitle, 
      description: documentDescription 
    });
    setActiveTab('document');
    toast(`Now viewing: ${documentTitle}`);
  };

  const createTavusConversation = async (agentId: string, replicaId: string, conversationalContext: string) => {
    setCreatingConversation(agentId);
    
    try {
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

  const refreshCourse = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
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

  const isChapterComplete = (chapter: any) => {
    const chapterVideos = chapter.videos || [];
    const chapterDocuments = (chapter.documents || []).filter((doc: any) => !doc.isSpecial);
    
    const videosComplete = chapterVideos.every((video: any) => completedVideos.has(video.id));
    const documentsComplete = chapterDocuments.every((doc: any) => completedDocuments.has(doc.id));
    
    return videosComplete && documentsComplete;
  };

  const getSpecialDocuments = () => {
    if (!course) return [];
    
    const specialDocs: any[] = [];
    course.chapters.forEach((chapter, chapterIndex) => {
      const chapterSpecialDocs = (chapter.documents || [])
        .filter(doc => doc.isSpecial)
        .map(doc => ({
          ...doc,
          chapterTitle: chapter.title,
          chapterIndex: chapterIndex + 1,
          isUnlocked: isChapterComplete(chapter)
        }));
      specialDocs.push(...chapterSpecialDocs);
    });
    
    return specialDocs;
  };

  const getAllDocuments = () => {
    if (!course) return [];
    
    const allDocs: any[] = [];
    course.chapters.forEach((chapter, chapterIndex) => {
      const chapterDocs = (chapter.documents || []).map(doc => ({
        ...doc,
        chapterTitle: chapter.title,
        chapterIndex: chapterIndex + 1,
        isCompleted: completedDocuments.has(doc.id)
      }));
      allDocs.push(...chapterDocs);
    });
    
    return allDocs;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="ml-4 text-gray-700 text-responsive-sm">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-responsive-lg font-bold text-gray-900 mb-4">Course not found</h2>
        <button
          onClick={() => navigate('/courses')}
          className="btn-responsive bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  const totalVideos = course.chapters.reduce((acc, chapter) => acc + chapter.videos.length, 0);
  const totalAgents = course.chapters.reduce((acc, chapter) => acc + (chapter.agents || []).length, 0);
  const totalDocuments = course.chapters.reduce((acc, chapter) => acc + (chapter.documents || []).length, 0);
  const completedVideoCount = completedVideos.size;
  const completedDocumentCount = completedDocuments.size;
  const progressPercentage = totalVideos > 0 ? (completedVideoCount / totalVideos) * 100 : 0;

  const specialDocuments = getSpecialDocuments();
  const allDocuments = getAllDocuments();

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
            <h1 className="text-responsive-lg font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600 mt-2 text-responsive-sm">Enrolled Course</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
            className="btn-responsive bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Knowledge Base
          </button>
          <button
            onClick={refreshCourse}
            disabled={loading}
            className="btn-responsive bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? 'Refreshing...' : 'Refresh Content'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      {activeTab !== 'content' && (
        <div className="bg-white rounded-lg shadow-md card-responsive">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={backToContent}
                className="flex items-center btn-responsive text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course Content
              </button>
              <div className="text-responsive-base font-semibold text-gray-900">
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

      {/* Knowledge Base Modal */}
      {showKnowledgeBase && (
        <div className="bg-white rounded-lg shadow-md card-responsive space-responsive">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-responsive-lg font-semibold text-gray-900">Knowledge Base - All Documents</h2>
            <button
              onClick={() => setShowKnowledgeBase(false)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>
          
          {allDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-responsive-sm">No documents available in this course.</p>
            </div>
          ) : (
            <div className="knowledge-base-grid">
              {allDocuments.map((doc) => (
                <div key={doc.id} className="document-card-kb">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-gray-900 text-responsive-sm">{doc.title}</h3>
                        <p className="text-xs text-gray-500">Chapter {doc.chapterIndex}: {doc.chapterTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.isSpecial && (
                        <span className="status-badge status-special">Special</span>
                      )}
                      {doc.isCompleted && (
                        <span className="status-badge status-completed">Completed</span>
                      )}
                    </div>
                  </div>
                  
                  {doc.description && (
                    <p className="text-responsive-sm text-gray-600 mb-3">{doc.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => openDocumentTab(doc.url, doc.title, doc.description || '')}
                      className="text-blue-600 hover:text-blue-700 text-responsive-sm font-medium flex items-center"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Document
                    </button>
                    
                    {!doc.isSpecial && (
                      <button
                        onClick={() => toggleDocumentCompletion(doc.id)}
                        className={`status-badge ${doc.isCompleted ? 'status-completed' : 'status-pending'}`}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {doc.isCompleted ? 'Completed' : 'Mark Done'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="course-grid">
        {/* Main Content */}
        <div className="space-y-6">
          {activeTab === 'content' && (
            <>
              {/* Course Description */}
              <div className="bg-white rounded-lg shadow-md card-responsive">
                <h2 className="text-responsive-base font-semibold text-gray-900 mb-4">About This Course</h2>
                <p className="text-gray-700 leading-relaxed text-responsive-sm">{course.description}</p>
              </div>

              {/* Special Downloads */}
              {specialDocuments.length > 0 && (
                <div className="special-downloads">
                  <h2 className="text-responsive-base font-semibold mb-2">Special Downloads</h2>
                  <p className="text-responsive-sm opacity-90 mb-4">
                    These documents become available when you complete their respective chapters.
                  </p>
                  
                  <div className="downloads-grid">
                    {specialDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className={`download-item ${!doc.isUnlocked ? 'disabled' : ''}`}
                      >
                        <FileText className="w-8 h-8 mx-auto mb-2" />
                        <h3 className="font-medium text-responsive-sm mb-1">{doc.title}</h3>
                        <p className="text-xs opacity-75 mb-2">Chapter {doc.chapterIndex}: {doc.chapterTitle}</p>
                        
                        {doc.isUnlocked ? (
                          <button
                            onClick={() => openDocumentTab(doc.url, doc.title, doc.description || '')}
                            className="inline-flex items-center text-responsive-sm font-medium hover:underline"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </button>
                        ) : (
                          <span className="text-xs opacity-75">Complete chapter to unlock</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Course Content Table */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="card-responsive border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-responsive-base font-semibold text-gray-900">Course Content</h2>
                    <div className="text-responsive-sm text-gray-600">
                      {completedVideoCount} of {totalVideos} videos, {completedDocumentCount} of {totalDocuments} documents completed
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
                
                <div className="content-table-container">
                  <table className="content-table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Content
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider mobile-hidden">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider mobile-hidden">
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
                              <div className="font-medium text-gray-900 text-responsive-sm">
                                Chapter {chapterIndex + 1}: {chapter.title}
                              </div>
                              {chapter.description && (
                                <div className="text-xs text-gray-600 mt-1">
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
                                  <div className="min-w-0 content-title">
                                    <div className="font-medium text-gray-900 text-responsive-sm">
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
                              <td className="px-6 py-4 mobile-hidden">
                                <span className="status-badge" style={{backgroundColor: '#dbeafe', color: '#1e40af'}}>
                                  Video
                                </span>
                              </td>
                              <td className="px-6 py-4 text-responsive-sm text-gray-500 mobile-hidden">
                                {video.duration || 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => toggleVideoCompletion(video.id)}
                                  className={`status-badge ${
                                    completedVideos.has(video.id) ? 'status-completed' : 'status-pending'
                                  }`}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  {completedVideos.has(video.id) ? 'Completed' : 'Mark Done'}
                                </button>
                              </td>
                              <td className="px-6 py-4">
                                {video.url && (
                                  <button
                                    onClick={() => openVideoTab(video.url, video.title, video.description || '')}
                                    className="btn-responsive bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs flex items-center"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Watch
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}

                          {/* Documents */}
                          {(chapter.documents || []).map((document, docIndex) => (
                            <tr key={document.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-start">
                                  <FileText className={`w-4 h-4 mr-3 mt-0.5 flex-shrink-0 ${document.isSpecial ? 'text-green-500' : 'text-yellow-500'}`} />
                                  <div className="min-w-0 content-title">
                                    <div className="font-medium text-gray-900 text-responsive-sm">
                                      {chapterIndex + 1}.{docIndex + 1} {document.title}
                                      {document.isSpecial && <span className="ml-2 text-xs text-green-600 font-medium">(Special)</span>}
                                    </div>
                                    {document.description && (
                                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        {document.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 mobile-hidden">
                                <span className={`status-badge ${document.isSpecial ? 'status-special' : ''}`} 
                                      style={{backgroundColor: document.isSpecial ? '#ddd6fe' : '#fef3c7', 
                                             color: document.isSpecial ? '#5b21b6' : '#92400e'}}>
                                  {document.isSpecial ? 'Special Doc' : 'Document'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-responsive-sm text-gray-500 mobile-hidden">
                                PDF/Doc
                              </td>
                              <td className="px-6 py-4">
                                {document.isSpecial ? (
                                  <span className={`status-badge ${isChapterComplete(chapter) ? 'status-completed' : 'status-pending'}`}>
                                    {isChapterComplete(chapter) ? 'Unlocked' : 'Locked'}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => toggleDocumentCompletion(document.id)}
                                    className={`status-badge ${
                                      completedDocuments.has(document.id) ? 'status-completed' : 'status-pending'
                                    }`}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    {completedDocuments.has(document.id) ? 'Completed' : 'Mark Done'}
                                  </button>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {document.url && (
                                  <button
                                    onClick={() => openDocumentTab(document.url, document.title, document.description || '')}
                                    className="btn-responsive bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-xs flex items-center"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    View
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
                                  <div className="min-w-0 content-title">
                                    <div className="font-medium text-gray-900 text-responsive-sm">
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
                              <td className="px-6 py-4 mobile-hidden">
                                <span className="status-badge" style={{backgroundColor: '#f3e8ff', color: '#7c3aed'}}>
                                  Agent
                                </span>
                              </td>
                              <td className="px-6 py-4 text-responsive-sm text-gray-500 mobile-hidden">
                                Interactive
                              </td>
                              <td className="px-6 py-4">
                                <span className="status-badge" style={{backgroundColor: '#f3f4f6', color: '#374151'}}>
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
                                  className="btn-responsive bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
            <div className="bg-white rounded-lg shadow-md card-responsive">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                <iframe
                  src={selectedContent.url}
                  className="w-full h-full"
                  allowFullScreen
                  title={selectedContent.title}
                />
              </div>
              
              {selectedContent.description && (
                <div className="text-gray-700 text-responsive-sm">
                  <h4 className="font-medium mb-2">Description:</h4>
                  <p>{selectedContent.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Document Tab */}
          {activeTab === 'document' && selectedContent?.type === 'document' && (
            <div className="bg-white rounded-lg shadow-md card-responsive">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                <iframe
                  src={selectedContent.url}
                  className="w-full h-full"
                  title={selectedContent.title}
                />
              </div>
              
              {selectedContent.description && (
                <div className="text-gray-700 text-responsive-sm">
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
          <div className="bg-white rounded-lg shadow-md card-responsive">
            <h3 className="text-responsive-base font-semibold text-gray-900 mb-4">Course Overview</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <DollarSign className="w-5 h-5 mr-2" />
                  <span className="text-responsive-sm">Price</span>
                </div>
                <span className="font-semibold text-primary-600 text-responsive-sm">${course.fees}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="text-responsive-sm">Chapters</span>
                </div>
                <span className="font-semibold text-responsive-sm">{course.chapters.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Play className="w-5 h-5 mr-2" />
                  <span className="text-responsive-sm">Videos</span>
                </div>
                <span className="font-semibold text-responsive-sm">{totalVideos}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <FileText className="w-5 h-5 mr-2" />
                  <span className="text-responsive-sm">Documents</span>
                </div>
                <span className="font-semibold text-responsive-sm">{totalDocuments}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Bot className="w-5 h-5 mr-2" />
                  <span className="text-responsive-sm">AI Assistants</span>
                </div>
                <span className="font-semibold text-responsive-sm">{totalAgents}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Check className="w-5 h-5 mr-2" />
                  <span className="text-responsive-sm">Progress</span>
                </div>
                <span className="font-semibold text-green-600 text-responsive-sm">{Math.round(progressPercentage)}%</span>
              </div>
            </div>

            {course.courseMaterialUrl && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <a
                  href={course.courseMaterialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full btn-responsive bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Course Materials
                </a>
              </div>
            )}
          </div>

          {/* Current Activity */}
          {activeTab !== 'content' && selectedContent && (
            <div className="bg-white rounded-lg shadow-md card-responsive">
              <h3 className="text-responsive-base font-semibold text-gray-900 mb-4">Current Activity</h3>
              <div className="flex items-center space-x-3">
                {selectedContent.type === 'video' ? (
                  <Play className="w-8 h-8 text-blue-600" />
                ) : selectedContent.type === 'document' ? (
                  <FileText className="w-8 h-8 text-yellow-600" />
                ) : (
                  <Bot className="w-8 h-8 text-purple-600" />
                )}
                <div>
                  <div className="font-medium text-gray-900 text-responsive-sm">{selectedContent.title}</div>
                  <div className="text-xs text-gray-600 capitalize">{selectedContent.type}</div>
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