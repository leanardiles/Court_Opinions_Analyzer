import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { modulesAPI } from '../api/client';
import Header from '../components/Header';

export default function ModuleResultsPage({ user, onLogout }) {
  const { projectId, moduleId, round } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(parseInt(round) || 1);

  useEffect(() => {
    loadResults();
  }, [moduleId, selectedRound]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const data = await modulesAPI.getResults(moduleId, selectedRound);
      setResults(data);
    } catch (err) {
      console.error('Failed to load results:', err);
      alert('Failed to load results: ' + (err.response?.data?.detail || 'Unknown error'));
      navigate(`/project/${projectId}/module/${moduleId}`);
    } finally {
      setLoading(false);
    }
  };

  const getTrustColor = (level) => {
    if (level === 'high') return 'text-green-700';
    if (level === 'medium') return 'text-yellow-700';
    return 'text-red-700';
  };

  const getTrustBg = (level) => {
    if (level === 'high') return 'bg-green-50 border-green-200';
    if (level === 'medium') return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getAccuracyColor = (pct) => {
    if (pct >= 85) return 'text-green-700';
    if (pct >= 70) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getTierColor = (accuracy) => {
    if (accuracy === null) return 'text-gray-400';
    if (accuracy >= 85) return 'text-green-700';
    if (accuracy >= 70) return 'text-yellow-700';
    return 'text-red-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Back button */}
        <button
          onClick={() => navigate(`/project/${projectId}/module/${moduleId}`)}
          className="text-cardozo-blue hover:text-[#005A94] mb-4 font-medium flex items-center gap-1"
        >
          ← Back to Module
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-3xl font-serif font-bold text-cardozo-dark">
              Validation Results
            </h1>
            {results.total_rounds > 1 && (
              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm text-gray-600 font-medium">Round:</span>
                {Array.from({ length: results.total_rounds }, (_, i) => i + 1).map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRound(r)}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                      selectedRound === r
                        ? 'bg-cardozo-blue text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-24 h-1 bg-cardozo-gold mt-2 mb-4"></div>
          <p className="text-gray-700 font-semibold">{results.module_name}</p>
          <p className="text-sm text-gray-600 mt-1">{results.question_text}</p>
        </div>

        {/* Section 1 — Overview */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-cardozo-dark mb-4">
            Overview — Round {selectedRound}
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-4xl font-bold text-cardozo-blue mb-1">
                {results.total_cases}
              </div>
              <div className="text-xs font-semibold text-gray-600">Cases Analyzed</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-4xl font-bold text-green-700 mb-1">
                {results.ai_correct}
              </div>
              <div className="text-xs font-semibold text-gray-600">AI Correct</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-4xl font-bold text-red-700 mb-1">
                {results.ai_incorrect}
              </div>
              <div className="text-xs font-semibold text-gray-600">AI Incorrect</div>
            </div>
          </div>

          {/* Accuracy bar */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-gray-700">Overall Accuracy</span>
              <span className={`text-3xl font-bold ${getAccuracyColor(results.accuracy_percentage)}`}>
                {results.accuracy_percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  results.accuracy_percentage >= 85 ? 'bg-green-600' :
                  results.accuracy_percentage >= 70 ? 'bg-yellow-500' : 'bg-red-600'
                }`}
                style={{ width: `${results.accuracy_percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Section 2 — Confidence Calibration */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-cardozo-dark mb-2">
            Confidence Calibration
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Does high AI confidence actually predict correctness? A well-calibrated model scores higher on cases it is more confident about.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Confidence Tier</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">Cases</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">AI Correct</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">Accuracy</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Bar</th>
                </tr>
              </thead>
              <tbody>
                {results.confidence_tiers.map((tier, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3 px-3 font-medium text-gray-800">{tier.label}</td>
                    <td className="py-3 px-3 text-center text-gray-700">{tier.total_cases}</td>
                    <td className="py-3 px-3 text-center text-gray-700">{tier.correct}</td>
                    <td className={`py-3 px-3 text-center font-bold ${getTierColor(tier.accuracy)}`}>
                      {tier.accuracy !== null ? `${tier.accuracy}%` : '—'}
                    </td>
                    <td className="py-3 px-3 w-32">
                      {tier.accuracy !== null ? (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              tier.accuracy >= 85 ? 'bg-green-500' :
                              tier.accuracy >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${tier.accuracy}%` }}
                          ></div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No cases</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3 — Answer Distribution */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-cardozo-dark mb-2">
            Answer Distribution
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Comparison of AI answers vs validator-confirmed answers. Large discrepancies may indicate systematic bias.
          </p>
          {results.answer_distribution.length === 0 ? (
            <p className="text-gray-500 italic text-sm">No distribution data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Answer</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">AI Said</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">Validators Confirmed</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {results.answer_distribution.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-3 px-3 font-medium text-gray-800">{row.answer}</td>
                      <td className="py-3 px-3 text-center text-cardozo-blue font-semibold">{row.ai_count}</td>
                      <td className="py-3 px-3 text-center text-green-700 font-semibold">{row.validator_count}</td>
                      <td className={`py-3 px-3 text-center font-semibold ${
                        row.ai_count - row.validator_count === 0
                          ? 'text-gray-400'
                          : Math.abs(row.ai_count - row.validator_count) > 2
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}>
                        {row.ai_count - row.validator_count === 0
                          ? '—'
                          : row.ai_count - row.validator_count > 0
                          ? `+${row.ai_count - row.validator_count}`
                          : row.ai_count - row.validator_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 4 — Trust Recommendation */}
        <div className={`card mb-6 border ${getTrustBg(results.trust_level)}`}>
          <h2 className="text-lg font-semibold text-cardozo-dark mb-3">
            📋 Scholar Recommendation
          </h2>
          <p className={`text-base font-medium mb-4 ${getTrustColor(results.trust_level)}`}>
            {results.trust_level === 'high' && '✓ High confidence — AI is ready for corpus-wide application'}
            {results.trust_level === 'medium' && '⚠ Moderate confidence — Consider another round'}
            {results.trust_level === 'low' && '✗ Low confidence — Significant improvement needed'}
          </p>
          <p className="text-sm text-gray-700 mb-4">{results.recommendation}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <span className="font-semibold text-gray-700 block mb-1">High confidence cases</span>
              <span className="text-2xl font-bold text-cardozo-blue">{results.high_conf_percentage}%</span>
              <span className="text-gray-500 text-xs block">of corpus can be auto-applied</span>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <span className="font-semibold text-gray-700 block mb-1">Low confidence cases</span>
              <span className="text-2xl font-bold text-yellow-600">{results.low_conf_percentage}%</span>
              <span className="text-gray-500 text-xs block">would need human review</span>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/project/${projectId}/module/${moduleId}`)}
            className="flex-1 px-6 py-3 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition"
          >
            Back to Module
          </button>
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            className="flex-1 px-6 py-3 bg-cardozo-blue text-white rounded-lg font-semibold hover:bg-[#005A94] transition"
          >
            Back to Project
          </button>
        </div>

      </main>
    </div>
  );
}