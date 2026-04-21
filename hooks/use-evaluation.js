// hooks/use-evaluation.js
// React hook for managing evaluation data and feedback

import { useState, useCallback, useEffect } from 'react';

export function useEvaluation() {
  const [evaluations, setEvaluations] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [reports, setReports] = useState([]);
  const [benchmark, setBenchmark] = useState(null);
  const [patterns, setPatterns] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Submit an evaluation (coding, interview, quiz)
   */
  const submitEvaluation = useCallback(async (evaluationData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/evaluation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluationData),
      });

      if (!res.ok) throw new Error('Failed to submit evaluation');

      const result = await res.json();

      // Store evaluation
      setEvaluations(prev => [result.evaluation, ...prev]);

      // Store feedback
      setFeedback(result.feedback);

      // Store recommendations
      setRecommendations(result.recommendations);

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get detailed feedback for an evaluation
   */
  const getEvaluationFeedback = useCallback(async (evaluationId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/evaluation/feedback/${evaluationId}`);
      if (!res.ok) throw new Error('Failed to load feedback');

      const data = await res.json();
      setFeedback(data.feedback);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load performance reports
   */
  const loadReports = useCallback(async (type = 'weekly', limit = 5) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/evaluation/reports?type=${type}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to load reports');

      const data = await res.json();
      setReports(data.reports);
      return data.reports;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generate a new report
   */
  const generateReport = useCallback(async (reportType = 'weekly') => {
    setLoading(true);
    try {
      const res = await fetch('/api/evaluation/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType }),
      });

      if (!res.ok) throw new Error('Failed to generate report');

      const newReport = await res.json();

      // Reload reports
      await loadReports(reportType);

      return newReport;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadReports]);

  /**
   * Load benchmark data
   */
  const loadBenchmark = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/evaluation/benchmark');
      if (!res.ok) throw new Error('Failed to load benchmark');

      const data = await res.json();
      setBenchmark(data.benchmark);
      return data.benchmark;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Recalculate benchmark
   */
  const recalculateBenchmark = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/evaluation/benchmark', {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to recalculate benchmark');

      const data = await res.json();
      setBenchmark(data.benchmark);
      return data.benchmark;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load performance patterns
   */
  const loadPatterns = useCallback(async (resolved = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/evaluation/patterns?resolved=${resolved}`);
      if (!res.ok) throw new Error('Failed to load patterns');

      const data = await res.json();
      setPatterns(data.patterns);
      return data.patterns;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Resolve a performance pattern
   */
  const resolvePattern = useCallback(async (patternId) => {
    try {
      const res = await fetch('/api/evaluation/patterns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patternId, action: 'resolve' }),
      });

      if (!res.ok) throw new Error('Failed to resolve pattern');

      setPatterns(prev => prev.filter(p => p.id !== patternId));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Load recommendations
   */
  const loadRecommendations = useCallback(async (priority = 'high', limit = 10) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/evaluation/recommendations?priority=${priority}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to load recommendations');

      const data = await res.json();
      setRecommendations(data.recommendations);
      return data.recommendations;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Dismiss a recommendation
   */
  const dismissRecommendation = useCallback(async (recommendationId) => {
    try {
      const res = await fetch('/api/evaluation/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId, action: 'dismiss' }),
      });

      if (!res.ok) throw new Error('Failed to dismiss recommendation');

      setRecommendations(prev => prev.filter(r => r.id !== recommendationId));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Mark recommendation as acted upon
   */
  const actOnRecommendation = useCallback(async (recommendationId) => {
    try {
      const res = await fetch('/api/evaluation/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId, action: 'acted' }),
      });

      if (!res.ok) throw new Error('Failed to mark recommendation as acted');

      setRecommendations(prev => prev.filter(r => r.id !== recommendationId));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Load all evaluation data (convenience method)
   */
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadReports('weekly'),
        loadBenchmark(),
        loadPatterns(false),
        loadRecommendations('high'),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loadReports, loadBenchmark, loadPatterns, loadRecommendations]);

  /**
   * Clear all data
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    evaluations,
    feedback,
    reports,
    benchmark,
    patterns,
    recommendations,
    loading,
    error,

    // Methods
    submitEvaluation,
    getEvaluationFeedback,
    loadReports,
    generateReport,
    loadBenchmark,
    recalculateBenchmark,
    loadPatterns,
    resolvePattern,
    loadRecommendations,
    dismissRecommendation,
    actOnRecommendation,
    loadAll,
    clearError,
  };
}

/**
 * Helper hook for accessing single evaluation feedback
 */
export function useEvaluationFeedback(evaluationId) {
  const [feedback, setFeedback] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/evaluation/feedback/${evaluationId}`);
        if (!res.ok) throw new Error('Failed to load feedback');

        const data = await res.json();
        setFeedback(data.feedback);
        setEvaluation(data.evaluation);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (evaluationId) load();
  }, [evaluationId]);

  return { feedback, evaluation, loading, error };
}

/**
 * Helper hook for accessing performance reports
 */
export function usePerformanceReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/evaluation/reports?limit=10');
        if (!res.ok) throw new Error('Failed to load reports');

        const data = await res.json();
        setReports(data.reports);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { reports, loading, error };
}

/**
 * Helper hook for accessing benchmark data
 */
export function useBenchmark() {
  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/evaluation/benchmark');
        if (!res.ok) throw new Error('Failed to load benchmark');

        const data = await res.json();
        setBenchmark(data.benchmark);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { benchmark, loading, error };
}
