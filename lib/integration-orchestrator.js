// lib/integration-orchestrator.js
// Central orchestrator for cross-feature integration
// Manages workflows, event propagation, and experience adaptation

const prisma = require('./prisma');

class IntegrationOrchestrator {
  /**
   * Initialize user journey on first signup
   */
  async initializeUserJourney(userId, onboardingData) {
    try {
      // Create journey
      const journey = await prisma.userJourney.create({
        data: {
          userId,
          primaryGoal: onboardingData.primaryGoal,
          targetRoles: onboardingData.targetRoles || [],
          targetCompanies: onboardingData.targetCompanies || [],
          placementDeadline: onboardingData.placementDeadline,
          currentLevel: onboardingData.currentLevel || 'beginner',
          yearsOfExperience: onboardingData.yearsOfExperience || 0,
          programmingLanguages: onboardingData.programmingLanguages || [],
          areasOfInterest: onboardingData.areasOfInterest || [],
          areasOfWeakness: onboardingData.areasOfWeakness || [],
          currentStage: 'onboarding',
        },
      });

      // Create metrics
      await prisma.journeyMetrics.create({
        data: { userId },
      });

      // Create simulation config
      await prisma.simulationConfig.create({
        data: {
          userId,
          problemDifficultyMap: this.generateDifficultyMap(onboardingData.currentLevel),
          interviewDifficultyMap: this.generateInterviewDifficultyMap(onboardingData.currentLevel),
          companyDifficultyMap: this.generateCompanyDifficultyMap(onboardingData.targetCompanies),
          roleRequirementMap: this.generateRoleRequirements(onboardingData.targetRoles),
        },
      });

      // Create workflow state
      await prisma.userWorkflow.create({
        data: {
          userId,
          currentWorkflow: 'learning',
        },
      });

      // Generate personalized roadmap
      const roadmap = await this.generatePersonalizedRoadmap(userId, journey);

      // Update journey with roadmap
      await prisma.userJourney.update({
        where: { id: journey.id },
        data: {
          roadmapId: roadmap.id,
          currentStage: 'learning',
          stageProgress: 0.1,
        },
      });

      return { journey, roadmap };
    } catch (error) {
      console.error('Error initializing user journey:', error);
      throw error;
    }
  }

  /**
   * Generate personalized roadmap based on user data
   */
  async generatePersonalizedRoadmap(userId, journey) {
    try {
      const roadmapPhaseConfig = this.getRoadmapPhaseConfig(journey);
      
      const roadmap = await prisma.roadmap.create({
        data: {
          userId,
          journeyId: journey.id,
          title: `${journey.primaryGoal.replace(/_/g, ' ').toUpperCase()} Preparation`,
          description: `Personalized roadmap for ${journey.targetRoles?.join(', ') || 'desired role'} placement at ${journey.targetCompanies?.join(', ') || 'top companies'}`,
          totalWeeks: this.estimateRoadmapWeeks(journey),
          difficulty: journey.currentLevel,
          phases: {
            create: roadmapPhaseConfig.map((phase, idx) => ({
              phaseNumber: idx + 1,
              title: phase.title,
              description: phase.description,
              duration: phase.duration,
              order: idx,
              learningModules: phase.modules || [],
              codingProblems: phase.problems || [],
              mockInterviews: phase.interviews || [],
              quizzes: phase.quizzes || [],
              projects: phase.projects || [],
              targetProblemsSolved: phase.targetProblems,
              targetAccuracy: phase.targetAccuracy,
              targetInterviewScore: phase.targetInterviewScore,
              milestones: {
                create: phase.milestones || [],
              },
            })),
          },
        },
        include: { phases: { include: { milestones: true } } },
      });

      return roadmap;
    } catch (error) {
      console.error('Error generating roadmap:', error);
      throw error;
    }
  }

