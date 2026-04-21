import { useState, useEffect } from 'react';

export function usePersonalization() {
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [goals, setGoals] = useState([]);
  const [insights, setInsights] = useState([]);
  const [nextAction, setNextAction] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile
  const loadProfile = async () => {
    try {
      const response = await fetch('/api/personalization/profile');
      const data = await response.json();
      if (response.ok) {
        setProfile(data.profile);
        setRecommendations(data.profile.recommendations || []);
        setInsights(data.profile.insights || []);
        setGoals(data.profile.goals || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Track activity
  const trackActivity = async (activityData) => {
    try {
      const response = await fetch('/api/personalization/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      });
      return response.ok;
    } catch (error) {
      console.error('Error tracking activity:', error);
      return false;
    }
  };

  // Generate recommendations
  const generateRecommendations = async () => {
    try {
      const response = await fetch('/api/personalization/recommendations/generate', {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  };

  // Update recommendation status
  const updateRecommendation = async (id, status) => {
    try {
      const response = await fetch(`/api/personalization/recommendations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setRecommendations(prev =>
          prev.map(rec => rec.id === id ? { ...rec, status } : rec)
        );
      }
    } catch (error) {
      console.error('Error updating recommendation:', error);
    }
  };

  // Create goal
  const createGoal = async (goalData) => {
    try {
      const response = await fetch('/api/personalization/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      });
      const data = await response.json();
      if (response.ok) {
        setGoals(prev => [...prev, data.goal]);
      }
      return data;
    } catch (error) {
      console.error('Error creating goal:', error);
      return null;
    }
  };

  // Store conversation memory
  const storeConversationMemory = async (memoryData) => {
    try {
      const response = await fetch('/api/personalization/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memoryData)
      });
      return response.ok;
    } catch (error) {
      console.error('Error storing memory:', error);
      return false;
    }
  };

  // Get conversation context
  const getConversationContext = async (aiFeature, conversationType, currentTopics = []) => {
    try {
      const response = await fetch('/api/personalization/memory/context', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiFeature, conversationType, currentTopics })
      });
      const data = await response.json();
      return data.contextMemories || [];
    } catch (error) {
      console.error('Error getting context:', error);
      return [];
    }
  };

  // Generate insights
  const generateInsights = async (type = 'weekly_summary') => {
    try {
      const response = await fetch('/api/personalization/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await response.json();
      if (response.ok) {
        setInsights(prev => [...data.insights, ...prev]);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  };

  // Mark insight as read
  const markInsightRead = async (id) => {
    try {
      const response = await fetch(`/api/personalization/insights/${id}/read`, {
        method: 'PUT'
      });
      if (response.ok) {
        setInsights(prev =>
          prev.map(insight => insight.id === id ? { ...insight, isRead: true } : insight)
        );
      }
    } catch (error) {
      console.error('Error marking insight read:', error);
    }
  };

  // Get next best action
  const getNextAction = async () => {
    try {
      const response = await fetch('/api/personalization/next-action');
      const data = await response.json();
      if (response.ok) {
        setNextAction(data.action);
      }
    } catch (error) {
      console.error('Error getting next action:', error);
    }
  };

  // Initialize
  useEffect(() => {
    loadProfile().finally(() => setLoading(false));
  }, []);

  return {
    profile,
    recommendations,
    goals,
    insights,
    nextAction,
    loading,
    actions: {
      loadProfile,
      trackActivity,
      generateRecommendations,
      updateRecommendation,
      createGoal,
      storeConversationMemory,
      getConversationContext,
      generateInsights,
      markInsightRead,
      getNextAction
    }
  };
}

// Hook for tracking activities automatically
export function useActivityTracker() {
  const { trackActivity } = usePersonalization();

  const track = (activityType, data) => {
    trackActivity({
      activityType,
      timestamp: new Date(),
      ...data
    });
  };

  return { track };
}

// Hook for conversation memory
export function useConversationMemory(aiFeature, conversationType) {
  const { storeConversationMemory, getConversationContext } = usePersonalization();
  const [context, setContext] = useState([]);

  const storeMemory = async (userMessage, aiResponse, additionalData = {}) => {
    return await storeConversationMemory({
      sessionId: `session_${Date.now()}`,
      aiFeature,
      conversationType,
      userMessage,
      aiResponse,
      ...additionalData
    });
  };

  const loadContext = async (currentTopics = []) => {
    const ctx = await getConversationContext(aiFeature, conversationType, currentTopics);
    setContext(ctx);
    return ctx;
  };

  return {
    context,
    storeMemory,
    loadContext
  };
}
