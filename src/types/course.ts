export interface Chapter {
  id: string;
  title: string;
  description?: string;
  videos: Video[];
  agents: Agent[];
}

export interface Video {
  id: string;
  title: string;
  url: string;
  duration?: string;
  description?: string;
  type: 'video';
}

export interface Agent {
  id: string;
  title: string;
  replicaId: string;
  conversationalContext: string;
  description?: string;
  type: 'agent';
}

export interface Course {
  id: string;
  title: string;
  image: string;
  description: string;
  agentCourseDescription: string;
  category: 'Technology' | 'Project Management' | 'Finance' | 'Sustainability';
  sponsored: boolean;
  fees: number;
  courseMaterialUrl?: string;
  chapters: Chapter[];
  createdAt: string;
  isEnrolled?: boolean;
}