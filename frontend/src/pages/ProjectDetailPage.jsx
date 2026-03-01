import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI, projectsAPI, casesAPI, uploadAPI } from '../api/client';
import Header from '../components/Header';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showScholarModal, setShowScholarModal] = useState(false);
  const [scholars, setScholars] = useState([]);
  const [loadingScholars, setLoadingScholars] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

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
      // Use -1 to signal "unassign"
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

  const handleLaunchProject = async () => {
    if (!window.confirm(
      `Launch this project?\n\n` +
      `This will activate the verification workflow.`
    )) {
      return;
    }

    try {
      await projectsAPI.launchProject(projectId);
      alert('Project launched successfully!');
      loadData();
    } catch (err) {
      alert('Failed to launch project: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleAIModelChange = async (newModel) => {
    try {
      await projectsAPI.updateAIModel(projectId, newModel);
      loadData(); // Reload to show updated model
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
      <Header user={user} onLogout={() => navigate('/')} />

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
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
            <span>{cases.length} cases</span>
            <span>·</span>
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
            
            {/* Show Admin and Validators for Scholar */}
            {user?.role === 'scholar' && (
              <>
                {/* Admin */}
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
                
                {/* Validators */}
                <span>·</span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-green-600">
                    Validator(s): <span className="text-gray-400 italic">Unassigned</span>
                  </span>
                </span>
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
                
                {/* Assign/Unassign Scholar Button - only show before project is sent */}
                {project?.status === 'draft' || project?.status === 'ready' ? (
                  project?.scholar_id ? (
                    // Unassign button (yellow) when scholar is assigned
                    <button
                      onClick={handleUnassignScholar}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition shadow text-sm"
                    >
                      Unassign Scholar
                    </button>
                  ) : (
                    // Assign button (blue) when no scholar assigned
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
                {/* Send to Scholar Button - only show when status is READY */}
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
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <svg className="w-4 h-4 text-cardozo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-semibold">Source File:</span>
                  <span className="font-mono">{project.parquet_filename}</span>
                  <span className="text-gray-400">•</span>
                  <span>{project.total_cases} cases</span>
                </div>

                {/* AI Model Selection */}
                <div className="flex items-center gap-2 text-sm bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                  <svg className="w-4 h-4 text-cardozo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="font-semibold text-gray-700">AI Model:</span>
                  <select
                    value={project.ai_model}
                    onChange={(e) => handleAIModelChange(e.target.value)}
                    className="px-3 py-1 bg-white border border-blue-300 rounded-md text-gray-900 font-medium focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue"
                  >
                    <option value="GPT-5.2">GPT-5.2</option>
                    <option value="Sonnet 4.5">Sonnet 4.5</option>
                    <option value="Gemini 3.1">Gemini 3.1</option>
                  </select>
                </div>

                {/* API Usage Module */}
                <div className="bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-semibold text-green-900 text-sm">API Usage Tracking</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 text-xs">Total Tokens</div>
                      <div className="font-bold text-green-900">{project.total_tokens_used.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs">Total Cost</div>
                      <div className="font-bold text-green-900">${project.total_cost.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs">Budget</div>
                      <div className="font-bold text-green-900">${project.budget_limit.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  {/* Budget Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Budget Used</span>
                      <span>{((project.total_cost / project.budget_limit) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (project.total_cost / project.budget_limit) > 0.9 
                            ? 'bg-red-600' 
                            : (project.total_cost / project.budget_limit) > 0.7 
                              ? 'bg-yellow-600' 
                              : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min((project.total_cost / project.budget_limit) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons - Scholar */}
        {user?.role === 'scholar' && project?.scholar_id === user?.id && (
          <div className="mb-6">
            {/* Launch Project Button - only show when status is ACTIVE */}
            {project?.status === 'active' && (
              <button
                onClick={handleLaunchProject}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-md mb-4"
              >
                🚀 Launch Project
              </button>
            )}

            {/* Show Parquet filename and AI info if uploaded */}
            {project?.parquet_filename && (
              <div className="space-y-3">
                {/* Parquet File Info */}
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <svg className="w-4 h-4 text-cardozo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-semibold">Source File:</span>
                  <span className="font-mono">{project.parquet_filename}</span>
                  <span className="text-gray-400">•</span>
                  <span>{project.total_cases} cases</span>
                </div>

                {/* AI Model Display (Read-Only) */}
                <div className="flex items-center gap-2 text-sm bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                  <svg className="w-4 h-4 text-cardozo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="font-semibold text-gray-700">AI Model:</span>
                  <span className="px-3 py-1 bg-white border border-blue-300 rounded-md text-gray-900 font-medium">
                    {project.ai_model}
                  </span>
                  <span className="text-xs text-gray-500 italic ml-2">(Set by admin)</span>
                </div>

                {/* API Usage Module */}
                <div className="bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-semibold text-green-900 text-sm">API Usage Tracking</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 text-xs">Total Tokens</div>
                      <div className="font-bold text-green-900">{project.total_tokens_used.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs">Total Cost</div>
                      <div className="font-bold text-green-900">${project.total_cost.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs">Budget</div>
                      <div className="font-bold text-green-900">${project.budget_limit.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  {/* Budget Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Budget Used</span>
                      <span>{((project.total_cost / project.budget_limit) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (project.total_cost / project.budget_limit) > 0.9 
                            ? 'bg-red-600' 
                            : (project.total_cost / project.budget_limit) > 0.7 
                              ? 'bg-yellow-600' 
                              : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min((project.total_cost / project.budget_limit) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {cases.length > 0 && (
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-serif font-bold text-cardozo-dark">
                Select Columns to Display
              </h2>
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
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition"
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
        )}

        <div className="card overflow-hidden p-0">
          {cases.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">No cases found</p>
              <p className="text-sm text-gray-600">Upload a Parquet file to get started</p>
            </div>
          ) : (
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
          )}
        </div>

        {cases.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Showing <span className="font-semibold text-cardozo-dark">{cases.length}</span> court cases
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
    </div>
  );
}