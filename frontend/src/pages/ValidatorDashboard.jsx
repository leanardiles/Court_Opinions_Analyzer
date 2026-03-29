import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validatorAPI } from '../api/client';
import Header from '../components/Header';

export default function ValidatorDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState({});

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

  // Group assignments by project
  const groupedByProject = assignments.reduce((acc, assignment) => {
    const key = assignment.project_id;
    if (!acc[key]) {
      acc[key] = {
        project_id: assignment.project_id,
        project_name: assignment.project_name,
        scholar_email: assignment.scholar_email,
        modules: []
      };
    }
    acc[key].modules.push(assignment);
    return acc;
  }, {});

  const projects = Object.values(groupedByProject);

  // Calculate overall progress for a project
  const getProjectProgress = (modules) => {
    const totalCases = modules.reduce((sum, m) => sum + m.total_cases, 0);
    const completedCases = modules.reduce((sum, m) => sum + m.completed_cases, 0);
    return {
      totalCases,
      completedCases,
      percentage: totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0
    };
  };

  const toggleProject = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const getModuleStatusColor = (completed, total) => {
    if (completed === 0) return 'bg-gray-100 text-gray-800';
    if (completed === total) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getModuleStatusText = (completed, total) => {
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

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold text-cardozo-dark">
            Validator Dashboard
          </h1>
          <div className="w-24 h-1 bg-cardozo-gold mt-2 mb-4"></div>
          <p className="text-gray-600">Review AI-generated analyses for assigned modules</p>
        </div>

        {projects.length === 0 ? (
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
            {projects.map((project) => {
              const progress = getProjectProgress(project.modules);
              const isExpanded = expandedProjects[project.project_id] || false;
              const allComplete = progress.percentage === 100;
              const firstIncomplete = project.modules.find(m => m.completed_cases < m.total_cases);
              const targetModule = firstIncomplete || project.modules[0];

              return (
                <div key={project.project_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                  {/* Project Header */}
                  <div className="p-5 flex justify-between items-center gap-4">

                    {/* Left side — clickable to expand */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => toggleProject(project.project_id)}
                    >
                      {/* Project name and status */}
                      <div className="flex items-center gap-3 mb-2">
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <h3 className="text-lg font-serif font-bold text-cardozo-dark">
                          {project.project_name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          allComplete ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {allComplete ? 'COMPLETED' : 'IN PROGRESS'}
                        </span>
                      </div>

                      {/* Scholar email */}
                      {project.scholar_email && (
                        <p className="text-sm text-gray-600 ml-7 mb-3">
                          <span className="font-semibold">Scholar:</span>{' '}
                          <span className="text-cardozo-blue">{project.scholar_email}</span>
                        </p>
                      )}

                      {/* Progress bar */}
                      <div className="ml-7">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{project.modules.length} module{project.modules.length !== 1 ? 's' : ''}</span>
                          <span className="font-semibold">
                            {progress.completedCases}/{progress.totalCases} cases ({progress.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              allComplete ? 'bg-green-500' : 'bg-cardozo-blue'
                            }`}
                            style={{ width: `${progress.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Right side — action button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/validate/${targetModule.module_id}`);
                      }}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition ${
                        progress.percentage === 0
                          ? 'bg-cardozo-gold text-white hover:bg-yellow-600'
                          : allComplete
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-cardozo-blue text-white hover:bg-[#005A94]'
                      }`}
                    >
                      {progress.percentage === 0 ? 'Start' : allComplete ? 'Review' : 'Continue'}
                    </button>
                  </div>

                  {/* Modules — shown when expanded */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {project.modules.map((module, index) => (
                        <div
                          key={module.module_id}
                          className={`p-5 bg-gray-50 ${index < project.modules.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              {/* Module header */}
                              <div className="flex items-center gap-3 mb-2">
                                <span className="px-2 py-0.5 bg-cardozo-blue text-white rounded text-xs font-semibold">
                                  Module {module.module_number}
                                </span>
                                <h4 className="font-semibold text-cardozo-dark">
                                  {module.module_name}
                                </h4>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getModuleStatusColor(module.completed_cases, module.total_cases)}`}>
                                  {getModuleStatusText(module.completed_cases, module.total_cases)}
                                </span>
                              </div>

                              {/* Question */}
                              <p className="text-sm text-gray-700 mb-3">{module.question_text}</p>

                              {/* Stats */}
                              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                <span>
                                  <span className="font-semibold">Answer type:</span>{' '}
                                  {module.answer_type.replace(/_/g, ' ')}
                                </span>
                                <span>•</span>
                                <span>
                                  <span className="font-semibold">Progress:</span>{' '}
                                  {module.completed_cases}/{module.total_cases} cases
                                </span>
                              </div>

                              {/* Module progress bar */}
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    module.completed_cases === module.total_cases
                                      ? 'bg-green-500'
                                      : 'bg-cardozo-blue'
                                  }`}
                                  style={{ width: `${module.progress_percentage}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Module action button */}
                            <div className="flex-shrink-0">
                              <button
                                onClick={() => navigate(`/validate/${module.module_id}`)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                                  module.completed_cases === 0
                                    ? 'bg-cardozo-gold text-white hover:bg-yellow-600'
                                    : module.completed_cases === module.total_cases
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-cardozo-blue text-white hover:bg-[#005A94]'
                                }`}
                              >
                                {module.completed_cases === 0
                                  ? 'Start'
                                  : module.completed_cases === module.total_cases
                                  ? 'Review'
                                  : 'Continue'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}