  /**
   * Process cross-feature event
   * When user completes task in one feature, propagate to others
   */
  async processSystemEvent(userId, eventType, eventData) {
    try {
      // Record event
      const systemEvent = await prisma.systemEvent.create({
        data: {
          userId,
          eventType,
          sourceFeature: eventData.sourceFeature,
          targetFeatures: this.getTargetFeatures(eventType),
          eventData,
        },
      });

      // Get journey for context
      const journey = await prisma.userJourney.findUnique({
        where: { userId },
        include: { roadmap: { include: { phases: true } } },
      });

      const propagatedUpdates = [];

      // 1. UPDATE METRICS
      propagatedUpdates.push(
        this.updateMetricsFromEvent(userId, eventType, eventData)
      );

      // 2. UPDATE PROFILE/WEAKNESSES
      propagatedUpdates.push(
        this.updateUserProfileFromEvent(userId, eventType, eventData)
      );

      // 3. UPDATE READINESS SCORES
      propagatedUpdates.push(
        this.updateReadinessScores(userId, journey)
      );

      // 4. ADAPT RECOMMENDATIONS
      propagatedUpdates.push(
        this.generateAdaptiveRecommendations(userId, eventType, eventData)
      );

      // 5. CHECK FOR STAGE TRANSITIONS
      propagatedUpdates.push(
        this.checkAndExecuteStageTransitions(userId, journey)
      );

      // 6. ADAPT ROADMAP IF NEEDED
      if (this.shouldAdaptRoadmap(eventType)) {
        propagatedUpdates.push(
          this.adaptRoadmapBasedOnProgress(userId, journey)
        );
      }

      // 7. UPDATE WORKFLOW SUGGESTIONS
      propagatedUpdates.push(
        this.updateWorkflowSuggestions(userId, eventType, eventData)
      );

      // Wait for all updates
      await Promise.all(propagatedUpdates);

      // Mark event as processed
      await prisma.systemEvent.update({
        where: { id: systemEvent.id },
        data: {
          processed: true,
          processedAt: new Date(),
          propagatedTo: this.getTargetFeatures(eventType),
        },
      });

      return systemEvent;
    } catch (error) {
      console.error('Error processing system event:', error);
      throw error;
    }
  }

  /**
   * Update journey metrics from event
   */
  async updateMetricsFromEvent(userId, eventType, eventData) {
    const metrics = await prisma.journeyMetrics.findUnique({
      where: { userId },
    });

    const updates = {};

    if (eventType === 'problem_completed') {
      updates.totalProblemsSolved = (metrics.totalProblemsSolved || 0) + 1;
      const newAccuracy = (
        (metrics.problemAccuracy * (metrics.totalProblemsSolved || 1) + 
          (eventData.score || 0)) /
        (updates.totalProblemsSolved)
      );
      updates.problemAccuracy = Math.round(newAccuracy * 100) / 100;
      updates.totalHoursSpent = (metrics.totalHoursSpent || 0) + (eventData.timeSpent || 0) / 3600;
    } 
    else if (eventType === 'interview_completed') {
      updates.interviewsAttempted = (metrics.interviewsAttempted || 0) + 1;
      const newRate = (
        (metrics.interviewSuccessRate * (metrics.interviewsAttempted || 1) + 
          (eventData.score || 0)) /
        (updates.interviewsAttempted)
      );
      updates.interviewSuccessRate = Math.round(newRate * 100) / 100;
      updates.totalHoursSpent = (metrics.totalHoursSpent || 0) + (eventData.timeSpent || 0) / 3600;
    }
    else if (eventType === 'module_completed') {
      updates.modulesCompleted = (metrics.modulesCompleted || 0) + 1;
      updates.totalHoursSpent = (metrics.totalHoursSpent || 0) + (eventData.timeSpent || 0) / 3600;
    }

    if (Object.keys(updates).length > 0) {
      updates.lastUpdated = new Date();
      return prisma.journeyMetrics.update({
        where: { userId },
        data: updates,
      });
    }
  }

