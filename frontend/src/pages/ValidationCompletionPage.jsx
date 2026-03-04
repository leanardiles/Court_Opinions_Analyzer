import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { validatorAPI, modulesAPI } from '../api/client';
import Header from '../components/Header';

export default function ValidationCompletionPage({ user, onLogout }) {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompletionStats();
  }, [moduleId]);

  const loadCompletionStats = async () => {
    try {
      // Load module details
      const moduleData = await modulesAPI.getModule(moduleId);
      setModule(moduleData);

      // Load validation cases to calculate statistics
      const cases = await validatorAPI.getValidationCases(moduleId);
      
      const totalCases = cases.length;
      const completedCases = cases.filter(c => c.validation).length;
      const correctCount = cases.filter(c => c.validation?.is_correct === true).length;
      const incorrectCount = cases.filter(c => c.validation?.is_correct === false).length;
      
      setStats({
        totalCases,
        completedCases,
        correctCount,
        incorrectCount,
        accuracyPercentage: totalCases > 0 ? Math.round((correctCount / totalCases) * 100) : 0
      });
    } catch (err) {
      console.error('Failed to load completion stats:', err);
      alert('Failed to load completion statistics');
    } finally {
      setLoading(false);
    }
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

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif font-bold text-cardozo-dark mb-2">
            Validation Complete!
          </h1>
          <p className="text-gray-600">
            You've successfully completed all cases for this module
          </p>
        </div>

        {/* Module Info */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-cardozo-dark mb-2">
            {module?.module_name}
          </h2>
          <p className="text-gray-700 mb-4">{module?.question_text}</p>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>
              <span className="font-semibold">Answer Type:</span>{' '}
              {module?.answer_type.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Statistics */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-cardozo-dark mb-6">
            Validation Summary
          </h2>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Total Cases */}
            <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-4xl font-bold text-cardozo-blue mb-2">
                {stats?.totalCases}
              </div>
              <div className="text-sm font-semibold text-gray-700">
                Total Cases Reviewed
              </div>
            </div>

            {/* Correct */}
            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
              <div className="text-4xl font-bold text-green-700 mb-2">
                {stats?.correctCount}
              </div>
              <div className="text-sm font-semibold text-gray-700">
                AI Correct
              </div>
            </div>

            {/* Incorrect */}
            <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
              <div className="text-4xl font-bold text-red-700 mb-2">
                {stats?.incorrectCount}
              </div>
              <div className="text-sm font-semibold text-gray-700">
                AI Incorrect (Corrected)
              </div>
            </div>
          </div>

          {/* AI Accuracy */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-cardozo-dark">
                AI Accuracy Rate
              </h3>
              <span className="text-2xl font-bold text-cardozo-blue">
                {stats?.accuracyPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  stats?.accuracyPercentage >= 90
                    ? 'bg-green-600'
                    : stats?.accuracyPercentage >= 70
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                }`}
                style={{ width: `${stats?.accuracyPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {stats?.accuracyPercentage >= 90
                ? '🎉 Excellent AI performance! Very few corrections needed.'
                : stats?.accuracyPercentage >= 70
                ? '✓ Good AI performance with some corrections provided.'
                : '⚠️ AI needed significant corrections. Your feedback will help improve Round 2!'}
            </p>
          </div>
        </div>

        {/* Impact Message */}
        <div className="card mb-6 bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">
                Your Corrections Make a Difference!
              </h3>
              <p className="text-sm text-purple-800">
                The {stats?.incorrectCount} correction{stats?.incorrectCount !== 1 ? 's' : ''} you provided will be reviewed by the scholar 
                and, if approved, will be used to improve the AI's accuracy in future rounds. 
                Your expert feedback is essential for creating a more reliable legal research tool.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/validate/' + moduleId)}
            className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            Review My Validations
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 px-6 py-3 bg-cardozo-blue text-white rounded-lg font-semibold hover:bg-[#005A94] transition"
          >
            Return to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}