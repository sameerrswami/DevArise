// hooks/use-integration.js
// Main hook for integration system

import { useState, useCallback, useEffect } from 'react';

export const useIntegration = () => {
  const [journey, setJourney] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all integration data
  const loadJourneyData = useCallback(async () => {
    setLoading(true);
    try {
      const [progressRes, readinessRes, workflowRes, roadmapRes] = await Promise.all([
        fetch('/api/integration/journey-progress'),
        fetch('/api/integration/readiness-score'),
        fetch('/api/integration/workflow'),
        fetch('/api/integration/roadmap'),
      ]);

      if (!progressRes.ok || !readinessRes.ok || !workflowRes.ok || !roadmapRes.ok) {
        throw new Error('Failed to load journey data');
      }

      const progressData = await progressRes.json();
      const readinessData = await readinessRes.json();
      const workflowData = await workflowRes.json();
      const roadmapData = await roadmapRes.json();

      setJourney(progressData.journey);
      setMetrics(progressData.metrics);
      setReadiness(readinessData.readiness);
      setWorkflow(workflowData.workflow);
      setRoadmap(roadmapData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Track system event
  const trackEvent = useCallback(
    async (eventType, eventData) => {
      try {
        const response = await fetch('/api/integration/system-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType,
            eventData,
          }),
        });

        const data = await response.json();
        if (data.success) {
          // Reload journey data after event
          await loadJourneyData();
        }
        return data;
      } catch (err) {
        setError(err.message);
      }
    },
    [loadJourneyData]
  );

  // Complete phase
  const completePhase = useCallback(async (phaseId) => {
    try {
      const response = await fetch('/api/integration/roadmap', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phaseId,
          action: 'complete_phase',
        }),
      });

      await loadJourneyData();
      return await response.json();
    } catch (err) {
      setError(err.message);
    }
  }, [loadJourneyData]);

  // Complete milestone
  const completeMilestone = useCallback(async (milestoneId) => {
    try {
      const response = await fetch('/api/integration/roadmap', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          action: 'complete_milestone',
        }),
      });

      await loadJourneyData();
      return await response.json();
    } catch (err) {
      setError(err.message);
    }
  }, [loadJourneyData]);

  // Start session
  const startSession = useCallback(async () => {
    try {
      const response = await fetch('/api/integration/workflow', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_session' }),
      });

      await loadJourneyData();
      return await response.json();
    } catch (err) {
      setError(err.message);
    }
  }, [loadJourneyData]);

  // End session
  const endSession = useCallback(async () => {
    try {
      const response = await fetch('/api/integration/workflow', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end_session' }),
      });

      await loadJourneyData();
      return await response.json();
    } catch (err) {
      setError(err.message);
    }
  }, [loadJourneyData]);

  useEffect(() => {
    loadJourneyData();
  }, [loadJourneyData]);

  return {
    journey,
    metrics,
    readiness,
    workflow,
    roadmap,
    loading,
    error,
    trackEvent,
    completePhase,
    completeMilestone,
    startSession,
    endSession,
    reload: loadJourneyData,
  };
};
