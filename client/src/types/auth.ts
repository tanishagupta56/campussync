export type Role = 'STUDENT' | 'FACULTY' | 'ADMINISTRATOR' | 'CLUB_CORE';

export interface StudentProfile {
  id: string;
  collegeId: string;
  program: string;
  branch: string;
  semester: number;
  yearOfStudy: number;
}

export interface MentorProfile {
  id: string;
  isAvailable: boolean;
  bio?: string;
  interests: string[];
  shareEmail: boolean;
  sharePhone: boolean;
  shareLinkedIn: boolean;
  linkedInUrl?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  studentProfile?: StudentProfile;
  mentorProfile?: MentorProfile;
}

export interface LoginChallenge {
  challengeId: string;
  maskedEmail: string;
  expiresAt: string;
  message: string;
}