  /**
   * Update user profile based on event
   */
  async updateUserProfileFromEvent(userId, eventType, eventData) {
    // This integrates with the existing PersonalizationService
    const PersonalizationService = require('./personalization-service');
    
    const activityMap = {
      'problem_completed': 'problem_solved',
      'interview_completed': 'interview_completed',
      'module_completed': 'module_completed',
      'video_watched': 'video_watched',
    };

    if (activityMap[eventType]) {
      return PersonalizationService.trackActivity(userId, {
        activityType: activityMap[eventType],
        score: eventData.score || 0,
        timeSpent: eventData.timeSpent || 0,
        difficulty: eventData.difficulty,
        category: eventData.category,
        metadata: eventData,
        source: 'system_event',
      });
    }
  }

  /**
   * Update readiness scores for placement
   */
  async updateReadinessScores(userId, journey) {
    const metrics = await prisma.journeyMetrics.findUnique({
      where: { userId },
    });

    const technicalScore = Math.min(100, (metrics.totalProblemsSolved / 100) * 50 + (metrics.problemAccuracy * 50));
    const interviewScore = Math.min(100, (metrics.interviewsAttempted / 20) * 50 + (metrics.interviewSuccessRate * 50));
    const resumeScore = await this.calculateResumeScore(userId);
    const jobSearchScore = (metrics.totalHoursSpent / 120) * 100; // 120 hours = ready

    const placementReadiness = (technicalScore + interviewScore + resumeScore + jobSearchScore) / 4;

    return prisma.journeyMetrics.update({
      where: { userId },
      data: {
        technicalReadiness: Math.round(technicalScore),
        interviewReadiness: Math.round(interviewScore),
        resumeReadiness: Math.round(resumeScore),
        jobSearchReadiness: Math.round(jobSearchScore),
        placementReadiness: Math.round(placementReadiness),
      },
    });
  }

  /**
   * Generate adaptive recommendations based on event
   */
  async generateAdaptiveRecommendations(userId, eventType, eventData) {
    const PersonalizationService = require('./personalization-service');
    
    // Get current state
    const metrics = await prisma.journeyMetrics.findUnique({
      where: { userId },
    });

    // Generate recommendations based on recent performance
    const recommendations = [];

    if (eventType === 'problem_completed' && eventData.score < 0.6) {
      recommendations.push({
        type: 'problem',
        priority: 4,
        reason: 'You struggled with this problem. Let us help you master this topic.',
        expectedBenefit: 'Improve problem-solving skills in this area',
      });
    }

    if (eventType === 'interview_completed' && eventData.score < 0.5) {
      recommendations.push({
        type: 'interview',
        priority: 5,
        reason: 'Interview performance was below target. Extra practice needed.',
        expectedBenefit: 'Build confidence and prepare better for real interviews',
      });
    }

    if (metrics.interviewsAttempted === 0 && metrics.totalProblemsSolved > 10) {
      recommendations.push({
        type: 'interview',
        priority: 3,
        reason: 'You\'re ready to start mock interviews!',
        expectedBenefit: 'Transition from practice to interview preparation',
      });
    }

    // Store recommendations via PersonalizationService
    if (recommendations.length > 0) {
      for (const rec of recommendations) {
        await prisma.recommendation.create({
          data: {
            userProfileId: userId, // Assuming userProfile matches userId
            ...rec,
            status: 'pending',
          },
        });
      }
    }
  }

