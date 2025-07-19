import { apiRequest } from "./queryClient";

export const api = {
  uploadResume: async (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await apiRequest('POST', '/api/resumes/upload', formData);
    return response.json();
  },

  analyzeResume: async (resumeId: string, jobDescription: string) => {
    const response = await apiRequest('POST', `/api/resumes/${resumeId}/analyze`, {
      jobDescription,
    });
    return response.json();
  },

  freshAnalysis: async (resumeId: string, jobDescription?: string) => {
    // This endpoint clears session data before processing
    const response = await apiRequest('POST', `/api/resumes/${resumeId}/fresh-analysis`, {
      jobDescription,
    });
    return response.json();
  },

  getAnalysis: async (resumeId: string) => {
    const response = await apiRequest('GET', `/api/resumes/${resumeId}/analysis`);
    return response.json();
  },

  getUserResumes: async (userId: string) => {
    const response = await apiRequest('GET', `/api/users/${userId}/resumes`);
    return response.json();
  },
};
