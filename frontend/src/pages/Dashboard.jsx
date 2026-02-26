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
      {/* Use Header Component */}
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
              className="btn-primary"
            >
              + Create New Project
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
            projects.map((project) => (
              <div key={project.id} className="card hover:shadow-lg transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-serif font-bold text-cardozo-dark mb-2">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-gray-600 mb-3">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-medium">{project.total_cases} cases</span>
                      <span>·</span>
                      <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                      <span>·</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        project.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {project.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => navigate(`/upload/${project.id}`)}
                        className="px-4 py-2 bg-cardozo-gold text-cardozo-dark rounded-lg hover:bg-[#E5A619] transition font-semibold text-sm"
                      >
                        Upload File
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/view-cases/${project.id}`)}
                      className="btn-primary text-sm"
                    >
                      View Cases
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-serif font-bold text-cardozo-dark mb-6">
              Create New Project
            </h2>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div>
                <label className="label">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="input"
                  placeholder="Purcell Analysis 2024"
                  required
                />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="input"
                  rows="3"
                  placeholder="Analysis of court decisions on Purcell Principle"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">
                  Create Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
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