  /**
   * Check if user should transition between journey stages
   */
  async checkAndExecuteStageTransitions(userId, journey) {
    const metrics = await prisma.journeyMetrics.findUnique({
      where: { userId },
    });

    let targetStage = journey.currentStage;
    let reason = null;

    // Transition logic based on metrics
    if (journey.currentStage === 'onboarding' && metrics.totalProblemsSolved >= 5) {
      targetStage = 'learning';
      reason = 'progress';
    }
    
    if (journey.currentStage === 'learning' && metrics.totalProblemsSolved >= 25 && metrics.interviewsAttempted === 0) {
      targetStage = 'practice';
      reason = 'progress';
    }
    
    if (journey.currentStage === 'practice' && metrics.interviewsAttempted >= 5) {
      targetStage = 'interview_prep';
      reason = 'progress';
    }
    
    if (journey.currentStage === 'interview_prep' && 
        metrics.interviewSuccessRate >= 0.7 && 
        metrics.placementReadiness >= 70) {
      targetStage = 'job_search';
      reason = 'progress';
    }

    if (targetStage !== journey.currentStage) {
      await prisma.stageTransition.create({
        data: {
          journeyId: journey.id,
          fromStage: journey.currentStage,
          toStage: targetStage,
          transitionReason: reason,
          completionMetrics: {
            problemsSolved: metrics.totalProblemsSolved,
            accuracy: metrics.problemAccuracy,
            interviewsAttempted: metrics.interviewsAttempted,
            readiness: metrics.placementReadiness,
          },
        },
      });

      return prisma.userJourney.update({
        where: { id: journey.id },
        data: {
          currentStage: targetStage,
          stageProgress: 0,
        },
      });
    }
  }

