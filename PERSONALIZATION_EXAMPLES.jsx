// Example Integration: Using the Personalization System with Existing Features

import { useActivityTracker } from '@/hooks/use-personalization';
import { PersonalizationWidget } from '@/components/personalization-dashboard';
import PersonalizationService from '@/lib/personalization-service';
import prisma from '@/lib/prisma';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Problem-Solving Page Integration
// ═══════════════════════════════════════════════════════════════════════════════

export function ProblemPageWithPersonalization() {
  const { track } = useActivityTracker();
  const [submissionResult, setSubmissionResult] = useState(null);

  const handleSubmitSolution = async (problemId, solution, timeSpent) => {
    try {
      // Submit the problem
      const result = await fetch(`/api/problems/${problemId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: solution })
      });

      const data = await result.json();

      // Track the activity for personalization
      track('problem_solved', {
        activityId: problemId,
        score: data.score || (data.accepted ? 1 : 0),
        timeSpent,
        difficulty: 'medium', // Get from problem data
        category: 'arrays',   // Get from problem data
        metadata: { language: 'javascript' }
      });

      setSubmissionResult(data);
    } catch (error) {
      console.error('Error submitting problem:', error);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          {/* Problem Content */}
          <ProblemEditor onSubmit={handleSubmitSolution} />
        </div>

        <div className="col-span-1">
          {/* Personalization Widget */}
          <PersonalizationWidget type="compact" />
          
          {/* Weak Topic Alert */}
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              💡 You have <strong>low accuracy</strong> in array problems.
              Consider reviewing our array fundamentals course.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Mock Interview Integration
// ═══════════════════════════════════════════════════════════════════════════════

export function MockInterviewWithPersonalization() {
  const { track } = useActivityTracker();

  const handleInterviewComplete = async (interview, totalTime, score) => {
    // Track interview completion
    track('interview_completed', {
      activityId: interview.id,
      score: score / 100, // Normalize to 0-1
      timeSpent: totalTime * 60, // Convert minutes to seconds
      difficulty: 'hard',
      category: 'interview',
      metadata: {
        type: interview.type,
        company: interview.company,
        questions: interview.questionCount,
        accuracy: score
      }
    });

    // Show next steps
    showNextSteps({
      type: 'interview',
      score,
      strengths: interview.strengths,
      weaknesses: interview.weaknesses
    });
  };

  return (
    <div>
      <InterviewSession onComplete={handleInterviewComplete} />
      <PersonalizationWidget type="compact" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Tutorial/Video Integration
// ═══════════════════════════════════════════════════════════════════════════════

export function VideoPlayerWithPersonalization() {
  const { track } = useActivityTracker();

  const handleVideoComplete = (videoDuration) => {
    track('video_watched', {
      activityId: 'video123',
      timeSpent: videoDuration * 1000, // Convert to milliseconds
      difficulty: 'easy',
      category: 'graph-theory',
      metadata: { videoTitle: 'Graph Basics' }
    });
  };

  return (
    <div>
      <VideoPlayer onVideoEnd={handleVideoComplete} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Dashboard with Goals & Recommendations
// ═══════════════════════════════════════════════════════════════════════════════

export async function DashboardWithGoals(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  const personalizationService = new PersonalizationService(prisma);

  // Generate personalized recommendations
  const recommendations = await personalizationService.generateRecommendations(user.id);

  // Get next best action
  const nextAction = await personalizationService.getNextBestAction(user.id);

  // Get active goals
  const goals = await prisma.userGoal.findMany({
    where: { userId: user.id, status: 'active' }
  });

  return {
    recommendations,
    nextAction,
    goals
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: AI Tutor with Conversation Memory
// ═══════════════════════════════════════════════════════════════════════════════

export function TutorWithMemory() {
  const { context, storeMemory, loadContext } = useConversationMemory('tutor', 'problem_solving');
  const [messages, setMessages] = useState([]);

  const handleUserMessage = async (userMessage) => {
    // Load relevant past conversations
    const previousContext = await loadContext(['arrays', 'sorting']);

    // Generate AI response with context
    const aiResponse = await generateTutorResponse(userMessage, previousContext);

    // Store the conversation for future reference
    await storeMemory(userMessage, aiResponse, {
      topics: extractTopics(userMessage),
      importance: 2,
      keyInsights: extractInsights(userMessage)
    });

    // Add to UI
    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: aiResponse }
    ]);
  };

  return (
    <div>
      <ConversationUI messages={messages} onMessage={handleUserMessage} />
      
      {/* Show related past conversations */}
      <div className="mt-4">
        <h4 className="font-semibold">Previous Discussions</h4>
        {context.map(mem => (
          <div key={mem.sessionId} className="text-sm p-2 border rounded">
            <p>Topics: {mem.topics.join(', ')}</p>
            <p className="text-gray-600">{mem.userMessage.slice(0, 100)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Quiz Integration
// ═══════════════════════════════════════════════════════════════════════════════

export function QuizWithTracking() {
  const { track } = useActivityTracker();

  const handleQuizSubmit = async (quizId, answers, score, timeSpent) => {
    // Track quiz completion
    track('quiz_completed', {
      activityId: quizId,
      score: score / 100,
      timeSpent: timeSpent * 1000,
      difficulty: 'medium',
      category: 'data-structures',
      metadata: {
        totalQuestions: answers.length,
        correctCount: score,
        categoryBreakdown: analyzeQuizPerformance(answers)
      }
    });
  };

  return <Quiz onSubmit={handleQuizSubmit} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Contest Integration
// ═══════════════════════════════════════════════════════════════════════════════

export async function ContestResultsAPI(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { contestId } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  const personalizationService = new PersonalizationService(prisma);

  // Get contest results
  const results = await prisma.contestEntry.findFirst({
    where: { contestId, userId: user.id },
    include: { submissions: true }
  });

  // Track contest participation
  await personalizationService.trackActivity(user.id, {
    activityType: 'contest_participated',
    activityId: contestId,
    score: results.score,
    timeSpent: calculateTotalTime(results.submissions),
    difficulty: 'hard',
    category: 'competitive-programming',
    metadata: {
      rank: results.rank,
      ratingChange: results.ratingChange,
      problemsSolved: results.problemsSolved
    }
  });

  // Generate insights about contest performance
  const insights = await generateContestInsights(results);

  return { results, insights };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Playlist/Learning Path Integration
// ═══════════════════════════════════════════════════════════════════════════════

export function LearnigPathWithRecommendations() {
  const { recommendations, actions } = usePersonalization();

  const recommendedPath = recommendations
    .filter(rec => rec.type === 'tutorial' || rec.type === 'problem')
    .slice(0, 5);

  return (
    <div>
      <h2>Recommended Learning Path</h2>
      <div className="space-y-2">
        {recommendedPath.map(rec => (
          <div key={rec.id} className="p-4 border rounded">
            <h4>{rec.title}</h4>
            <p className="text-sm text-gray-600">{rec.description}</p>
            <p className="text-xs text-green-600 mt-2">
              Why: {rec.reason}
            </p>
            <button
              onClick={() => actions.updateRecommendation(rec.id, 'viewed')}
              className="mt-2 text-sm text-blue-600"
            >
              Start this
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: Goal Setting and Tracking
// ═══════════════════════════════════════════════════════════════════════════════

export function GoalTrackingPage() {
  const { createGoal, goals } = usePersonalization().actions;

  const handleCreateGoal = async () => {
    await createGoal({
      title: 'Placement Preparation',
      description: 'Prepare for SDE-1 positions at top companies',
      type: 'placement',
      targetDate: '2024-12-31',
      targetMetrics: {
        problems: 200,
        accuracy: 0.75,
        interviews: 20,
        contests: 5
      },
      priority: 5
    });
  };

  return (
    <div>
      <button onClick={handleCreateGoal}>Create Goal</button>
      
      <div className="space-y-4 mt-4">
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Insights and Progress Reports
// ═══════════════════════════════════════════════════════════════════════════════

export function InsightsPage() {
  const { insights, generateInsights, markInsightRead } = usePersonalization().actions;
  const [selectedInsight, setSelectedInsight] = useState(null);

  useEffect(() => {
    // Generate weekly insights
    generateInsights('weekly_summary');
  }, []);

  const handleInsightClick = async (insight) => {
    await markInsightRead(insight.id);
    setSelectedInsight(insight);
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-1">
        {/* Insights List */}
        <div className="space-y-2">
          {insights.map(insight => (
            <div
              key={insight.id}
              onClick={() => handleInsightClick(insight)}
              className="p-3 border cursor-pointer hover:bg-gray-50"
            >
              <h4 className="font-semibold text-sm">{insight.title}</h4>
              <p className="text-xs text-gray-500">{insight.type}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-2">
        {/* Insight Details */}
        {selectedInsight && (
          <div>
            <h2>{selectedInsight.title}</h2>
            <p className="text-gray-600 my-4">{selectedInsight.content}</p>
            
            {selectedInsight.recommendations && (
              <div>
                <h4 className="font-semibold mt-4">Recommendations:</h4>
                <ul className="list-disc ml-4">
                  {selectedInsight.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Export all examples for documentation
export const examples = {
  ProblemPageWithPersonalization,
  MockInterviewWithPersonalization,
  VideoPlayerWithPersonalization,
  TutorWithMemory,
  QuizWithTracking,
  LearnigPathWithRecommendations,
  GoalTrackingPage,
  InsightsPage
};