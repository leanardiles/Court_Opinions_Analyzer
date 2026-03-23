import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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

  // Send project to scholar
  sendToScholar: async (projectId) => {
    const response = await apiClient.patch(`/projects/${projectId}/send-to-scholar`);
    return response.data;
  },

  // Update AI model
  updateAIModel: async (projectId, aiModel) => {
    const response = await apiClient.patch(
      `/projects/${projectId}/ai-model?ai_model=${encodeURIComponent(aiModel)}`
    );
    return response.data;
  },

  // Update project AI provider (scholar sets this before creating modules)
  updateAIProvider: async (projectId, aiProvider) => {
    const response = await apiClient.patch(
      `/projects/${projectId}/ai-provider?ai_provider=${encodeURIComponent(aiProvider)}`
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

  getModule: async (moduleId) => {
    const response = await apiClient.get(`/modules/modules/${moduleId}`);
    return response.data;
  },

  // Mock AI Analysis (for testing - will be replaced with real AI later)
  launchMockAI: async (moduleId) => {
    const response = await apiClient.post(`/modules/modules/${moduleId}/launch-mock-ai`);
    return response.data;
  },

  // Get available AI providers from backend
  getAIProviders: async () => {
    const response = await apiClient.get('/modules/ai-providers');
    return response.data;
  },
  
  // Launch module (sample cases + run AI analysis)
  launchModule: async (moduleId) => {
    const response = await apiClient.post(`/modules/${moduleId}/launch`);
    return response.data;
  },

  // Clone an existing module into a new draft
  clone: async (moduleId) => {
    const response = await apiClient.post(`/modules/modules/${moduleId}/clone`);
    return response.data;
  },

  // Scholar Review endpoints
  getValidationSummary: async (moduleId) => {
    const response = await apiClient.get(`/modules/modules/${moduleId}/validation-summary`);
    return response.data;
  },

  getCorrections: async (moduleId) => {
    const response = await apiClient.get(`/modules/modules/${moduleId}/corrections`);
    return response.data;
  },

  reviewCorrection: async (moduleId, validationId, approve, scholarNotes) => {
    const response = await apiClient.post(
      `/modules/modules/${moduleId}/review-correction`,
      {
        validation_id: validationId,
        approve: approve,
        scholar_notes: scholarNotes || null
      }
    );
    return response.data;
  },

  trustValidator: async (moduleId) => {
    const response = await apiClient.post(`/modules/modules/${moduleId}/trust-validator`);
    return response.data;
  },
};

// Validator API
export const validatorAPI = {
  // Get validator's assigned modules
  getMyAssignments: async () => {
    const response = await apiClient.get('/modules/validators/my-assignments');
    return response.data;
  },

  // Get cases for validation in a module
  getValidationCases: async (moduleId) => {
    const response = await apiClient.get(`/modules/modules/${moduleId}/validation-cases`);
    return response.data;
  },

  // Submit validation
  submitValidation: async (moduleId, caseId, validationData) => {
    const response = await apiClient.post('/modules/validations', null, {
      params: {
        module_id: moduleId,
        case_id: caseId,
        is_correct: validationData.is_correct,
        corrected_answer: validationData.corrected_answer,
        validator_reasoning: validationData.validator_reasoning,
        validator_notes: validationData.validator_notes
      }
    });
    return response.data;
  }
};

export default apiClient;