  /**
   * Adapt roadmap based on user progress
   */
  async adaptRoadmapBasedOnProgress(userId, journey) {
    if (!journey.roadmap) return;

    const metrics = await prisma.journeyMetrics.findUnique({
      where: { userId },
    });

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: { userActivity: { orderBy: { timestamp: 'desc' }, take: 100 } },
    });

    // Analyze weak areas
    const activityByCategory = {};
    userProfile.userActivity.forEach(activity => {
      if (!activityByCategory[activity.category]) {
        activityByCategory[activity.category] = { count: 0, scores: [] };
      }
      activityByCategory[activity.category].count++;
      activityByCategory[activity.category].scores.push(activity.score);
    });

    // Find weak categories
    const weakCategories = Object.entries(activityByCategory)
      .filter(([category, data]) => {
        const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        return avgScore < 0.6;
      })
      .map(([category]) => category);

    if (weakCategories.length > 0) {
      // Update current phase to include more practice in weak areas
      const currentPhase = journey.roadmap.phases[0];
      if (currentPhase) {
        // We would update the problem selection to prefer weak categories
        console.log(`Adapting roadmap to focus on weak areas: ${weakCategories.join(', ')}`);
      }
    }

    // Update roadmap adaptation timestamp
    return prisma.roadmap.update({
      where: { id: journey.roadmapId },
      data: {
        lastAdapted: new Date(),
        adaptationCount: journey.roadmap.adaptationCount + 1,
      },
    });
  }

  /**
   * Update workflow suggestions for next action
   */
  async updateWorkflowSuggestions(userId, eventType, eventData) {
    const journey = await prisma.userJourney.findUnique({
      where: { userId },
      include: { roadmap: { include: { phases: true } } },
    });

    let suggestedNextAction = null;
    let suggestedContent = [];
    let estimatedValue = null;

    if (eventType === 'problem_completed') {
      if (eventData.score < 0.5) {
        suggestedNextAction = 'review_topic';
        suggestedContent = [eventData.topicId];
        estimatedValue = 'Master this concept before moving forward';
      } else if (eventData.score >= 0.8) {
        suggestedNextAction = 'next_problem';
        estimatedValue = 'Great job! Try the next problem in this topic';
      }
    }

    if (eventType === 'interview_completed') {
      if (eventData.score < 0.6) {
        suggestedNextAction = 'interview_feedback';
        estimatedValue = 'Review feedback to identify improvement areas';
      } else {
        suggestedNextAction = 'another_interview';
        estimatedValue = 'You\'re doing well! Try another mock interview';
      }
    }

    if (eventType === 'module_completed') {
      suggestedNextAction = 'practice_problems';
      estimatedValue = 'Practice what you\'ve learned with coding problems';
    }

    if (suggestedNextAction) {
      return prisma.userWorkflow.update({
        where: { userId },
        data: {
          suggestedNextAction,
          suggestedContent,
          estimatedValue,
          lastInteractionAt: new Date(),
        },
      });
    }
  }

  /**
   * Get target features affected by an event
   */
  getTargetFeatures(eventType) {
    const featureMap = {
      'problem_completed': ['dashboard', 'recommendations', 'insights', 'roadmap', 'jobs'],
      'interview_completed': ['dashboard', 'recommendations', 'insights', 'roadmap', 'jobs', 'resume'],
      'module_completed': ['dashboard', 'recommendations', 'problems', 'interviews'],
      'video_watched': ['dashboard', 'recommendations', 'problems'],
      'quiz_passed': ['dashboard', 'recommendations', 'certificate'],
      'resume_updated': ['dashboard', 'recommendations', 'jobs', 'interviews'],
    };

    return featureMap[eventType] || [];
  }

  /**
   * Determine if roadmap should be adapted
   */
  shouldAdaptRoadmap(eventType) {
    const adaptTriggers = [
      'problem_completed',
      'interview_completed',
      'milestone_achieved',
      'performance_warning_triggered',
    ];
    return adaptTriggers.includes(eventType);
  }

  /**
   * Generate difficulty map based on user level
   */
  generateDifficultyMap(userLevel) {
    const maps = {
      beginner: { easy: 0.4, medium: 0.3, hard: 0.2, veryhard: 0.1 },
      intermediate: { easy: 0.2, medium: 0.5, hard: 0.2, veryhard: 0.1 },
      advanced: { easy: 0.1, medium: 0.3, hard: 0.5, veryhard: 0.1 },
    };
    return maps[userLevel] || maps.intermediate;
  }

  /**
   * Generate interview difficulty map
   */
  generateInterviewDifficultyMap(userLevel) {
    const maps = {
      beginner: { easy_behavioral: 0.6, tech_screening: 0.3, system_design: 0.1 },
      intermediate: { easy_behavioral: 0.2, tech_screening: 0.6, system_design: 0.2 },
      advanced: { easy_behavioral: 0.1, tech_screening: 0.4, system_design: 0.5 },
    };
    return maps[userLevel] || maps.intermediate;
  }

  /**
   * Generate company difficulty map
   */
  generateCompanyDifficultyMap(companies = []) {
    return {
      'FAANG': 'hard',
      'Startups': 'medium',
      'MNC': 'medium',
      'Product': 'hard',
      'Service': 'easy',
    };
  }

  /**
   * Generate role requirements map
   */
  generateRoleRequirements(roles = []) {
    return {
      'SDE': { dsa: 90, system_design: 70, projects: 3 },
      'Frontend': { javascript: 90, design: 70, projects: 5 },
      'Backend': { dsa: 85, databases: 80, projects: 3 },
      'Data': { statistics: 85, python: 90, projects: 2 },
    };
  }

  /**
   * Estimate weeks needed for roadmap
   */
  estimateRoadmapWeeks(journey) {
    const baseWeeks = {
      beginner: 16,
      intermediate: 12,
      advanced: 8,
    };
    return baseWeeks[journey.currentLevel] || 12;
  }

  /**
   * Get roadmap phase configuration
   */
  getRoadmapPhaseConfig(journey) {
    return [
      {
        title: 'Fundamentals & Setup',
        description: 'Build strong foundation in core concepts',
        duration: 2,
        modules: ['basics-dsa', 'competitive-programming-intro'],
        problems: 10,
        interviews: 0,
        targetProblems: 10,
        targetAccuracy: 0.8,
        milestones: [
          { title: '10 problems solved', type: 'problem_count', targetValue: 10, weight: 1 },
        ],
      },
      {
        title: 'Data Structures Deep Dive',
        description: 'Master essential data structures',
        duration: 3,
        modules: ['arrays', 'linked-lists', 'trees', 'graphs'],
        problems: 30,
        interviews: 0,
        targetProblems: 30,
        targetAccuracy: 0.75,
        milestones: [
          { title: '30 problems solved', type: 'problem_count', targetValue: 30, weight: 1 },
          { title: 'Array mastery', type: 'topic_mastery', targetValue: 0.8, weight: 1 },
        ],
      },
      {
        title: 'Algorithm Mastery',
        description: 'Learn and practice key algorithms',
        duration: 3,
        modules: ['sorting', 'searching', 'dynamic-programming'],
        problems: 40,
        interviews: 0,
        targetProblems: 40,
        targetAccuracy: 0.7,
        milestones: [
          { title: '70 total problems solved', type: 'problem_count', targetValue: 70, weight: 1 },
        ],
      },
      {
        title: 'System Design Fundamentals',
        description: 'Introduction to system design concepts',
        duration: 2,
        modules: ['scalability', 'databases', 'distributed-systems'],
        problems: 0,
        interviews: 0,
        targetProblems: 0,
        milestones: [
          { title: 'System design basics completed', type: 'topic_mastery', targetValue: 0.7, weight: 1 },
        ],
      },
      {
        title: 'Mock Interview Prep',
        description: 'Start mock interviews to practice',
        duration: 2,
        modules: [],
        problems: 20,
        interviews: 5,
        targetProblems: 20,
        targetAccuracy: 0.75,
        targetInterviewScore: 0.6,
        milestones: [
          { title: 'First 5 interviews completed', type: 'interview_score', targetValue: 5, weight: 1 },
        ],
      },
      {
        title: 'Advanced Problem Solving',
        description: 'Hard problems and edge cases',
        duration: 2,
        modules: ['advanced-dp', 'graph-algorithms'],
        problems: 30,
        interviews: 5,
        targetProblems: 30,
        targetAccuracy: 0.65,
        targetInterviewScore: 0.7,
        milestones: [
          { title: '10 hard problems solved', type: 'problem_count', targetValue: 10, weight: 1 },
        ],
      },
      {
        title: 'Company-Specific Questions',
        description: 'Practice company-specific patterns',
        duration: 1,
        modules: [],
        problems: 15,
        interviews: 0,
        targetProblems: 15,
        targetAccuracy: 0.7,
        milestones: [
          { title: 'Company patterns mastered', type: 'topic_mastery', targetValue: 0.75, weight: 1 },
        ],
      },
      {
        title: 'Final Polish & Interviews',
        description: 'Final optimization and real interviews',
        duration: 2,
        modules: [],
        problems: 10,
        interviews: 10,
        targetProblems: 10,
        targetAccuracy: 0.8,
        targetInterviewScore: 0.75,
        milestones: [
          { title: '20 total interviews completed', type: 'interview_score', targetValue: 20, weight: 1 },
          { title: 'Ready for placement', type: 'interview_score', targetValue: 0.75, weight: 1 },
        ],
      },
    ];
  }

  /**
   * Calculate resume quality score
   */
  async calculateResumeScore(userId) {
    // This would integrate with the resume service
    // For now, return placeholder
    try {
      const resume = await prisma.resume?.findFirst?.({
        where: { userId },
      });
      
      if (!resume) return 0;
      
      let score = 0;
      if (resume.summary) score += 20;
      if (resume.projects?.length >= 3) score += 30;
      if (resume.experience?.length >= 1) score += 20;
      if (resume.education) score += 15;
      if (resume.skills?.length >= 10) score += 15;
      
      return Math.min(100, score);
    } catch {
      return 0;
    }
  }
}

module.exports = new IntegrationOrchestrator();
