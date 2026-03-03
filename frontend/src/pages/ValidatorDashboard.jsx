import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validatorAPI } from '../api/client';
import Header from '../components/Header';

export default function ValidatorDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const data = await validatorAPI.getMyAssignments();
      setAssignments(data);
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
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-cardozo-dark">
                Your Assignments ({assignments.length})
              </h2>
            </div>

            {assignments.map((assignment) => (
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

                    {/* Answer Type */}
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>
                        <span className="font-semibold">Answer Type:</span>{' '}
                        {assignment.answer_type.replace(/_/g, ' ')}
                      </span>
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}