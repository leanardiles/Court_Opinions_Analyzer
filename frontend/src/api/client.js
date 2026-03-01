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

  //Launch project (scholar only)
  launchProject: async (projectId) => {
    const response = await apiClient.patch(`/projects/${projectId}/launch`);
    return response.data;
  },

  //Update AI model
  updateAIModel: async (projectId, aiModel) => {
    const response = await apiClient.patch(
      `/projects/${projectId}/ai-model?ai_model=${encodeURIComponent(aiModel)}`
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