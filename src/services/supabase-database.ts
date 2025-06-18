import { supabase } from '../lib/supabase';
import type { Course, Chapter, Video } from '../types/course';

class SupabaseDatabaseService {
  async getAllCourses(): Promise<Course[]> {
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        *,
        chapters (
          *,
          videos (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Failed to fetch courses');
    }

    return courses.map(this.transformCourseData);
  }

  async getCourseById(id: string): Promise<Course | null> {
    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        chapters (
          *,
          videos (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Course not found
      }
      console.error('Error fetching course:', error);
      throw new Error('Failed to fetch course');
    }

    return this.transformCourseData(course);
  }

  async addCourse(courseData: Omit<Course, 'id' | 'createdAt'>): Promise<string> {
    // Start a transaction by inserting course first
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: courseData.title,
        image: courseData.image,
        description: courseData.description,
        fees: courseData.fees,
        course_material_url: courseData.courseMaterialUrl || null
      })
      .select()
      .single();

    if (courseError) {
      console.error('Error creating course:', courseError);
      throw new Error('Failed to create course');
    }

    // Insert chapters and videos
    for (let chapterIndex = 0; chapterIndex < courseData.chapters.length; chapterIndex++) {
      const chapterData = courseData.chapters[chapterIndex];
      
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          course_id: course.id,
          title: chapterData.title,
          description: chapterData.description || null,
          order_index: chapterIndex
        })
        .select()
        .single();

      if (chapterError) {
        console.error('Error creating chapter:', chapterError);
        throw new Error('Failed to create chapter');
      }

      // Insert videos for this chapter
      if (chapterData.videos.length > 0) {
        const videosToInsert = chapterData.videos.map((video, videoIndex) => ({
          chapter_id: chapter.id,
          title: video.title,
          url: video.url,
          duration: video.duration || '',
          description: video.description || null,
          order_index: videoIndex
        }));

        const { error: videosError } = await supabase
          .from('videos')
          .insert(videosToInsert);

        if (videosError) {
          console.error('Error creating videos:', videosError);
          throw new Error('Failed to create videos');
        }
      }
    }

    return course.id;
  }

  async updateCourse(id: string, courseData: Partial<Omit<Course, 'id' | 'createdAt'>>): Promise<void> {
    const { error } = await supabase
      .from('courses')
      .update({
        title: courseData.title,
        image: courseData.image,
        description: courseData.description,
        fees: courseData.fees,
        course_material_url: courseData.courseMaterialUrl || null
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating course:', error);
      throw new Error('Failed to update course');
    }
  }

  async deleteCourse(id: string): Promise<void> {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting course:', error);
      throw new Error('Failed to delete course');
    }
  }

  private transformCourseData(courseData: any): Course {
    // Sort chapters by order_index
    const sortedChapters = (courseData.chapters || [])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((chapter: any) => ({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description || '',
        videos: (chapter.videos || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((video: any) => ({
            id: video.id,
            title: video.title,
            url: video.url,
            duration: video.duration || '',
            description: video.description || ''
          }))
      }));

    return {
      id: courseData.id,
      title: courseData.title,
      image: courseData.image,
      description: courseData.description,
      fees: courseData.fees,
      courseMaterialUrl: courseData.course_material_url || '',
      chapters: sortedChapters,
      createdAt: courseData.created_at
    };
  }
}

export const supabaseDatabaseService = new SupabaseDatabaseService();