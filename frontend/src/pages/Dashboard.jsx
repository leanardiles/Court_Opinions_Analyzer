import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, projectsAPI } from '../api/client';
import Header from '../components/Header';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      
      const projectsData = await projectsAPI.list();
      setProjects(projectsData);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await projectsAPI.create({
        name: newProjectName,
        description: newProjectDesc,
      });
      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      loadData();
    } catch (err) {
      alert('Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${projectName}"?\n\n` +
      `This will permanently delete:\n` +
      `- The project\n` +
      `- All ${projects.find(p => p.id === projectId)?.total_cases || 0} court cases\n` +
      `- All uploaded files\n\n` +
      `This action CANNOT be undone.`
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      await projectsAPI.delete(projectId);
      alert('Project deleted successfully!');
      loadData();
    } catch (err) {
      alert('Failed to delete project: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
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
      <Header user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-serif font-bold text-cardozo-dark">
            {user?.role === 'admin' && 'Project Management'}
            {user?.role === 'scholar' && 'Your Assigned Projects'}
            {user?.role === 'validator' && 'Your Assignments'}
          </h2>
          <div className="w-24 h-1 bg-cardozo-gold mt-2"></div>
        </div>

        {user?.role === 'admin' && (
          <div className="mb-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-cardozo-blue text-white rounded-lg font-medium hover:bg-[#005A94] transition shadow flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Project
            </button>
          </div>
        )}


        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-600 text-lg">
                {user?.role === 'validator' 
                  ? 'No cases assigned yet. Check back later!' 
                  : 'No projects yet. Create one to get started!'}
              </p>
            </div>
          ) : (
            projects.map((project, index) => {
              const colors = [
                { bg: 'bg-blue-50', border: 'border-cardozo-blue' },
                { bg: 'bg-amber-50', border: 'border-cardozo-gold' },
                { bg: 'bg-green-50', border: 'border-green-600' },
                { bg: 'bg-purple-50', border: 'border-purple-600' },
                { bg: 'bg-pink-50', border: 'border-pink-600' },
              ];
              const colorScheme = colors[index % colors.length];

              return (
                <div 
                  key={project.id} 
                  className={`card hover:shadow-lg transition overflow-hidden p-0 ${colorScheme.bg} border-t-4 ${colorScheme.border} relative`}
                >
                  {/* Clickable area - entire card except delete button */}
                  <div 
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="p-6 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* Line 1: Project Name */}
                        <div className="mb-3">
                          <span className="text-sm font-semibold text-gray-600">Project Name:</span>
                          <h3 className="text-xl font-serif font-bold text-cardozo-dark mt-1">
                            {project.name}
                          </h3>
                        </div>

                        {/* Line 2: Project ID */}
                        <div className="mb-3">
                          <span className="text-sm font-semibold text-gray-600">Project ID:</span>
                          <span className="text-sm text-gray-900 ml-2 font-mono">#{project.id}</span>
                        </div>

                        {/* Line 3: Status, Date, Scholar */}
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          {/* Status Badge */}
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-600">Status:</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                              project.status === 'launched' ? 'bg-green-100 text-green-800' :
                              project.status === 'active' ? 'bg-blue-100 text-blue-800' :
                              project.status === 'ready' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {project.status}
                            </span>
                          </div>

                          <span className="text-gray-400">•</span>

                          {/* Date */}
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-600">
                              {project.status === 'launched' ? 'Launched:' : 
                               project.status === 'active' ? 'Sent:' : 
                               'Created:'}
                            </span>
                            <span className="text-gray-900">
                              {project.launched_at ? new Date(project.launched_at).toLocaleDateString() :
                               project.sent_to_scholar_at ? new Date(project.sent_to_scholar_at).toLocaleDateString() :
                               new Date(project.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <span className="text-gray-400">•</span>

                          {/* Scholar */}
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-600">Scholar:</span>
                            {project.scholar_email ? (
                              <span className="text-cardozo-blue font-medium">
                                {project.scholar_email}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Unassigned</span>
                            )}
                          </div>
                        </div>

                        {/* Description (if exists) */}
                        {project.description && (
                          <p className="text-gray-600 mt-3 text-sm">{project.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete button - positioned absolutely */}
                  {user?.role === 'admin' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id, project.name);
                      }}
                      className="absolute top-4 right-4 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-xs"
                    >
                      Delete
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
            <h2 className="text-3xl font-serif font-bold text-cardozo-dark mb-8">
              Create New Project
            </h2>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue transition text-gray-900"
                  placeholder="Purcell Analysis 2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Description (optional)
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue transition text-gray-900 resize-none"
                  rows="4"
                  placeholder="Analysis of court decisions on Purcell Principle"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 bg-cardozo-gold text-cardozo-dark rounded-lg font-semibold hover:bg-[#E5A619] transition shadow-sm"
                >
                  Create Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
