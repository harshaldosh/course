export interface Chapter {
  id: string;
  title: string;
  videos: Video[];
}

export interface Video {
  id: string;
  title: string;
  url: string;
  duration?: string;
}

export interface Course {
  id: string;
  title: string;
  image: string;
  description: string;
  fees: number;
  chapters: Chapter[];
  createdAt: string;
}