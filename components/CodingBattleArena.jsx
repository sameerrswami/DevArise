'use client';

/**
 * CODING BATTLE ARENA
 * 
 * Main interactive component for live competitive coding battles
 * Features:
 * - Code editor with syntax highlighting
 * - Problem display
 * - Live leaderboard with WebSocket updates
 * - Real-time submission tracking
 * - Timer with visual countdown
 * - Results display post-battle
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import CodeEditor from './CodeEditor';
import BattleLeaderboard from './BattleLeaderboard';
import BattleResults from './BattleResults';

export default function CodingBattleArena({ battleId }) {
  const { data: session } = useSession();
  const router = useRouter();

  // State management
  const [battle, setBattle] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading, waiting, in-progress, completed, error
  const [leaderboard, setLeaderboard] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // WebSocket reference
  const socketRef = useRef(null);
  const timerRef = useRef(null);

  /**
   * Fetch battle details
   */
  const fetchBattleDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/battles/${battleId}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        setStatus('error');
        return;
      }

      setBattle(data.data);
      setStatus(data.data.status);

      // Find current user in participants
      if (session?.user?.email) {
        const userParticipant = data.data.participants.find(
          (p) => p.userEmail === session.user.email
        );
        setCurrentUser(userParticipant);
      }
    } catch (err) {
      console.error('Fetch battle details error:', err);
      setError('Failed to load battle details');
      setStatus('error');
    }
  }, [battleId, session?.user?.email]);

  /**
   * Initialize WebSocket connection
   */
  useEffect(() => {
    if (status === 'loading' || !battleId) return;

    // Connect to WebSocket
    const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');

      // Join battle room
      socket.emit('joinBattle', {
        battleId,
        userId: session?.user?.id,
        userName: session?.user?.name,
      });
    });

    // Listen for leaderboard updates
    socket.on('leaderboardUpdate', (data) => {
      setLeaderboard(data.leaderboard);
    });

    // Listen for submission notifications
    socket.on('submissionReceived', (data) => {
      setSubmissions((prev) => [
        {
          ...data,
          requestId: Math.random(),
        },
        ...prev.slice(0, 9), // Keep last 10
      ]);

      // Show toast notification
      setSuccessMessage(`${data.userName} solved problem!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    });

    // Listen for participant join
    socket.on('participantJoined', (data) => {
      setSuccessMessage(`${data.userName} joined the battle!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    });

    // Listen for battle start
    socket.on('battleStarted', (data) => {
      setStatus('in-progress');
      setBattle((prev) => ({
        ...prev,
        startedAt: data.startTime,
      }));
    });

    // Listen for time warnings
    socket.on('timeWarning', (data) => {
      setSuccessMessage(data.message);
      setTimeout(() => setSuccessMessage(''), 2000);
    });

    // Listen for battle end
    socket.on('battleEnded', (data) => {
      setStatus('completed');
      setBattle((prev) => ({
        ...prev,
        endedAt: new Date(),
      }));
    });

    // Listen for errors
    socket.on('error', (data) => {
      setError(data.message);
      setTimeout(() => setError(''), 5000);
    });

    socketRef.current = socket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [battleId, session?.user?.id, session?.user?.name, status]);

  /**
   * Timer effect
   */
  useEffect(() => {
    if (status !== 'in-progress' || !battle?.startedAt) return;

    const updateTimer = () => {
      const now = new Date();
      const startTime = new Date(battle.startedAt);
      const elapsedMs = now - startTime;
      const remainingMs = battle.timeLimit * 1000 - elapsedMs;
      const secondsRemaining = Math.max(0, Math.floor(remainingMs / 1000));

      setTimeRemaining(secondsRemaining);

      // Send time warnings at specific intervals
      if (secondsRemaining === 30 || secondsRemaining === 10 || secondsRemaining === 5) {
        socketRef.current?.emit('timeWarning', {
          battleId,
          totalTimeRemaining: secondsRemaining,
        });
      }

      // End battle when time runs out
      if (secondsRemaining === 0) {
        socketRef.current?.emit('battleEnded', {
          battleId,
          reason: 'Time limit reached',
        });
        setStatus('completed');
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status, battle?.startedAt, battle?.timeLimit, battleId]);

  /**
   * Handle code submission
   */
  const handleSubmitCode = useCallback(
    async (code, language) => {
      setSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`/api/battles/${battleId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, language }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error);
          return;
        }

        // Emit submission event to WebSocket
        socketRef.current?.emit('codeSubmitted', {
          battleId,
          userId: session?.user?.id,
          userName: session?.user?.name,
          status: data.data.status,
          score: data.data.score,
          problems: data.data.passedTestCases,
        });

        setSuccessMessage('Code submitted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);

        // Update leaderboard
        setLeaderboard(data.data.leaderboard);
      } catch (err) {
        console.error('Submit code error:', err);
        setError('Failed to submit code');
      } finally {
        setSubmitting(false);
      }
    },
    [battleId, session?.user?.id, session?.user?.name]
  );

  /**
   * Handle join battle
   */
  const handleJoinBattle = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/battles/${battleId}/join`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      setSuccessMessage('Successfully joined battle!');
      await fetchBattleDetails();
    } catch (err) {
      console.error('Join battle error:', err);
      setError('Failed to join battle');
    }
  }, [battleId, fetchBattleDetails]);

  /**
   * Handle start battle
   */
  const handleStartBattle = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/battles/${battleId}/start`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      socketRef.current?.emit('battleStarted', {
        battleId,
        startTime: data.data.startedAt,
        timeLimit: data.data.timeLimit,
      });

      setStatus('in-progress');
    } catch (err) {
      console.error('Start battle error:', err);
      setError('Failed to start battle');
    }
  }, [battleId]);

  // Load initial data
  useEffect(() => {
    fetchBattleDetails();
  }, [fetchBattleDetails]);

  // Error state
  if (status === 'error') {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <Alert variant="destructive">
          <p className="text-red-800">{error || 'Failed to load battle'}</p>
          <Button onClick={() => router.push('/battles')} className="mt-4">
            Back to Battles
          </Button>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading battle...</p>
        </div>
      </div>
    );
  }

  // Completed state - show results
  if (status === 'completed') {
    return <BattleResults battleId={battleId} />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{battle?.title}</h1>
        <p className="text-gray-600 mb-4">{battle?.problem?.title}</p>

        {/* Battle Info Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-600">Difficulty</p>
              <p className="font-semibold capitalize">{battle?.difficulty}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Participants</p>
              <p className="font-semibold">
                {battle?.statistics?.participantCount || 0}/{battle?.maxParticipants}
              </p>
            </div>
            {status === 'in-progress' && (
              <div>
                <p className="text-sm text-gray-600">Time Remaining</p>
                <p className={`font-bold text-lg ${timeRemaining <= 30 ? 'text-red-600' : ''}`}>
                  {timeRemaining !== null
                    ? `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60)
                      .toString()
                      .padStart(2, '0')}`
                    : '--:--'}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {status === 'waiting' && !currentUser && (
              <Button onClick={handleJoinBattle} size="lg">
                Join Battle
              </Button>
            )}
            {status === 'waiting' && currentUser && battle?.creator?.id === session?.user?.id && (
              <Button onClick={handleStartBattle} size="lg" variant="default">
                {battle?.statistics?.participantCount >= battle?.minParticipants
                  ? 'Start Battle'
                  : `${battle?.minParticipants - battle?.statistics?.participantCount} more needed`}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert ClassNameList= "mb-4 bg-green-50 border-green-200 text-green-800">
          {successMessage}
        </Alert>
      )}

      {/* Main Content */}
      {status === 'waiting' && !currentUser ? (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Join to participate</h2>
          <p className="text-gray-600 mb-6">
            Click the "Join Battle" button above to participate in this competitive coding challenge.
          </p>
          <Button onClick={handleJoinBattle} size="lg">
            Join Battle Now
          </Button>
        </Card>
      ) : (
        <Tabs defaultValue="code" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="code">Code Editor</TabsTrigger>
            <TabsTrigger value="problem">Problem</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="mt-4">
            <CodeEditor
              problem={battle?.problem}
              onSubmit={handleSubmitCode}
              isSubmitting={submitting}
              disabled={status !== 'in-progress'}
            />
          </TabsContent>

          <TabsContent value="problem" className="mt-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">{battle?.problem?.title}</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-6">{battle?.problem?.description}</p>

                {battle?.problem?.examples && battle.problem.examples.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold mb-4">Examples:</h3>
                    {battle.problem.examples.map((example, idx) => (
                      <div key={idx} className="mb-4 font-mono text-sm">
                        <p>
                          <strong>Input:</strong> {example.input}
                        </p>
                        <p>
                          <strong>Output:</strong> {example.output}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {battle?.problem?.constraints && (
                  <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">Constraints:</h3>
                    <p className="text-sm text-gray-700">{battle.problem.constraints}</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-4">
            <BattleLeaderboard leaderboard={leaderboard} currentUserId={session?.user?.id} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
