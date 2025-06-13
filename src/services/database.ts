import initSqlJs from 'sql.js';
import type { Course, Chapter, Video } from '../types/course';

class DatabaseService {
  private db: any = null;
  private initialized = false;

  async init() {
    if (this.initialized) return;

    try {
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });

      // Try to load existing database from localStorage
      const savedDb = localStorage.getItem('coursesDb');
      if (savedDb) {
        const uint8Array = new Uint8Array(JSON.parse(savedDb));
        this.db = new SQL.Database(uint8Array);
      } else {
        this.db = new SQL.Database();
        this.createTables();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  private createTables() {
    // Create courses table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        image TEXT NOT NULL,
        description TEXT NOT NULL,
        fees REAL NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    // Create chapters table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS chapters (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        title TEXT NOT NULL,
        FOREIGN KEY (course_id) REFERENCES courses (id)
      )
    `);

    // Create videos table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        chapter_id TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        duration TEXT,
        FOREIGN KEY (chapter_id) REFERENCES chapters (id)
      )
    `);

    this.saveDatabase();
  }

  private saveDatabase() {
    if (this.db) {
      const data = this.db.export();
      localStorage.setItem('coursesDb', JSON.stringify(Array.from(data)));
    }
  }

  async getAllCourses(): Promise<Course[]> {
    await this.init();
    
    const stmt = this.db.prepare('SELECT * FROM courses ORDER BY created_at DESC');
    const courses: Course[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      const course: Course = {
        id: row.id as string,
        title: row.title as string,
        image: row.image as string,
        description: row.description as string,
        fees: row.fees as number,
        createdAt: row.created_at as string,
        chapters: await this.getChaptersByCourseId(row.id as string)
      };
      courses.push(course);
    }

    stmt.free();
    return courses;
  }

  async getCourseById(id: string): Promise<Course | null> {
    await this.init();
    
    const stmt = this.db.prepare('SELECT * FROM courses WHERE id = ?');
    stmt.bind([id]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      const course: Course = {
        id: row.id as string,
        title: row.title as string,
        image: row.image as string,
        description: row.description as string,
        fees: row.fees as number,
        createdAt: row.created_at as string,
        chapters: await this.getChaptersByCourseId(row.id as string)
      };
      stmt.free();
      return course;
    }

    stmt.free();
    return null;
  }

  private async getChaptersByCourseId(courseId: string): Promise<Chapter[]> {
    const stmt = this.db.prepare('SELECT * FROM chapters WHERE course_id = ?');
    stmt.bind([courseId]);
    const chapters: Chapter[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      const chapter: Chapter = {
        id: row.id as string,
        title: row.title as string,
        videos: await this.getVideosByChapterId(row.id as string)
      };
      chapters.push(chapter);
    }

    stmt.free();
    return chapters;
  }

  private async getVideosByChapterId(chapterId: string): Promise<Video[]> {
    const stmt = this.db.prepare('SELECT * FROM videos WHERE chapter_id = ?');
    stmt.bind([chapterId]);
    const videos: Video[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      const video: Video = {
        id: row.id as string,
        title: row.title as string,
        url: row.url as string,
        duration: row.duration as string
      };
      videos.push(video);
    }

    stmt.free();
    return videos;
  }

  async addCourse(course: Omit<Course, 'id' | 'createdAt'>): Promise<string> {
    await this.init();
    
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    this.db.run(
      'INSERT INTO courses (id, title, image, description, fees, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, course.title, course.image, course.description, course.fees, createdAt]
    );

    // Add chapters and videos
    for (const chapter of course.chapters) {
      const chapterId = crypto.randomUUID();
      this.db.run(
        'INSERT INTO chapters (id, course_id, title) VALUES (?, ?, ?)',
        [chapterId, id, chapter.title]
      );

      for (const video of chapter.videos) {
        const videoId = crypto.randomUUID();
        this.db.run(
          'INSERT INTO videos (id, chapter_id, title, url, duration) VALUES (?, ?, ?, ?, ?)',
          [videoId, chapterId, video.title, video.url, video.duration || '']
        );
      }
    }

    this.saveDatabase();
    return id;
  }
}

export const dbService = new DatabaseService();