import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, casesAPI } from '../api/client';
import Header from '../components/Header';

export default function ViewCasesPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
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

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const [projectData, casesData] = await Promise.all([
        projectsAPI.get(projectId),
        casesAPI.list(projectId),
      ]);
      
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
        <div className="text-xl text-gray-600">Loading cases...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header user={null} onLogout={null} />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Title - ADD THIS */}
        <div className="mb-6">
            <button
            onClick={() => navigate('/dashboard')}
            className="text-cardozo-blue hover:text-[#005A94] mb-3 font-medium"
            >
            ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-serif font-bold text-cardozo-dark">
            View Cases
            </h1>
            {project && (
            <p className="text-gray-600 mt-2">
                {project.name} · {cases.length} cases
            </p>
            )}
            <div className="w-24 h-1 bg-cardozo-gold mt-2"></div>
        </div>
        {/* Column Selector */}
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
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-cardozo-dark">{selectedColumns.length}</span> of {availableColumns.length} columns selected
            </p>
          </div>
        </div>

        {/* Cases Table */}
        <div className="card overflow-hidden p-0">
          {cases.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">No cases found</p>
              <p className="text-sm text-gray-600">Upload a Parquet file to see cases here</p>
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

        {/* Summary Footer */}
        {cases.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Showing <span className="font-semibold text-cardozo-dark">{cases.length}</span> court cases
          </div>
        )}
      </main>
    </div>
  );
}