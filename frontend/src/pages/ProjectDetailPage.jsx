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
                {project?.scholar_id && (
                <>
                    <span>·</span>
                    <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-cardozo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium text-cardozo-blue">
                        Scholar: {scholars.find(s => s.id === project.scholar_id)?.email || 
                                scholars.find(s => s.id === project.scholar_id)?.full_name || 
                                'Assigned'}
                    </span>
                    </span>
                </>
                )}
            </div>
        </div>

        {user?.role === 'admin' && (
          <div className="mb-6 flex gap-3">
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
            <button
              onClick={loadScholars}
              disabled={loadingScholars}
              className="px-4 py-2 bg-cardozo-blue text-white rounded-lg font-medium hover:bg-[#005A94] transition shadow text-sm disabled:opacity-50"
            >
              {loadingScholars ? 'Loading...' : 'Assign Scholar'}
            </button>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableColumns.map((column) => (
                <label
                  key={column}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition"
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