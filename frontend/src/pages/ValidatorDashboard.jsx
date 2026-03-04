import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validatorAPI } from '../api/client';
import Header from '../components/Header';

export default function ValidatorDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'not_started', 'in_progress', 'completed'
  const [markedFilter, setMarkedFilter] = useState('all'); // 'all', 'correct', 'incorrect'
  const [casesData, setCasesData] = useState({}); // Store detailed case data for each module

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const data = await validatorAPI.getMyAssignments();
      setAssignments(data);
      
      // Load detailed case data for each module to enable "marked" filtering
      const casesDataMap = {};
      for (const assignment of data) {
        try {
          const cases = await validatorAPI.getValidationCases(assignment.module_id);
          casesDataMap[assignment.module_id] = cases;
        } catch (err) {
          console.error(`Failed to load cases for module ${assignment.module_id}:`, err);
        }
      }
      setCasesData(casesDataMap);
    } catch (err) {
      console.error('Failed to load assignments:', err);
      alert('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (completed, total) => {
    if (completed === 0) return 'bg-gray-100 text-gray-800';
    if (completed === total) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusText = (completed, total) => {
    if (completed === 0) return 'NOT STARTED';
    if (completed === total) return 'COMPLETED';
    return 'IN PROGRESS';
  };

  // Calculate marked correct/incorrect counts for a module
  const getMarkedCounts = (moduleId) => {
    const cases = casesData[moduleId] || [];
    const validatedCases = cases.filter(c => c.validation);
    const correctCount = validatedCases.filter(c => c.validation.is_correct === true).length;
    const incorrectCount = validatedCases.filter(c => c.validation.is_correct === false).length;
    
    return { correctCount, incorrectCount, hasValidations: validatedCases.length > 0 };
  };

  // Filter assignments based on selected filters
  const filteredAssignments = assignments.filter(assignment => {
    const { completed_cases, total_cases, module_id } = assignment;
    
    // Status filter
    let passesStatusFilter = true;
    if (statusFilter === 'not_started') {
      passesStatusFilter = completed_cases === 0;
    } else if (statusFilter === 'in_progress') {
      passesStatusFilter = completed_cases > 0 && completed_cases < total_cases;
    } else if (statusFilter === 'completed') {
      passesStatusFilter = completed_cases === total_cases;
    }
    
    if (!passesStatusFilter) return false;
    
    // Marked filter
    if (markedFilter !== 'all') {
      const { correctCount, incorrectCount, hasValidations } = getMarkedCounts(module_id);
      
      if (!hasValidations) return false; // No validations yet
      
      if (markedFilter === 'correct') {
        return correctCount > 0;
      } else if (markedFilter === 'incorrect') {
        return incorrectCount > 0;
      }
    }
    
    return true;
  });

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
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold text-cardozo-dark">
            Validator Dashboard
          </h1>
          <div className="w-24 h-1 bg-cardozo-gold mt-2 mb-4"></div>
          <p className="text-gray-600">Review AI-generated analyses for assigned modules</p>
        </div>

        {assignments.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">No Assignments Yet</p>
            <p className="text-sm text-gray-600">
              You haven't been assigned to any modules. Check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <h2 className="text-xl font-serif font-bold text-cardozo-dark">
              Your Assignments
            </h2>

            {/* Filter Bar */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
              <span className="text-sm font-semibold text-gray-700">Filter by:</span>
              
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue"
                >
                  <option value="all">Show All</option>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Marked Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Marked:</label>
                <select
                  value={markedFilter}
                  onChange={(e) => setMarkedFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue"
                >
                  <option value="all">Show All</option>
                  <option value="correct">Marked Correct</option>
                  <option value="incorrect">Marked Incorrect</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {(statusFilter !== 'all' || markedFilter !== 'all') && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setMarkedFilter('all');
                  }}
                  className="ml-auto text-sm text-cardozo-blue hover:text-[#005A94] font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Filtered Results Count */}
            {filteredAssignments.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-600">
                  No assignments match the selected filters.
                </p>
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setMarkedFilter('all');
                  }}
                  className="mt-4 text-sm text-cardozo-blue hover:text-[#005A94] font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Showing {filteredAssignments.length} of {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
                </p>

                {/* Assignment Cards */}
                <div className="space-y-4">
                  {filteredAssignments.map((assignment) => {
                    const { correctCount, incorrectCount } = getMarkedCounts(assignment.module_id);
                    
                    return (
                      <div
                        key={assignment.module_id}
                        className="card hover:shadow-lg transition cursor-pointer"
                        onClick={() => navigate(`/validate/${assignment.module_id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {/* Project and Module Info */}
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-2 py-1 bg-cardozo-blue text-white rounded text-xs font-semibold">
                                Module {assignment.module_number}
                              </span>
                              <h3 className="text-lg font-semibold text-cardozo-dark">
                                {assignment.module_name}
                              </h3>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(assignment.completed_cases, assignment.total_cases)}`}>
                                {getStatusText(assignment.completed_cases, assignment.total_cases)}
                              </span>
                            </div>

                            {/* Project Name */}
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-semibold">Project:</span> {assignment.project_name}
                            </p>

                            {/* Question */}
                            <p className="text-gray-700 mb-3">{assignment.question_text}</p>

                            {/* Progress Bar */}
                            <div className="mb-3">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progress</span>
                                <span className="font-semibold">
                                  {assignment.completed_cases}/{assignment.total_cases} cases ({assignment.progress_percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-cardozo-blue h-2 rounded-full transition-all"
                                  style={{ width: `${assignment.progress_percentage}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex gap-6 text-sm text-gray-600">
                              <span>
                                <span className="font-semibold">Answer Type:</span>{' '}
                                {assignment.answer_type.replace(/_/g, ' ')}
                              </span>
                              {assignment.completed_cases > 0 && (
                                <>
                                  <span>•</span>
                                  <span>
                                    <span className="font-semibold text-green-700">✓ Correct:</span>{' '}
                                    {correctCount}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    <span className="font-semibold text-red-700">✗ Incorrect:</span>{' '}
                                    {incorrectCount}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="ml-4">
                            <button
                              className={`px-4 py-2 rounded-lg font-medium transition ${
                                assignment.completed_cases === 0
                                  ? 'bg-cardozo-gold text-white hover:bg-yellow-600'
                                  : assignment.completed_cases === assignment.total_cases
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-cardozo-blue text-white hover:bg-[#005A94]'
                              }`}
                            >
                              {assignment.completed_cases === 0
                                ? 'Start Validation'
                                : assignment.completed_cases === assignment.total_cases
                                ? 'Review'
                                : 'Continue'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}