import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { validatorAPI, modulesAPI, projectsAPI } from '../api/client';
import Header from '../components/Header';

export default function ValidationPage({ user, onLogout }) {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  const [module, setModule] = useState(null);
  const [project, setProject] = useState(null);
  const [cases, setCases] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Validation form state
  const [decision, setDecision] = useState(null); // 'correct' or 'incorrect'
  const [correctedAnswer, setCorrectedAnswer] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [notes, setNotes] = useState('');
  
  const [showContextModal, setShowContextModal] = useState(false);
  const [projectContext, setProjectContext] = useState('');

  useEffect(() => {
    loadData();
  }, [moduleId]);

  useEffect(() => {
    // Load existing validation when changing cases
    if (cases.length > 0) {
      loadExistingValidation();
    }
  }, [currentIndex, cases]);

  const loadData = async () => {
    try {
      // Load module details
      const moduleData = await modulesAPI.getModule(moduleId);
      setModule(moduleData);

      // Load project
      const projectData = await projectsAPI.get(moduleData.project_id);
      setProject(projectData);

      // Load project context
      try {
        const contextData = await projectsAPI.getContext(moduleData.project_id);
        setProjectContext(contextData.context_text || '');
      } catch (err) {
        console.log('No project context');
      }

      // Load cases for validation
      const casesData = await validatorAPI.getValidationCases(moduleId);
      setCases(casesData);
    } catch (err) {
      console.error('Failed to load data:', err);
      alert('Failed to load validation data');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingValidation = () => {
    const currentCase = cases[currentIndex];
    if (currentCase?.validation) {
      // Load saved validation
      setDecision(currentCase.validation.is_correct ? 'correct' : 'incorrect');
      setCorrectedAnswer(currentCase.validation.corrected_answer || '');
      setReasoning(currentCase.validation.validator_reasoning || '');
      setNotes(currentCase.validation.validator_notes || '');
    } else {
      // Reset form
      setDecision(null);
      setCorrectedAnswer('');
      setReasoning('');
      setNotes('');
    }
  };

  const handleSaveAndNext = async () => {
    if (!decision) {
      alert('Please mark the AI answer as correct or incorrect');
      return;
    }

    if (decision === 'incorrect' && !correctedAnswer.trim()) {
      alert('Please provide the correct answer');
      return;
    }

    if (decision === 'incorrect' && !reasoning.trim()) {
      alert('Please explain why the AI answer is incorrect');
      return;
    }

    setSaving(true);
    try {
      const currentCase = cases[currentIndex];
      
      await validatorAPI.submitValidation(moduleId, currentCase.case_id, {
        is_correct: decision === 'correct',
        corrected_answer: decision === 'incorrect' ? correctedAnswer : null,
        validator_reasoning: decision === 'incorrect' ? reasoning : null,
        validator_notes: notes || null
      });

      // Reload cases to update validation status
      const updatedCases = await validatorAPI.getValidationCases(moduleId);
      setCases(updatedCases);

      // Move to next case or show completion
      if (currentIndex < cases.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // All cases completed - navigate to completion summary
        navigate(`/validation-complete/${moduleId}`);
      }

    } catch (err) {
      console.error('Failed to save validation:', err);
      alert('Failed to save validation: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < cases.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentCase = cases[currentIndex];
  const completedCount = cases.filter(c => c.validation).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading validation interface...</div>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">No cases to validate</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-cardozo-blue text-white rounded-lg hover:bg-[#005A94]"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-serif font-bold text-cardozo-dark">
                {module?.module_name}
              </h1>
              <p className="text-sm text-gray-600">
                {project?.name} • Case {currentIndex + 1} of {cases.length}
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span className="font-semibold">
                {completedCount}/{cases.length} completed ({Math.round((completedCount / cases.length) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-cardozo-blue h-2 rounded-full transition-all"
                style={{ width: `${(completedCount / cases.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ← Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === cases.length - 1}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Case Information */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-cardozo-dark mb-4">Case Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Case Name:</span>
              <p className="text-gray-900">{currentCase.case_name}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Court:</span>
              <p className="text-gray-900">{currentCase.court || 'N/A'}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Date:</span>
              <p className="text-gray-900">
                {currentCase.case_date 
                  ? new Date(currentCase.case_date).toLocaleDateString() 
                  : 'N/A'}
              </p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">State:</span>
              <p className="text-gray-900">{currentCase.state || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Research Question */}
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-semibold text-cardozo-dark">Research Question</h2>
            <button
              onClick={() => setShowContextModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition flex-shrink-0"
            >
              📄 View Context
            </button>
          </div>
          <p className="text-gray-900 font-medium">{module?.question_text}</p>
          <p className="text-sm text-gray-600 mt-2">
            Answer Type: {module?.answer_type.replace(/_/g, ' ')}
          </p>
        </div>

        {/* AI Analysis */}
        {currentCase.ai_analysis && (
          <div className="card mb-6">
            <div className="space-y-6">
              {/* AI Answer and Confidence - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* AI Answer - 2/3 width */}
                <div className="md:col-span-2">
                  <h2 className="text-lg font-semibold text-cardozo-dark mb-2">AI's Answer</h2>
                  <p className="text-lg text-cardozo-blue font-medium">
                    {currentCase.ai_analysis.ai_answer}
                  </p>
                </div>

                {/* Confidence - 1/3 width */}
                <div className="md:col-span-1">
                  <h2 className="text-lg font-semibold text-cardozo-dark mb-2">Confidence</h2>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${currentCase.ai_analysis.ai_confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(currentCase.ai_analysis.ai_confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Reasoning - Full Width Below */}
              <div>
                <h2 className="text-lg font-semibold text-cardozo-dark mb-2">AI's Reasoning</h2>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {currentCase.ai_analysis.ai_reasoning}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Validation Decision */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-cardozo-dark mb-4">Your Validation</h2>

          {/* Decision Buttons */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">Is the AI's answer correct?</p>
            <div className="flex gap-4">
              <button
                onClick={() => setDecision('correct')}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  decision === 'correct'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✓ Correct
              </button>
              <button
                onClick={() => setDecision('incorrect')}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  decision === 'incorrect'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✗ Incorrect
              </button>
            </div>
          </div>

          {/* Correction Form (only if incorrect) */}
          {decision === 'incorrect' && (
            <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correct Answer *
                </label>
                {module?.answer_type === 'multiple_choice' ? (
                  <select
                    value={correctedAnswer}
                    onChange={(e) => setCorrectedAnswer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue"
                  >
                    <option value="">Select correct answer...</option>
                    {module?.answer_options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={correctedAnswer}
                    onChange={(e) => setCorrectedAnswer(e.target.value)}
                    placeholder="Enter the correct answer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Reasoning *
                </label>
                <textarea
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  placeholder="Explain why this is the correct answer and what the AI got wrong..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue"
                />
              </div>
            </div>
          )}

          {/* Additional Notes (optional for both correct/incorrect) */}
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional observations or comments..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveAndNext}
            disabled={saving || !decision}
            className="px-6 py-3 bg-cardozo-gold text-white rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Saving...' : currentIndex === cases.length - 1 ? 'Save & Complete' : 'Save & Next Case'}
          </button>
        </div>
      </main>

      {/* Context Modal */}
      {showContextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-serif font-bold text-cardozo-dark">
                Project & Module Context
              </h2>
              <button
                onClick={() => setShowContextModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Project Context */}
              {projectContext && (
                <div>
                  <h3 className="text-lg font-semibold text-cardozo-dark mb-2">
                    📄 Project Context
                  </h3>
                  <div className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {projectContext}
                  </div>
                </div>
              )}

              {/* Module Context */}
              {module?.module_context && (
                <div>
                  <h3 className="text-lg font-semibold text-cardozo-dark mb-2">
                    📋 Module-Specific Context
                  </h3>
                  <div className="whitespace-pre-wrap text-gray-800 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    {module.module_context}
                  </div>
                </div>
              )}

              {!projectContext && !module?.module_context && (
                <p className="text-gray-600 text-center py-8">No context provided for this project or module.</p>
              )}
            </div>

            <div className="border-t p-4">
              <button
                onClick={() => setShowContextModal(false)}
                className="w-full px-6 py-2.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}