import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, uploadAPI } from '../api/client';
import Header from '../components/Header';

export default function UploadPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const data = await projectsAPI.get(projectId);
      setProject(data);
    } catch (err) {
      setError('Failed to load project');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.parquet')) {
        setError('Please select a .parquet file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setUploadResult(null);

    try {
      const result = await uploadAPI.uploadParquet(projectId, file);
      setUploadResult(result);
      setFile(null);
      document.getElementById('file-input').value = '';
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

return (
  <div className="min-h-screen bg-gray-50">
    <Header user={null} onLogout={null} />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="card">
          <h2 className="text-2xl font-serif font-bold text-cardozo-dark mb-6">
            Select Parquet File
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {uploadResult && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-900 mb-3">Upload Successful!</h3>
                  <div className="space-y-2 text-sm text-green-800">
                    <div className="flex justify-between">
                      <span className="font-medium">File:</span>
                      <span>{uploadResult.filename}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total rows:</span>
                      <span>{uploadResult.total_rows}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Cases imported:</span>
                      <span className="font-bold">{uploadResult.cases_imported}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">File size:</span>
                      <span>{uploadResult.file_size_mb} MB</span>
                    </div>
                    {uploadResult.errors.length > 0 && (
                      <div className="pt-2 border-t border-green-200">
                        <p className="text-orange-700 font-medium">
                          ⚠️ {uploadResult.errors.length} rows had issues
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/view-cases/${projectId}`)}
                    className="btn-primary mt-4 w-full"
                  >
                    View Imported Cases →
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="label">Choose Parquet File (.parquet)</label>
              <input
                id="file-input"
                type="file"
                accept=".parquet"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600
                  file:mr-4 file:py-3 file:px-6
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-cardozo-blue file:text-white
                  hover:file:bg-[#005A94]
                  file:cursor-pointer cursor-pointer
                  border border-gray-100 rounded-lg p-2"
              />
            </div>

            {file && (
              <div className="bg-blue-50 border-2 border-cardozo-blue/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-cardozo-blue rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-cardozo-dark">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading and Processing...
                </span>
              ) : (
                'Upload and Process File'
              )}
            </button>
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-100">
            <h3 className="font-semibold text-cardozo-dark mb-3">What happens next:</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-cardozo-blue text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>The Parquet file will be uploaded to the server</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-cardozo-blue text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>The system will parse all court cases from the file</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-cardozo-blue text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Cases will be imported into the database</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-cardozo-blue text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span>You can then view and analyze the cases</span>
              </li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}