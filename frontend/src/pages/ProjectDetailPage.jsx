import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI, projectsAPI, casesAPI, uploadAPI, modulesAPI } from '../api/client';
import Header from '../components/Header';

export default function ProjectDetailPage({ user: propUser, onLogout }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser || null);
  const [project, setProject] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([
    'case_name',
    'court',
    'case_date',
    'state',
  ]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCasesModal, setShowCasesModal] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [aiProviders, setAiProviders] = useState([]);
  const [selectedAIProvider, setSelectedAIProvider] = useState('groq-llama-70b');
  const [showScholarModal, setShowScholarModal] = useState(false);
  const [scholars, setScholars] = useState([]);
  const [loadingScholars, setLoadingScholars] = useState(false);
  const [modules, setModules] = useState([]);
  const [showModuleModal, setShowModuleModal] = useState(false);
const [moduleFormData, setModuleFormData] = useState({
  module_name: '',
  question_text: '',
  answer_type: 'multiple_choice',
  answer_options: ['', ''],
  module_context: '',
  sample_size: 20
});

  useEffect(() => {
    loadData();
  }, [projectId]);

  // Load AI providers
useEffect(() => {
  const fetchAIProviders = async () => {
    try {
      const response = await modulesAPI.getAIProviders();
      setAiProviders(response.providers);
      // Set default provider if available
      if (response.default) {
        setModuleFormData(prev => ({
          ...prev,
          ai_provider: response.default
        }));
      }
    } catch (err) {
      console.error('Failed to load AI providers:', err);
      // Fallback to hardcoded options
      setAiProviders([
        { value: 'dummy', label: 'Dummy AI (Testing)' },
        { value: 'groq-llama-8b', label: '⚡ Llama 3.1 8B (Groq - Fast)' },
        { value: 'groq-llama-70b', label: '🎯 Llama 3.1 70B (Groq - Recommended)' },
        { value: 'groq-llama-405b', label: '🔥 Llama 3.1 405B (Groq - Best Quality)' }
      ]);
    }
  };
  
  fetchAIProviders();
}, []);

  const [projectContext, setProjectContext] = useState('');
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [contextText, setContextText] = useState('');
  const [savingContext, setSavingContext] = useState(false);

  const [validators, setValidators] = useState([]);
  const [showValidatorModal, setShowValidatorModal] = useState(false);
  const [selectedModuleForValidator, setSelectedModuleForValidator] = useState(null);
  const [moduleAssignments, setModuleAssignments] = useState({});

  const [showModuleContextModal, setShowModuleContextModal] = useState(false);
  const [selectedModuleForContext, setSelectedModuleForContext] = useState(null);
  const [moduleContextText, setModuleContextText] = useState('');
  const [savingModuleContext, setSavingModuleContext] = useState(false);

  const loadModules = async () => {
    try {
      const modulesData = await modulesAPI.list(projectId);
      setModules(modulesData);
      await loadModuleAssignments(modulesData); // 🆕 ADD THIS LINE
    } catch (err) {
      console.error('Failed to load modules:', err);
    }
  };

  const handleCloneModule = async (sourceModule) => {
    try {
      // Create the cloned module on the backend
      const cloned = await modulesAPI.clone(sourceModule.id);

      // Reload modules so the new one appears
      await loadModules();

      // Pre-populate the modal with source module data, name left blank
      setModuleFormData({
        module_name: '',                                         // blank — user must fill
        question_text: sourceModule.question_text || '',
        answer_type: sourceModule.answer_type || 'multiple_choice',
        answer_options: sourceModule.answer_options?.length
          ? sourceModule.answer_options
          : ['', ''],
        module_context: sourceModule.module_context || '',
        sample_size: sourceModule.sample_size || 20,
        ai_provider: sourceModule.ai_provider || 'groq-llama-70b',
      });

      // Open the edit modal pointing at the newly cloned module
      setShowModuleModal(true);

      // Small UX hint
      alert(`Module cloned! Please enter a name for the new module (Module #${cloned.module_number}).`);
    } catch (err) {
      alert('Failed to clone module: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleDeleteModule = async (moduleId, moduleName, moduleStatus) => {
    // Tier 1: draft or sampling_complete — simple confirmation
    if (['draft', 'sampling_complete'].includes(moduleStatus)) {
      if (!window.confirm(
        `Are you sure you want to delete "${moduleName}"?\n\n` +
        `This will permanently delete the module and all its data.\n\n` +
        `This action CANNOT be undone.`
      )) {
        return;
      }

    // Tier 2: validation in progress — strong warning
    } else if (moduleStatus === 'validation_in_progress') {
      const firstConfirm = window.confirm(
        `⚠️ WARNING: Validation is currently in progress for "${moduleName}".\n\n` +
        `Deleting this module will permanently destroy:\n` +
        `- All sampled cases\n` +
        `- All AI analyses\n` +
        `- All validator assignments\n` +
        `- Any validations already submitted by the validator\n\n` +
        `The validator will lose all their work without warning.\n\n` +
        `Are you sure you want to continue?`
      );
      if (!firstConfirm) return;

      const secondConfirm = window.confirm(
        `🛑 FINAL WARNING\n\n` +
        `You are about to delete "${moduleName}" while a validator is actively working on it.\n\n` +
        `This CANNOT be undone. Are you absolutely sure?`
      );
      if (!secondConfirm) return;

    // Tier 3: validation_complete or approved — block deletion
    } else if (['validation_complete', 'approved'].includes(moduleStatus)) {
      window.alert(
        `🔒 Cannot delete "${moduleName}".\n\n` +
        `This module has completed validation and its data has research value.\n\n` +
        `If you really need to delete it, please contact your administrator.`
      );
      return;

    // Fallback for any other status — simple confirmation
    } else {
      if (!window.confirm(
        `Are you sure you want to delete "${moduleName}"?\n\n` +
        `This action CANNOT be undone.`
      )) {
        return;
      }
    }

    try {
      await modulesAPI.delete(moduleId);
      await loadModules();
    } catch (err) {
      alert('Failed to delete module: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const loadModuleAssignments = async (moduleList) => {
    const assignmentsData = {};
    for (const module of moduleList) {
      try {
        const assignment = await modulesAPI.getAssignments(module.id);
        assignmentsData[module.id] = assignment;
      } catch (err) {
        console.error(`Failed to load assignments for module ${module.id}:`, err);
      }
    }
    setModuleAssignments(assignmentsData);
  };

  const loadProjectContext = async () => {
    try {
      const contextData = await projectsAPI.getContext(projectId);
      setProjectContext(contextData.context_text || '');
      setContextText(contextData.context_text || '');
    } catch (err) {
      console.error('Failed to load project context:', err);
    }
  };

  const loadData = async () => {
    try {
      const [userData, projectData, casesData] = await Promise.all([
        authAPI.getCurrentUser(),
        projectsAPI.get(projectId),
        casesAPI.list(projectId),
      ]);
      
      setUser(userData);
      setProject(projectData);
      setCases(casesData);

      // Set AI provider from project data
      if (projectData.ai_provider) {
        setSelectedAIProvider(projectData.ai_provider);
      }

      // Load modules and context if scholar
      if (userData.role === 'scholar') {
        await loadModules();
        await loadProjectContext();
      }

      if (casesData.length > 0) {
        const columns = Object.keys(casesData[0]).filter(
          (col) => col !== 'id'
        );
        setAvailableColumns(columns);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    try {
      await uploadAPI.uploadParquet(projectId, file);
      alert('File uploaded successfully!');
      setShowUploadModal(false);
      setFile(null);
      loadData();
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveParquet = async () => {
    if (!window.confirm(
      `Are you sure you want to remove the uploaded Parquet file?\n\n` +
      `This will delete all ${cases.length} cases from this project.\n\n` +
      `This action CANNOT be undone.`
    )) {
      return;
    }

    try {
      const result = await uploadAPI.removeParquet(projectId);
      alert(result.message || 'Parquet file removed successfully!');
      loadData();
    } catch (err) {
      alert('Failed to remove Parquet file: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const loadScholars = async () => {
    setLoadingScholars(true);
    try {
      const scholarData = await authAPI.getScholars();
      setScholars(scholarData);
      setShowScholarModal(true);
    } catch (err) {
      alert('Failed to load scholars: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setLoadingScholars(false);
    }
  };

  const handleAssignScholar = async (scholarId) => {
    try {
      const result = await projectsAPI.assignScholar(projectId, scholarId);
      alert(result.message || 'Scholar assigned successfully!');
      setShowScholarModal(false);
      loadData();
    } catch (err) {
      alert('Failed to assign scholar: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleUnassignScholar = async () => {
    if (!window.confirm(
      `Unassign ${project?.scholar_email} from this project?\n\n` +
      `The project status will return to DRAFT.`
    )) {
      return;
    }

    try {
      await projectsAPI.assignScholar(projectId, -1);
      alert('Scholar unassigned successfully!');
      loadData();
    } catch (err) {
      alert('Failed to unassign scholar: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleSendToScholar = async () => {
    if (!window.confirm(
      `Send this project to ${project?.scholar_email}?\n\n` +
      `The scholar will be able to launch verification work.`
    )) {
      return;
    }

    try {
      await projectsAPI.sendToScholar(projectId);
      alert('Project sent to scholar successfully!');
      loadData();
    } catch (err) {
      alert('Failed to send project: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleProjectAIProviderChange = async (newProvider) => {
    try {
      await projectsAPI.updateAIProvider(projectId, newProvider);
      setSelectedAIProvider(newProvider);
      alert('AI Provider updated successfully!');
      loadData();
    } catch (err) {
      alert('Failed to update AI provider: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleAIModelChange = async (newModel) => {
    try {
      await projectsAPI.updateAIModel(projectId, newModel);
      loadData();
    } catch (err) {
      alert('Failed to update AI model: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(
      `Are you sure you want to delete "${project?.name}"?\n\n` +
      `This will permanently delete:\n` +
      `- The project\n` +
      `- All ${cases.length} court cases\n` +
      `- All uploaded files\n\n` +
      `This action CANNOT be undone.`
    )) {
      return;
    }

    try {
      await projectsAPI.delete(projectId);
      alert('Project deleted successfully!');
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to delete project: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleCreateModule = async () => {
    if (!moduleFormData.module_name.trim()) {
      alert('Please enter a module name');
      return;
    }
    if (!moduleFormData.question_text.trim()) {
      alert('Please enter a question');
      return;
    }
    if (moduleFormData.answer_type === 'multiple_choice') {
      const validOptions = moduleFormData.answer_options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        alert('Multiple choice questions need at least 2 options');
        return;
      }
    }

    try {
      const payload = {
        ...moduleFormData,
        answer_options: moduleFormData.answer_type === 'multiple_choice' 
          ? moduleFormData.answer_options.filter(opt => opt.trim())
          : null
      };
      
      await modulesAPI.create(projectId, payload);
      alert('Module created successfully!');
      setShowModuleModal(false);
      
      setModuleFormData({
        module_name: '',
        question_text: '',
        answer_type: 'multiple_choice',
        answer_options: ['', ''],
        module_context: '',
        sample_size: 20
      });
      
      loadModules();
    } catch (err) {
      alert('Failed to create module: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleSampleCases = async (moduleId) => {
    if (!window.confirm('Generate random case sample for this module?')) {
      return;
    }
    
    try {
      const result = await modulesAPI.sampleCases(moduleId);
      alert(result.message || 'Cases sampled successfully!');
      loadModules(); // Reload to show updated status
    } catch (err) {
      alert('Failed to sample cases: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleOpenValidatorModal = async (module) => {
    try {
      const validatorList = await authAPI.getValidators();
      setValidators(validatorList);
      setSelectedModuleForValidator(module);
      setShowValidatorModal(true);
    } catch (err) {
      alert('Failed to load validators: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleAssignValidator = async (validatorId) => {
    if (!selectedModuleForValidator) return;
    
    try {
      const result = await modulesAPI.assignValidator(selectedModuleForValidator.id, validatorId);
      alert(result.message || 'Validator assigned successfully!');
      setShowValidatorModal(false);
      setSelectedModuleForValidator(null);
      loadModules(); // Reload to show assigned validator
    } catch (err) {
      alert('Failed to assign validator: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleLaunchMockAI = async (moduleId) => {
    if (!window.confirm('Launch AI analysis for this module?\n\nThis will generate mock AI responses for all sampled cases.')) {
      return;
    }
    
    try {
      const result = await modulesAPI.launchMockAI(moduleId);
      alert(result.message || 'AI analysis completed successfully!');
      loadModules(); // Reload to show updated status
    } catch (err) {
      alert('Failed to launch AI analysis: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleSaveContext = async () => {
    setSavingContext(true);
    try {
      const result = await projectsAPI.saveContext(projectId, contextText);
      setProjectContext(contextText);
      setShowContextEditor(false);
      alert(result.message || 'Project context saved successfully!');
    } catch (err) {
      alert('Failed to save context: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setSavingContext(false);
    }
  };

  const handleSaveModuleContext = async () => {
    if (!selectedModuleForContext) return;
    setSavingModuleContext(true);
    try {
      await modulesAPI.update(selectedModuleForContext.id, {
        module_context: moduleContextText
      });
      await loadModules();
      setShowModuleContextModal(false);
      setSelectedModuleForContext(null);
    } catch (err) {
      alert('Failed to save module context: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setSavingModuleContext(false);
    }
  };

  const handleLaunchModule = async (moduleId) => {
    if (!window.confirm(
      'Launch this module?\n\n' +
      'This will:\n' +
      '1. Sample cases for validation\n' +
      '2. Run AI analysis using the selected AI provider\n\n' +
      'This action cannot be undone.'
    )) {
      return;
    }
    
    try {
      const result = await modulesAPI.launchModule(moduleId);
      alert(result.message || 'Module launched successfully!');
      loadModules(); // Reload to show updated status
    } catch (err) {
      alert('Failed to launch module: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleAddOption = () => {
    setModuleFormData({
      ...moduleFormData,
      answer_options: [...moduleFormData.answer_options, '']
    });
  };

  const handleRemoveOption = (index) => {
    const newOptions = moduleFormData.answer_options.filter((_, i) => i !== index);
    setModuleFormData({
      ...moduleFormData,
      answer_options: newOptions
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...moduleFormData.answer_options];
    newOptions[index] = value;
    setModuleFormData({
      ...moduleFormData,
      answer_options: newOptions
    });
  };

  const toggleColumn = (column) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  };

  const toggleAllColumns = () => {
    if (selectedColumns.length === availableColumns.length) {
      setSelectedColumns(['case_name']);
    } else {
      setSelectedColumns([...availableColumns]);
    }
  };

  const renderCellContent = (value) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'string' && value.length > 100) {
      return (
        <span title={value} className="cursor-help">
          {value.substring(0, 100)}...
        </span>
      );
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />
  

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-cardozo-blue hover:text-[#005A94] mb-4 font-medium"
        >
          ← Back to Dashboard
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold text-cardozo-dark">
            {project?.name}
          </h1>
          <div className="w-24 h-1 bg-cardozo-gold mt-2 mb-4"></div>
          {project?.description && (
            <p className="text-gray-600">{project.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-6">
            <span>Created {new Date(project?.created_at).toLocaleDateString()}</span>
            
            {/* Show Scholar for Admin */}
            {user?.role === 'admin' && project?.scholar_id && (
              <>
                <span>·</span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-cardozo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium text-cardozo-blue">
                    Scholar: {project.scholar_email || 'Assigned'}
                  </span>
                </span>
              </>
            )}
            
            {/* Show Admin for Scholar */}
            {user?.role === 'scholar' && (
              <>
                {project?.admin_email && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="font-medium text-purple-600">
                        Admin: {project.admin_email}
                      </span>
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Buttons - Admin */}
        {user?.role === 'admin' && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              {/* Left side buttons */}
              <div className="flex gap-3">
                {/* Upload/Remove Parquet Button */}
                {cases.length === 0 ? (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2 bg-cardozo-blue text-white rounded-lg font-medium hover:bg-[#005A94] transition shadow text-sm"
                  >
                    Upload Parquet File
                  </button>
                ) : (
                  <button
                    onClick={handleRemoveParquet}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition shadow text-sm"
                  >
                    Remove Parquet File
                  </button>
                )}
                
                {/* Assign/Unassign Scholar Button */}
                {project?.status === 'draft' || project?.status === 'ready' ? (
                  project?.scholar_id ? (
                    <button
                      onClick={handleUnassignScholar}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition shadow text-sm"
                    >
                      Unassign Scholar
                    </button>
                  ) : (
                    <button
                      onClick={loadScholars}
                      disabled={loadingScholars}
                      className="px-4 py-2 bg-cardozo-blue text-white rounded-lg font-medium hover:bg-[#005A94] transition shadow text-sm disabled:opacity-50"
                    >
                      {loadingScholars ? 'Loading...' : 'Assign Scholar'}
                    </button>
                  )
                ) : null}
              </div>

              {/* Right side buttons */}
              <div className="flex gap-3">
                {/* Send to Scholar Button */}
                {project?.status === 'ready' && (
                  <button
                    onClick={handleSendToScholar}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition shadow text-sm"
                  >
                    📤 Send to Scholar
                  </button>
                )}
                
                {/* Delete Project Button */}
                <button
                  onClick={handleDeleteProject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition shadow text-sm"
                >
                  🗑️ Delete Project
                </button>
              </div>
            </div>
           
            {/* Show Parquet filename if uploaded */}
            {project?.parquet_filename && (
              <div className="space-y-3">
                {/* Parquet File Info */}
                <div className="flex items-center justify-between gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-cardozo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-semibold">Source File:</span>
                    <span className="font-mono">{project.parquet_filename}</span>
                    <span className="text-gray-400">•</span>
                    <span>{project.total_cases} cases</span>
                  </div>
                  
                  {/* View Source File Button */}
                  <button
                    onClick={() => setShowCasesModal(true)}
                    className="px-3 py-1.5 bg-cardozo-blue text-white rounded-lg text-sm font-medium hover:bg-[#005A94] transition"
                  >
                    📄 View Source File
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons - Scholar */}
        {user?.role === 'scholar' && project?.scholar_id === user?.id && (
          <div className="mb-6">
            {/* Show Parquet filename and AI provider selector if uploaded */}
            {project?.parquet_filename && (
              <div className="space-y-3">
                {/* Parquet File Info */}
                <div className="flex items-center justify-between gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-cardozo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-semibold">Source File:</span>
                    <span className="font-mono">{project.parquet_filename}</span>
                    <span className="text-gray-400">•</span>
                    <span>{project.total_cases} cases</span>
                  </div>
                  
                  {/* View Source File Button */}
                  <button
                    onClick={() => setShowCasesModal(true)}
                    className="px-3 py-1.5 bg-cardozo-blue text-white rounded-lg text-sm font-medium hover:bg-[#005A94] transition"
                  >
                    📄 View Source File
                  </button>
                </div>

                {/* AI Provider Selection - Scholar can change this */}
                <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-cardozo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="font-semibold text-gray-700">AI Provider:</span>
                      <select
                        value={selectedAIProvider}
                        onChange={(e) => handleProjectAIProviderChange(e.target.value)}
                        disabled={modules.length > 0}
                        className="px-3 py-1.5 bg-white border border-blue-300 rounded-md text-gray-900 font-medium focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {aiProviders.length === 0 ? (
                          <option value="ollama-8b">Loading...</option>
                        ) : (
                          aiProviders.map((provider) => (
                            <option key={provider.value} value={provider.value}>
                              {provider.label}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    
                    {/* Info badge */}
                    <div className="text-xs text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                      {modules.length > 0 ? (
                        <>🔒 Locked (modules exist)</>
                      ) : (
                        <>✏️ Can be changed</>
                      )}
                    </div>
                  </div>
                  
                  {modules.length === 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      💡 Select AI provider before creating modules. This will apply to all modules in this project.
                    </p>
                  )}
                  {modules.length > 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      ⚠️ AI provider cannot be changed once modules are created.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}    

        {/* Project Context Section - Scholar only */}
        {user?.role === 'scholar' && project?.scholar_id === user?.id && (
          <div className="mb-6">
            <h2 className="text-2xl font-serif font-bold text-cardozo-dark mb-4">
              Project Context
            </h2>

            {projectContext ? (
              <div className="card">
                {/* Preview */}
                <div className="text-sm text-gray-600 mb-2 font-semibold">
                  📄 Overarching context for all modules:
                </div>
                <div className="text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4
                                overflow-hidden line-clamp-3 whitespace-pre-wrap">
                  {projectContext}
                </div>
                <button
                  onClick={() => setShowContextEditor(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition text-sm"
                >
                  📄 View / Edit Context
                </button>
              </div>
            ) : (
              <div className="card text-center py-12">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-2">No project context added yet</p>
                <p className="text-sm text-gray-500 mb-4">
                  Add overarching context to guide AI analysis across all modules
                </p>
                <button
                  onClick={() => setShowContextEditor(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition text-sm"
                >
                  + Add Context
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modules Section - Scholar only */}
        {user?.role === 'scholar' && project?.scholar_id === user?.id && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-serif font-bold text-cardozo-dark">
                Research Questions (Modules)
              </h2>
              <button
                onClick={() => setShowModuleModal(true)}
                className="px-4 py-2 bg-cardozo-blue text-white rounded-lg font-medium hover:bg-[#005A94] transition shadow text-sm"
              >
                + Add New Module
              </button>
            </div>

            {modules.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-600 mb-4">No modules created yet</p>
                <p className="text-sm text-gray-500">Create your first research question to get started</p>
              </div>
            ) : (
              <div className="space-y-4">       
                {modules.map((module, index) => {
                  const assignment = moduleAssignments[module.id] || {};
                  
                  const colors = [
                    { bg: 'bg-blue-50', border: 'border-cardozo-blue' },
                    { bg: 'bg-amber-50', border: 'border-cardozo-gold' },
                    { bg: 'bg-green-50', border: 'border-green-600' },
                    { bg: 'bg-purple-50', border: 'border-purple-600' },
                    { bg: 'bg-pink-50', border: 'border-pink-600' },
                  ];
                  const colorScheme = colors[index % colors.length];

                  return (
                    <div key={module.id} className={`card hover:shadow-lg transition border-t-4 ${colorScheme.bg} ${colorScheme.border}`}>

                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-cardozo-blue text-white rounded text-xs font-semibold">
                              Module {module.module_number}
                            </span>
                            <h3 className="text-lg font-semibold text-cardozo-dark">
                              {module.module_name}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              module.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                              module.status === 'sampling_complete' ? 'bg-yellow-100 text-yellow-800' :
                              module.status === 'ready_for_validation' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {module.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </div>
                          
                          <p className="text-gray-700 mb-3">{module.question_text}</p>

                          {/* Module Context Preview */}
                          {module.module_context ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                              <div className="text-xs font-semibold text-gray-500 mb-1">
                                📋 Module Context:
                              </div>
                              <div className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap mb-2">
                                {module.module_context}
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedModuleForContext(module);
                                  setModuleContextText(module.module_context || '');
                                  setShowModuleContextModal(true);
                                }}
                                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                              >
                                {['draft', 'sampling_complete'].includes(module.status)
                                  ? '✏️ View / Edit Context'
                                  : '📄 View Context'}
                              </button>
                            </div>
                          ) : (
                            ['draft', 'sampling_complete'].includes(module.status) && (
                              <button
                                onClick={() => {
                                  setSelectedModuleForContext(module);
                                  setModuleContextText('');
                                  setShowModuleContextModal(true);
                                }}
                                className="text-xs text-purple-600 hover:text-purple-800 font-medium mb-3 block"
                              >
                                + Add Module Context
                              </button>
                            )
                          )}
                          
                          <div className="flex gap-4 text-sm text-gray-600 mb-3">
                            <span>Type: <span className="font-medium">{module.answer_type.replace(/_/g, ' ')}</span></span>
                            <span>•</span>
                            <span>Sample Size: <span className="font-medium">{module.sample_size} cases</span></span>
                            {module.answer_options && (
                              <>
                                <span>•</span>
                                <span>Options: <span className="font-medium">{module.answer_options.length}</span></span>
                              </>
                            )}
                          </div>

                          {/*Assignment Info */}
                          <div className="flex gap-4 text-sm mb-3">
                            {assignment.sampled ? (
                              <span className="flex items-center gap-1 text-green-700">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="font-medium">{assignment.sample_count} cases sampled</span>
                              </span>
                            ) : (
                              <span className="text-gray-500 italic">Not sampled yet</span>
                            )}
                            <span>•</span>
                            {assignment.validator ? (
                              <span className="flex items-center gap-1 text-purple-700">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="font-medium">Validator: {assignment.validator.email}</span>
                              </span>
                            ) : (
                              <span className="text-gray-500 italic">No validator assigned</span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-4">
                            {/* Step 1: Assign Validator (shows when no validator assigned) */}
                            {!assignment.validator && (
                              <button
                                onClick={() => handleOpenValidatorModal(module)}
                                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                              >
                                👤 Assign Validator
                              </button>
                            )}
                            
                            {/* Step 2: Launch Module (shows after validator assigned, before sampling) */}
                            {assignment.validator && !assignment.sampled && (
                              <button
                                onClick={() => handleLaunchModule(module.id)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                              >
                                🚀 Launch Module
                              </button>
                            )}
                            
                            {/* Step 3: Validation progress (shows after module launched) */}
                            {module.status === 'validation_in_progress' && assignment.sampled && (
                              <>
                                {/* Validator hasn't finished yet — no action for scholar */}
                                {!assignment.validator_finished && (
                                  <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-sm font-medium">
                                    ⏳ Waiting for validator ({assignment.completed_cases}/{assignment.sample_count} cases)
                                  </span>
                                )}

                                {/* Validator finished, corrections pending — scholar needs to act */}
                                {assignment.validator_finished && assignment.corrections_pending > 0 && (
                                  <button
                                    onClick={() => navigate(`/module-review/${module.id}`)}
                                    className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 transition"
                                  >
                                    📊 Review Corrections ({assignment.corrections_pending})
                                  </button>
                                )}

                                {/* Validator finished, no corrections — AI was perfect */}
                                {assignment.validator_finished && assignment.corrections_pending === 0 && (
                                  <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm font-medium">
                                    ✓ AI was 100% accurate
                                  </span>
                                )}
                              </>
                            )}

                            <button
                              onClick={() => handleCloneModule(module)}
                              className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold text-xs"
                            >
                              Clone
                            </button>

                            <button
                              onClick={() => handleDeleteModule(module.id, module.module_name, module.status)}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-xs"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-serif font-bold text-cardozo-dark mb-6">
              Upload Parquet File
            </h2>
            <div className="space-y-4">
              <input
                type="file"
                accept=".parquet"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm text-gray-600
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-cardozo-blue file:text-white
                  hover:file:bg-[#005A94]
                  file:cursor-pointer cursor-pointer"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setFile(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScholarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-serif font-bold text-cardozo-dark mb-6">
              Assign Scholar to Project
            </h2>
            
            {project?.scholar_id && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Current scholar: <span className="font-semibold">
                    {scholars.find(s => s.id === project.scholar_id)?.email || 'Unknown'}
                  </span>
                </p>
              </div>
            )}
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {scholars.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No scholars available</p>
              ) : (
                scholars.map((scholar) => (
                  <button
                    key={scholar.id}
                    onClick={() => handleAssignScholar(scholar.id)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition ${
                      project?.scholar_id === scholar.id
                        ? 'border-cardozo-blue bg-blue-50'
                        : 'border-gray-200 hover:border-cardozo-blue hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{scholar.email}</div>
                    {scholar.full_name && (
                      <div className="text-sm text-gray-600">{scholar.full_name}</div>
                    )}
                    {project?.scholar_id === scholar.id && (
                      <div className="text-xs text-cardozo-blue mt-1 font-medium">
                        Currently Assigned
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
            
            <button
              onClick={() => setShowScholarModal(false)}
              className="mt-6 w-full px-6 py-2.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Create Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl my-8">
            <h2 className="text-2xl font-serif font-bold text-cardozo-dark mb-6">
              Create Research Question (Module)
            </h2>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Module Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Module Name
                </label>
                <input
                  type="text"
                  value={moduleFormData.module_name}
                  onChange={(e) => setModuleFormData({...moduleFormData, module_name: e.target.value})}
                  placeholder="e.g., Election Type Analysis"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue"
                />
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Research Question
                </label>
                <textarea
                  value={moduleFormData.question_text}
                  onChange={(e) => setModuleFormData({...moduleFormData, question_text: e.target.value})}
                  placeholder="e.g., What is the election at issue?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue"
                />
              </div>

              {/* Module Context */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Module-Specific Context (Optional)
                </label>
                <textarea
                  value={moduleFormData.module_context}
                  onChange={(e) => setModuleFormData({...moduleFormData, module_context: e.target.value})}
                  placeholder="Provide specific guidance for this question... (Markdown supported)"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue font-mono text-sm"
                />
              </div>

              {/* Answer Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Answer Type
                </label>
                <select
                  value={moduleFormData.answer_type}
                  onChange={(e) => setModuleFormData({...moduleFormData, answer_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue"
                >
                  <option value="yes_no">Yes/No</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="integer">Integer (Number)</option>
                  <option value="text">Free Text</option>
                  <option value="date">Date</option>
                </select>
              </div>

              {/* Answer Options (if multiple choice) */}
              {moduleFormData.answer_type === 'multiple_choice' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Answer Options
                  </label>
                  <div className="space-y-2">
                    {moduleFormData.answer_options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue"
                        />
                        {moduleFormData.answer_options.length > 2 && (
                          <button
                            onClick={() => handleRemoveOption(index)}
                            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleAddOption}
                      className="text-sm text-cardozo-blue hover:text-[#005A94] font-medium"
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              )}

              {/* Sample Size */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sample Size (Cases to Verify)
                </label>
                <input
                  type="number"
                  value={moduleFormData.sample_size}
                  onChange={(e) => setModuleFormData({...moduleFormData, sample_size: parseInt(e.target.value)})}
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of cases to randomly sample from {project?.total_cases || 0} total cases
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateModule}
                  className="flex-1 px-6 py-2.5 bg-cardozo-gold text-white rounded-lg font-semibold hover:bg-yellow-600 transition"
                >
                  Create Module
                </button>
                <button
                  onClick={() => {
                    setShowModuleModal(false);
                    setModuleFormData({
                      module_name: '',
                      question_text: '',
                      answer_type: 'multiple_choice',
                      answer_options: ['', ''],
                      module_context: '',
                      sample_size: 20
                    });
                  }}
                  className="flex-1 px-6 py-2.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>  
          </div>
        </div>
      )}

      {/* Project Context Editor Modal */}
      {showContextEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-4xl my-8">
            <h2 className="text-2xl font-serif font-bold text-cardozo-dark mb-6">
              Project Context
            </h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Provide overarching context for this project. This will be used by AI for 
                <span className="font-semibold"> ALL modules</span> in addition to module-specific context.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Tips for effective context:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Explain the overall research goal and background</li>
                      <li>Define key terms or legal concepts</li>
                      <li>Mention important cases or principles to look for</li>
                      <li>Provide guidance that applies across all research questions</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Context (Markdown supported)
              </label>
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder=""
                rows={16}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                This context will be visible to validators and combined with module-specific context when building AI prompts.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveContext}
                disabled={savingContext}
                className="flex-1 px-6 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
              >
                {savingContext ? 'Saving...' : 'Save Context'}
              </button>
              <button
                onClick={() => {
                  setShowContextEditor(false);
                  setContextText(projectContext); // Reset to saved version
                }}
                className="flex-1 px-6 py-2.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validator Assignment Modal */}
      {showValidatorModal && selectedModuleForValidator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-serif font-bold text-cardozo-dark mb-6">
              Assign Validator
            </h2>
            
            <p className="text-sm text-gray-600 mb-4">
              Select a validator to verify {moduleAssignments[selectedModuleForValidator.id]?.sample_count || 0} cases 
              for <span className="font-semibold">{selectedModuleForValidator.module_name}</span>
            </p>
            
            <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
              {validators.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No validators available</p>
              ) : (
                validators.map((validator) => (
                  <button
                    key={validator.id}
                    onClick={() => handleAssignValidator(validator.id)}
                    className="w-full p-4 text-left rounded-lg border-2 border-gray-200 hover:border-purple-600 hover:bg-purple-50 transition"
                  >
                    <div className="font-semibold text-gray-900">{validator.email}</div>
                    {validator.full_name && (
                      <div className="text-sm text-gray-600">{validator.full_name}</div>
                    )}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => {
                setShowValidatorModal(false);
                setSelectedModuleForValidator(null);
              }}
              className="w-full px-6 py-2.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cases Viewer Modal */}
      {showCasesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-2xl font-serif font-bold text-cardozo-dark">
                  Source File Viewer
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {project?.parquet_filename} • {cases.length} cases
                </p>
              </div>
              <button
                onClick={() => setShowCasesModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Column Selector */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-cardozo-dark">
                    Select Columns to Display
                  </h3>
                  <button
                    onClick={toggleAllColumns}
                    className="text-sm font-medium text-cardozo-blue hover:text-[#005A94]"
                  >
                    {selectedColumns.length === availableColumns.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {availableColumns.map((column) => (
                    <label
                      key={column}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded-lg transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(column)}
                        onChange={() => toggleColumn(column)}
                        className="w-4 h-4 rounded border-gray-300 text-cardozo-blue focus:ring-cardozo-blue focus:ring-offset-0"
                      />
                      <span className="text-sm font-mono text-gray-900">{column}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cases Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {selectedColumns.map((column) => (
                          <th
                            key={column}
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                          >
                            {column.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {cases.map((case_, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition">
                          {selectedColumns.map((column) => (
                            <td
                              key={column}
                              className="px-6 py-4 text-sm text-gray-900 max-w-xs"
                            >
                              {renderCellContent(case_[column])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-center">
                  <span className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-cardozo-dark">{cases.length}</span> court cases
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 bg-gray-50">
              <button
                onClick={() => setShowCasesModal(false)}
                className="w-full px-6 py-2.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module Context Editor Modal */}
      {showModuleContextModal && selectedModuleForContext && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl my-8">
            <h2 className="text-2xl font-serif font-bold text-cardozo-dark mb-2">
              Module Context
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              <span className="font-semibold">{selectedModuleForContext.module_name}</span>
              {' · '}
              {['draft', 'sampling_complete'].includes(selectedModuleForContext.status)
                ? 'Editable — module not yet launched'
                : '🔒 Read-only — module already launched'}
            </p>

            <textarea
              value={moduleContextText}
              onChange={(e) => setModuleContextText(e.target.value)}
              disabled={!['draft', 'sampling_complete'].includes(selectedModuleForContext.status)}
              placeholder="Provide specific guidance for this question... (Markdown supported)"
              rows={16}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 font-mono text-sm disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed"
            />

            <div className="flex gap-3 mt-6">
              {['draft', 'sampling_complete'].includes(selectedModuleForContext.status) ? (
                <>
                  <button
                    onClick={handleSaveModuleContext}
                    disabled={savingModuleContext}
                    className="flex-1 px-6 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {savingModuleContext ? 'Saving...' : 'Save Context'}
                  </button>
                  <button
                    onClick={() => {
                      setShowModuleContextModal(false);
                      setSelectedModuleForContext(null);
                    }}
                    className="flex-1 px-6 py-2.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowModuleContextModal(false);
                    setSelectedModuleForContext(null);
                  }}
                  className="w-full px-6 py-2.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
