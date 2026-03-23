import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { modulesAPI } from '../api/client';
import Header from '../components/Header';

export default function CorrectionReviewPage({ user, onLogout }) {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  const [corrections, setCorrections] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [decision, setDecision] = useState(null); // 'approve' or 'reject'
  const [scholarNotes, setScholarNotes] = useState('');

  useEffect(() => {
    loadCorrections();
  }, [moduleId]);

  useEffect(() => {
    // Load existing decision when changing corrections
    if (corrections.length > 0) {
      loadExistingDecision();
    }
  }, [currentIndex, corrections]);

  const loadCorrections = async () => {
    try {
      const data = await modulesAPI.getCorrections(moduleId);
      // Filter only pending corrections
      const pending = data.filter(c => !c.scholar_reviewed);
      setCorrections(pending);
      
      if (pending.length === 0) {
        alert('No corrections to review');
        navigate(`/module-review/${moduleId}`);
      }
    } catch (err) {
      console.error('Failed to load corrections:', err);
      alert('Failed to load corrections');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingDecision = () => {
    const current = corrections[currentIndex];
    if (current?.scholar_reviewed) {
      setDecision(current.scholar_approved ? 'approve' : 'reject');
      setScholarNotes(current.scholar_notes || '');
    } else {
      setDecision(null);
      setScholarNotes('');
    }
  };

  const handleSaveAndNext = async () => {
    if (!decision) {
      alert('Please approve or reject this correction');
      return;
    }

    setSaving(true);
    try {
      const current = corrections[currentIndex];
      
      await modulesAPI.reviewCorrection(
        moduleId,
        current.validation_id,
        decision === 'approve',
        scholarNotes || null
      );

      // Move to next or complete
      if (currentIndex < corrections.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        //alert('All corrections reviewed!');
        navigate(`/module-review/${moduleId}`);
      }
    } catch (err) {
      console.error('Failed to save review:', err);
      alert('Failed to save review: ' + (err.response?.data?.detail || 'Unknown error'));
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
    if (currentIndex < corrections.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentCorrection = corrections[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading corrections...</div>
      </div>
    );
  }

  if (!currentCorrection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">No corrections to review</p>
          <button
            onClick={() => navigate(`/module-review/${moduleId}`)}
            className="px-4 py-2 bg-cardozo-blue text-white rounded-lg hover:bg-[#005A94]"
          >
            Back to Summary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <button
                onClick={() => navigate(`/module-review/${moduleId}`)}
                className="text-cardozo-blue hover:text-[#005A94] font-medium mb-2 flex items-center gap-2"
              >
                ← Back to Summary
              </button>
              <h1 className="text-2xl font-serif font-bold text-cardozo-dark">
                Review Corrections
              </h1>
              <p className="text-sm text-gray-600">
                Correction {currentIndex + 1} of {corrections.length}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span className="font-semibold">
                {currentIndex + 1}/{corrections.length} ({Math.round(((currentIndex + 1) / corrections.length) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-cardozo-blue h-2 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / corrections.length) * 100}%` }}
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
              disabled={currentIndex === corrections.length - 1}
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
              <p className="text-gray-900">{currentCorrection.case_name}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Court:</span>
              <p className="text-gray-900">{currentCorrection.court || 'N/A'}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Date:</span>
              <p className="text-gray-900">
                {currentCorrection.case_date 
                  ? new Date(currentCorrection.case_date).toLocaleDateString() 
                  : 'N/A'}
              </p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">State:</span>
              <p className="text-gray-900">{currentCorrection.state || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* AI Analysis */}
          <div className="card bg-blue-50 border-blue-200">
            <h2 className="text-lg font-semibold text-cardozo-dark mb-4">🤖 AI's Answer</h2>
            
            <div className="space-y-4">
              <div>
                <span className="font-semibold text-gray-700">Answer:</span>
                <p className="text-lg text-cardozo-blue font-medium mt-1">
                  {currentCorrection.ai_answer}
                </p>
              </div>

              <div>
                <span className="font-semibold text-gray-700">Reasoning:</span>
                <p className="text-gray-900 mt-1 bg-white p-3 rounded-lg">
                  {currentCorrection.ai_reasoning}
                </p>
              </div>

              <div>
                <span className="font-semibold text-gray-700">Confidence:</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${currentCorrection.ai_confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(currentCorrection.ai_confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Validator Correction */}
          <div className="card bg-purple-50 border-purple-200">
            <h2 className="text-lg font-semibold text-cardozo-dark mb-4">👤 Validator's Correction</h2>
            
            <div className="space-y-4">
              <div>
                <span className="font-semibold text-gray-700">Corrected Answer:</span>
                <p className="text-lg text-purple-700 font-medium mt-1">
                  {currentCorrection.validator_correction}
                </p>
              </div>

              <div>
                <span className="font-semibold text-gray-700">Validator's Reasoning:</span>
                <p className="text-gray-900 mt-1 bg-white p-3 rounded-lg">
                  {currentCorrection.validator_reasoning}
                </p>
              </div>

              {currentCorrection.validator_notes && (
                <div>
                  <span className="font-semibold text-gray-700">Additional Notes:</span>
                  <p className="text-gray-900 mt-1 bg-white p-3 rounded-lg">
                    {currentCorrection.validator_notes}
                  </p>
                </div>
              )}

              <div className="text-sm text-gray-600">
                <span className="font-semibold">Validator:</span> {currentCorrection.validator_email}
              </div>
            </div>
          </div>
        </div>

        {/* Scholar Decision */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-cardozo-dark mb-4">Your Decision</h2>

          {/* Decision Buttons */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Do you approve the validator's correction?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDecision('approve')}
                className={`flex-1 py-4 rounded-lg font-semibold transition ${
                  decision === 'approve'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">✓</span>
                  <span>Approve Correction</span>
                  <span className="text-xs opacity-75">
                    Validator is right, AI was wrong
                  </span>
                </div>
              </button>
              <button
                onClick={() => setDecision('reject')}
                className={`flex-1 py-4 rounded-lg font-semibold transition ${
                  decision === 'reject'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">✗</span>
                  <span>Reject Correction</span>
                  <span className="text-xs opacity-75">
                    AI was actually correct
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={scholarNotes}
              onChange={(e) => setScholarNotes(e.target.value)}
              placeholder="Add any comments about your decision..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cardozo-blue focus:border-cardozo-blue"
            />
          </div>

          {/* Info Box */}
          {decision === 'approve' && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✓ This correction will be added to the Feedback Library and used to improve AI accuracy in Round 2.
              </p>
            </div>
          )}

          {decision === 'reject' && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                ✗ This correction will not be used for AI improvement. The AI's original answer was correct.
              </p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveAndNext}
            disabled={saving || !decision}
            className="px-6 py-3 bg-cardozo-gold text-white rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Saving...' : currentIndex === corrections.length - 1 ? 'Save & Complete' : 'Save & Next Correction'}
          </button>
        </div>
      </main>
    </div>
  );
}