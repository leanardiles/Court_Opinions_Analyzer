import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, formData);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Get all scholars
  getScholars: async () => {
    const response = await apiClient.get('/auth/users/scholars');
    return response.data;
  },

  // Get validators
  getValidators: async () => {
    const response = await apiClient.get('/auth/users/validators');
    return response.data;
  },
};

// Projects API
export const projectsAPI = {
  list: async () => {
    const response = await apiClient.get('/projects/');
    return response.data;
  },
  
  create: async (projectData) => {
    const response = await apiClient.post('/projects/', projectData);
    return response.data;
  },
  
  get: async (projectId) => {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data;
  },
  
  delete: async (projectId) => {
    await apiClient.delete(`/projects/${projectId}`);
    return { success: true };
  },

  assignScholar: async (projectId, scholarId) => {
    const response = await apiClient.patch(
      `/projects/${projectId}/assign-scholar?scholar_id=${scholarId}`
    );
    return response.data;
  },

  //Send project to scholar
  sendToScholar: async (projectId) => {
    const response = await apiClient.patch(`/projects/${projectId}/send-to-scholar`);
    return response.data;
  },

  //Update AI model
  updateAIModel: async (projectId, aiModel) => {
    const response = await apiClient.patch(
      `/projects/${projectId}/ai-model?ai_model=${encodeURIComponent(aiModel)}`
    );
    return response.data;
  },

  // Project Context
  getContext: async (projectId) => {
    const response = await apiClient.get(`/projects/${projectId}/context`);
    return response.data;
  },
  
  saveContext: async (projectId, contextText) => {
    const response = await apiClient.post(
      `/projects/${projectId}/context?context_text=${encodeURIComponent(contextText)}`
    );
    return response.data;
  },
};

// Upload API
export const uploadAPI = {
  uploadParquet: async (projectId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(
      `/uploads/projects/${projectId}/parquet`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
  
  // Remove Parquet file
  removeParquet: async (projectId) => {
    const response = await apiClient.delete(
      `/uploads/projects/${projectId}/parquet`
    );
    return response.data;
  },
};

// Cases API
export const casesAPI = {
  list: async (projectId) => {
    const response = await apiClient.get(`/projects/${projectId}/cases`);
    return response.data;
  },
};

// Modules API
export const modulesAPI = {
  create: async (projectId, moduleData) => {
    const response = await apiClient.post(`/modules/projects/${projectId}/modules`, moduleData);
    return response.data;
  },
  
  list: async (projectId) => {
    const response = await apiClient.get(`/modules/projects/${projectId}/modules`);
    return response.data;
  },
  
  get: async (moduleId) => {
    const response = await apiClient.get(`/modules/modules/${moduleId}`);
    return response.data;
  },
  
  update: async (moduleId, moduleData) => {
    const response = await apiClient.patch(`/modules/modules/${moduleId}`, moduleData);
    return response.data;
  },
  
  delete: async (moduleId) => {
    await apiClient.delete(`/modules/modules/${moduleId}`);
    return { success: true };
  },

  // Module sampling and validator assignment
  sampleCases: async (moduleId) => {
    const response = await apiClient.post(`/modules/modules/${moduleId}/sample-cases`);
    return response.data;
  },
  
  assignValidator: async (moduleId, validatorId) => {
    const response = await apiClient.post(
      `/modules/modules/${moduleId}/assign-validator?validator_id=${validatorId}`
    );
    return response.data;
  },
  
  getAssignments: async (moduleId) => {
    const response = await apiClient.get(`/modules/modules/${moduleId}/assignments`);
    return response.data;
  },

  // Mock AI Analysis
  launchMockAI: async (moduleId) => {
    const response = await apiClient.post(`/modules/modules/${moduleId}/launch-mock-ai`);
    return response.data;
  },
};