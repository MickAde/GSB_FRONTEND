'use client';
import { create } from 'zustand';
import type { SchoolPublic } from '@/types';

interface SchoolState {
  selectedSchool:    SchoolPublic | null;
  setSelectedSchool: (school: SchoolPublic | null) => void;
}

export const useSchoolStore = create<SchoolState>()((set) => ({
  selectedSchool:    null,
  setSelectedSchool: (school) => set({ selectedSchool: school }),
}));
