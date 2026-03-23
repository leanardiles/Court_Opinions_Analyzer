import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { modulesAPI } from '../api/client';
import Header from '../components/Header';

export default function ModuleReviewPage({ user, onLogout }) {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrustDialog, setShowTrustDialog] = useState(false);
  const [trusting, setTrusting] = useState(false);

  useEffect(() => {
    loadSummary();
  }, [moduleId]);

  const loadSummary = async () => {
    try {
      const data = await modulesAPI.getValidationSummary(moduleId);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load summary:', err);
      alert('Failed to load validation summary');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleTrustValidator = async () => {
    setTrusting(true);
    try {
      await modulesAPI.trustValidator(moduleId);
      //alert('All corrections approved successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to trust validator:', err);
      alert('Failed to approve corrections: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setTrusting(false);
      setShowTrustDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading validation summary...</div>
      </div>
    );
  }

  const getAccuracyColor = (percentage) => {
    if (percentage >= 80) return 'text-green-700';
    if (percentage >= 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getAccuracyBadge = (percentage) => {
    if (percentage >= 80) return { text: 'High Agreement', color: 'bg-green-100 text-green-800' };
    if (percentage >= 60) return { text: 'Moderate Agreement', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Low Agreement', color: 'bg-red-100 text-red-800' };
  };

  const accuracyBadge = getAccuracyBadge(summary.ai_accuracy_percentage);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-cardozo-blue hover:text-[#005A94] font-medium mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-serif font-bold text-cardozo-dark">
            Module Review
          </h1>
          <div className="w-24 h-1 bg-cardozo-gold mt-2 mb-4"></div>
        </div>

        {/* Module Info */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-cardozo-dark mb-2">
            {summary.module_name}
          </h2>
          <p className="text-gray-700 mb-4">{summary.question_text}</p>
          <p className="text-sm text-gray-600">
            Answer Type: {summary.answer_type.replace(/_/g, ' ')}
          </p>
        </div>

        {/* AI Performance Summary */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-cardozo-dark mb-4">AI Performance Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Total Cases */}
            <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-4xl font-bold text-cardozo-blue mb-2">
                {summary.total_cases}
              </div>
              <div className="text-sm font-semibold text-gray-700">
                Total Cases Analyzed
              </div>
            </div>

            {/* AI Correct */}
            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
              <div className="text-4xl font-bold text-green-700 mb-2">
                {summary.ai_correct}
              </div>
              <div className="text-sm font-semibold text-gray-700">
                AI Correct
              </div>
            </div>

            {/* AI Incorrect */}
            <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
              <div className="text-4xl font-bold text-red-700 mb-2">
                {summary.ai_incorrect}
              </div>
              <div className="text-sm font-semibold text-gray-700">
                AI Incorrect (Corrections)
              </div>
            </div>
          </div>

          {/* Accuracy Bar */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-cardozo-dark">
                  AI Accuracy Rate
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${accuracyBadge.color}`}>
                  {accuracyBadge.text}
                </span>
              </div>
              <span className={`text-3xl font-bold ${getAccuracyColor(summary.ai_accuracy_percentage)}`}>
                {summary.ai_accuracy_percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  summary.ai_accuracy_percentage >= 80
                    ? 'bg-green-600'
                    : summary.ai_accuracy_percentage >= 60
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                }`}
                style={{ width: `${summary.ai_accuracy_percentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              {summary.ai_accuracy_percentage >= 80
                ? '✓ High accuracy - AI performing well with minimal corrections needed'
                : summary.ai_accuracy_percentage >= 60
                ? '⚠ Moderate accuracy - Review corrections and consider Round 2 improvement'
                : '✗ Low accuracy - Significant corrections needed, recommend context revision'}
            </p>
          </div>
        </div>

        {/* Validator Info & Corrections */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-cardozo-dark mb-4">Validator Corrections</h2>
          
          {summary.validator && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    Validator: {summary.validator.email}
                  </p>
                  {summary.validator.past_validations > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Track Record: {summary.validator.past_validations} past validations •{' '}
                      {summary.validator.past_approval_rate}% approval rate
                      {summary.validator.past_approval_rate >= 90 ? ' ⭐⭐⭐⭐⭐' : 
                       summary.validator.past_approval_rate >= 80 ? ' ⭐⭐⭐⭐' : 
                       summary.validator.past_approval_rate >= 70 ? ' ⭐⭐⭐' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Corrections Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">
                {summary.corrections_pending}
              </div>
              <div className="text-xs text-gray-600 mt-1">Pending Review</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">
                {summary.corrections_approved}
              </div>
              <div className="text-xs text-gray-600 mt-1">Approved</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">
                {summary.corrections_rejected}
              </div>
              <div className="text-xs text-gray-600 mt-1">Rejected</div>
            </div>
          </div>

          {/* Action Buttons */}
          {summary.corrections_pending > 0 ? (
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/review-corrections/${moduleId}`)}
                className="w-full px-6 py-3 bg-cardozo-blue text-white rounded-lg font-semibold hover:bg-[#005A94] transition"
              >
                Review {summary.corrections_pending} Correction{summary.corrections_pending !== 1 ? 's' : ''} Individually →
              </button>

              <div className="text-center text-sm text-gray-600">or</div>

              <button
                onClick={() => setShowTrustDialog(true)}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                ✓ Trust Validator - Auto-Approve All {summary.corrections_pending}
              </button>

              <p className="text-xs text-gray-500 text-center mt-2">
                Auto-approve is recommended only if validator has high past approval rate (&gt;90%)
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                All Corrections Reviewed
              </p>
              <p className="text-sm text-gray-600">
                {summary.corrections_approved} approved, {summary.corrections_rejected} rejected
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Trust Validator Confirmation Dialog */}
      {showTrustDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-cardozo-dark mb-4">
              Trust Validator?
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-800 mb-2">
                ⚠️ You are about to auto-approve <span className="font-semibold">{summary.corrections_pending} corrections</span> from this validator.
              </p>
              <p className="text-sm text-gray-700">
                All corrections will be added to the Feedback Library and used to improve AI in Round 2.
              </p>
              {summary.validator && summary.validator.past_approval_rate !== null && (
                <p className="text-sm text-gray-700 mt-2">
                  This validator's past approval rate: <span className="font-semibold">{summary.validator.past_approval_rate}%</span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTrustDialog(false)}
                disabled={trusting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTrustValidator}
                disabled={trusting}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
              >
                {trusting ? 'Approving...' : 'Yes, Trust Validator'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}