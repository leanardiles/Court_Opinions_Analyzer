import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { modulesAPI, authAPI, projectsAPI } from '../api/client';
import Header from '../components/Header';

export default function ModuleDetailPage({ user, onLogout }) {
  const { projectId, moduleId } = useParams();
  const navigate = useNavigate();

  const [module, setModule] = useState(null);
  const [project, setProject] = useState(null);
  const [assignment, setAssignment] = useState({});
  const [loading, setLoading] = useState(true);

  // Validator modal
  const [validators, setValidators] = useState([]);
  const [showValidatorModal, setShowValidatorModal] = useState(false);

  // Module context modal
  const [showModuleContextModal, setShowModuleContextModal] = useState(false);
  const [moduleContextText, setModuleContextText] = useState('');
  const [savingModuleContext, setSavingModuleContext] = useState(false);

  useEffect(() => {
    loadData();
  }, [moduleId]);

  const loadData = async () => {
    try {
      const [moduleData, projectData, assignmentData] = await Promise.all([
        modulesAPI.get(moduleId),
        projectsAPI.get(projectId),
        modulesAPI.getAssignments(moduleId),
      ]);
      setModule(moduleData);
      setProject(projectData);
      setAssignment(assignmentData);
    } catch (err) {
      console.error('Failed to load module:', err);
      alert('Failed to load module data');
      navigate(`/project/${projectId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchModule = async () => {
    if (!window.confirm(
      'Launch this module?\n\n' +
      'This will:\n' +
      '1. Sample cases for validation\n' +
      '2. Run AI analysis using the selected AI provider\n\n' +
      'This action cannot be undone.'
    )) return;

    try {
      await modulesAPI.launchModule(moduleId);
      await loadData();
    } catch (err) {
      alert('Failed to launch module: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleOpenValidatorModal = async () => {
    try {
      const validatorList = await authAPI.getValidators();
      setValidators(validatorList);
      setShowValidatorModal(true);
    } catch (err) {
      alert('Failed to load validators: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleAssignValidator = async (validatorId) => {
    try {
      await modulesAPI.assignValidator(moduleId, validatorId);
      setShowValidatorModal(false);
      await loadData();
    } catch (err) {
      alert('Failed to assign validator: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleDeleteModule = async () => {
    const moduleName = module.module_name;
    const moduleStatus = module.status;

    if (['draft', 'sampling_complete'].includes(moduleStatus)) {
      if (!window.confirm(
        `Are you sure you want to delete "${moduleName}"?\n\n` +
        `This will permanently delete the module and all its data.\n\n` +
        `This action CANNOT be undone.`
      )) return;
    } else if (moduleStatus === 'validation_in_progress') {
      const firstConfirm = window.confirm(
        `⚠️ WARNING: Validation is currently in progress for "${moduleName}".\n\n` +
        `Deleting this module will permanently destroy:\n` +
        `- All sampled cases\n` +
        `- All AI analyses\n` +
        `- All validator assignments\n` +
        `- Any validations already submitted by the validator\n\n` +
        `Are you sure you want to continue?`
      );
      if (!firstConfirm) return;
      const secondConfirm = window.confirm(
        `🛑 FINAL WARNING\n\nThis CANNOT be undone. Are you absolutely sure?`
      );
      if (!secondConfirm) return;
    } else if (['validation_complete', 'corrections_reviewed', 'completed'].includes(moduleStatus)) {
      window.alert(
        `🔒 Cannot delete "${moduleName}".\n\n` +
        `This module has completed validation and its data has research value.\n\n` +
        `If you really need to delete it, please contact your administrator.`
      );
      return;
    } else {
      if (!window.confirm(`Are you sure you want to delete "${moduleName}"?\n\nThis action CANNOT be undone.`)) return;
    }

    try {
      await modulesAPI.delete(moduleId);
      navigate(`/project/${projectId}`);
    } catch (err) {
      alert('Failed to delete module: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleCloneModule = async () => {
    try {
      navigate(`/project/${projectId}`);
    } catch (err) {
      alert('Failed to clone module: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleSaveModuleContext = async () => {
    setSavingModuleContext(true);
    try {
      await modulesAPI.update(moduleId, { module_context: moduleContextText });
      await loadData();
      setShowModuleContextModal(false);
    } catch (err) {
      alert('Failed to save context: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setSavingModuleContext(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  const isEditable = ['draft', 'sampling_complete'].includes(module?.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Back button */}
        <button
          onClick={() => navigate(`/project/${projectId}`)}
          className="text-cardozo-blue hover:text-[#005A94] mb-4 font-medium flex items-center gap-1"
        >
          ← Back to Project
        </button>

        {/* Module Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="px-2 py-1 bg-cardozo-blue text-white rounded text-sm font-semibold">
              Module {module.module_number}
            </span>
            <h1 className="text-3xl font-serif font-bold text-cardozo-dark">
              {module.module_name}
            </h1>
            <span className={`px-3 py-1 rounded text-sm font-semibold ${
              module.status === 'draft' ? 'bg-gray-100 text-gray-800' :
              module.status === 'validation_in_progress' ? 'bg-blue-100 text-blue-800' :
              module.status === 'validation_complete' ? 'bg-green-100 text-green-800' :
              module.status === 'corrections_reviewed' ? 'bg-purple-100 text-purple-800' :
              module.status === 'completed' ? 'bg-gray-100 text-gray-600' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {module.status.replace(/_/g, ' ').toUpperCase()}
            </span>
            {module.ai_round > 1 && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm font-semibold">
                Round {module.ai_round}
              </span>
            )}
          </div>
          <div className="w-24 h-1 bg-cardozo-gold mt-2 mb-4"></div>
          <p className="text-sm text-gray-500">
            Project: <span className="font-medium text-cardozo-dark">{project?.name}</span>
          </p>
        </div>

        {/* Delete button — top right */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleDeleteModule}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm"
          >
            🗑️ Delete Module
          </button>
        </div>

        {/* Research Question */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-cardozo-dark mb-2">Research Question</h2>
          <p className="text-gray-900 font-semibold text-lg mb-4">{module.question_text}</p>

          {/* Module Context */}
          {module.module_context ? (
            <div>
              <button
                onClick={() => {
                  setModuleContextText(module.module_context || '');
                  setShowModuleContextModal(true);
                }}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                {isEditable ? '✏️ View / Edit Module Context' : '📄 View Module Context'}
              </button>
            </div>
          ) : (
            isEditable && (
              <button
                onClick={() => {
                  setModuleContextText('');
                  setShowModuleContextModal(true);
                }}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                + Add Module Context
              </button>
            )
          )}
        </div>

        {/* Module Configuration */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-cardozo-dark mb-4">Configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-600 block mb-1">Answer Type</span>
              <span className="text-gray-900">{module.answer_type.replace(/_/g, ' ')}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600 block mb-1">Sample Size</span>
              <span className="text-gray-900">{module.sample_size} cases</span>
            </div>
            <div>
              <span className="font-semibold text-gray-600 block mb-1">AI Provider</span>
              <span className="text-gray-900">{module.ai_provider}</span>
            </div>
            {module.answer_options && (
              <div>
                <span className="font-semibold text-gray-600 block mb-1">Answer Options</span>
                <span className="text-gray-900">{module.answer_options.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Validator & Progress */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-cardozo-dark mb-4">Validation Progress</h2>
          
          <div className="flex items-center gap-6 text-sm mb-4">
            {assignment.sampled ? (
              <span className="flex items-center gap-1 text-green-700 font-medium">
                ✓ {assignment.sample_count} cases sampled
              </span>
            ) : (
              <span className="text-gray-500 italic">Not sampled yet</span>
            )}
            <span className="text-gray-300">•</span>
            {assignment.validator ? (
              <span className="flex items-center gap-1 text-purple-700 font-medium">
                👤 Validator: {assignment.validator.email}
              </span>
            ) : (
              <span className="text-gray-500 italic">No validator assigned</span>
            )}
          </div>

          {/* Progress bar — when sampled */}
          {assignment.sampled && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Validator progress</span>
                <span className="font-semibold">
                  {assignment.completed_cases}/{assignment.sample_count} cases ({Math.round((assignment.completed_cases / assignment.sample_count) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-cardozo-blue h-2 rounded-full transition-all"
                  style={{ width: `${Math.round((assignment.completed_cases / assignment.sample_count) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap mt-4">

            {/* DRAFT: Assign Validator */}
            {module.status === 'draft' && !assignment.validator && (
              <button
                onClick={handleOpenValidatorModal}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
              >
                👤 Assign Validator
              </button>
            )}

            {/* DRAFT: Launch Module */}
            {module.status === 'draft' && assignment.validator && (
              <button
                onClick={handleLaunchModule}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                🚀 Launch Module
              </button>
            )}

            {/* VALIDATION IN PROGRESS */}
            {module.status === 'validation_in_progress' && (
              <>
                {!assignment.validator_finished && (
                  <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded text-sm font-medium">
                    ⏳ Waiting for validator ({assignment.completed_cases}/{assignment.sample_count} cases)
                  </span>
                )}
                {assignment.validator_finished && assignment.corrections_pending > 0 && (
                  <button
                    onClick={() => navigate(`/module-review/${moduleId}`)}
                    className="px-4 py-2 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 transition"
                  >
                    📊 Review Corrections ({assignment.corrections_pending})
                  </button>
                )}
                {assignment.validator_finished && assignment.corrections_pending === 0 && (
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded text-sm font-medium">
                    ✓ AI was 100% accurate
                  </span>
                )}
              </>
            )}

            {/* VALIDATION COMPLETE */}
            {module.status === 'validation_complete' && (
              <div className="w-full bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-green-800 font-semibold">
                  ✓ Validation complete — Round {module.ai_round}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/project/${projectId}/module/${moduleId}/results/${module.ai_round}`)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                  >
                    📊 View Results
                  </button>
                  {assignment.corrections_pending > 0 && (
                    <button
                      onClick={() => navigate(`/module-review/${moduleId}`)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                    >
                      Review Corrections ({assignment.corrections_pending})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* CORRECTIONS REVIEWED */}
            {module.status === 'corrections_reviewed' && (
              <div className="w-full bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-blue-800 font-semibold">
                  ✓ Corrections reviewed — Ready for next step
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/project/${projectId}/module/${moduleId}/results/${module.ai_round}`)}
                    className="px-4 py-2 bg-cardozo-blue text-white rounded-lg text-sm font-medium hover:bg-[#005A94] transition"
                  >
                    📊 View Results
                  </button>
                </div>
              </div>
            )}

            {/* COMPLETED */}
            {module.status === 'completed' && (
              <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-700 font-semibold">
                  ✓ Module completed
                </span>
                <button
                  onClick={() => navigate(`/project/${projectId}/module/${moduleId}/results/${module.ai_round}`)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition"
                >
                  📊 View Results
                </button>
              </div>
            )}

            {/* Clone — always visible */}
            <button
              onClick={() => navigate(`/project/${projectId}`)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium text-sm"
            >
              📋 Clone Module
            </button>

          </div>
        </div>

      </main>

      {/* Validator Assignment Modal */}
      {showValidatorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-serif font-bold text-cardozo-dark mb-6">
              Assign Validator
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select a validator to verify{' '}
              <span className="font-semibold">{module.module_name}</span>
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
              onClick={() => setShowValidatorModal(false)}
              className="w-full px-6 py-2.5 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Module Context Modal */}
      {showModuleContextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl my-8">
            <h2 className="text-2xl font-serif font-bold text-cardozo-dark mb-2">
              Module Context
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              <span className="font-semibold">{module.module_name}</span>
              {' · '}
              {isEditable
                ? 'Editable — module not yet launched'
                : '🔒 Read-only — module already launched'}
            </p>
            <textarea
              value={moduleContextText}
              onChange={(e) => setModuleContextText(e.target.value)}
              disabled={!isEditable}
              placeholder="Provide specific guidance for this question... (Markdown supported)"
              rows={16}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 font-mono text-sm disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed"
            />
            <div className="flex gap-3 mt-6">
              {isEditable ? (
                <>
                  <button
                    onClick={handleSaveModuleContext}
                    disabled={savingModuleContext}
                    className="flex-1 px-6 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {savingModuleContext ? 'Saving...' : 'Save Context'}
                  </button>
                  <button
                    onClick={() => setShowModuleContextModal(false)}
                    className="flex-1 px-6 py-2.5 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowModuleContextModal(false)}
                  className="w-full px-6 py-2.5 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition"
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