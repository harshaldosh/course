export interface Chapter {
  id: string;
  title: string;
  description?: string;
  videos: Video[];
}

export interface Video {
  id: string;
  title: string;
  url: string;
  duration?: string;
  description?: string;
}

export interface Course {
  id: string;
  title: string;
  image: string;
  description: string;
  fees: number;
  courseMaterialUrl?: string;
  chapters: Chapter[];
  createdAt: string;
}