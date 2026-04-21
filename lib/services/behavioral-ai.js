/**
 * Behavioral AI Service for Interview Analysis
 * Evaluates non-verbal cues, confidence, and speech patterns.
 */

export class BehavioralAIService {
  static analyzeSpeech(transcript) {
    const fillerWords = ["um", "uh", "like", "actually", "basically", "you know"];
    let fillerCount = 0;
    
    fillerWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = transcript.match(regex);
      if (matches) fillerCount += matches.length;
    });

    const wordCount = transcript.split(/\s+/).length;
    // Assuming average duration of 60 seconds per answer for pace calculation
    const pace = Math.round((wordCount / 1) * 1) || 0; // Words per minute estimate

    return {
      fillerCount,
      pace,
      transcriptQuality: wordCount > 20 ? "Good depth" : "Brief",
      hesitationDetected: fillerCount > 3
    };
  }

  static analyzeConfidence(signals) {
    // Signals would come from a client-side face/posture analyzer (e.g. MediaPipe / face-api)
    // Here we aggregate them for the final report
    const { eyeContact, posture, movement } = signals;
    
    let score = 70; // Base score
    if (eyeContact > 0.8) score += 15;
    if (posture === 'Upright') score += 10;
    if (movement === 'Neutral') score += 5;
    
    return Math.min(score, 100);
  }

  static generateSoftSkillFeedback(data) {
    const { confidenceScore, fillerCount, eyeContactScore } = data;
    const tips = [];

    if (confidenceScore < 60) tips.push("Try to focus on your breathing to reduce nervous movements.");
    if (fillerCount > 5) tips.push("Practice pausing briefly instead of using filler words like 'um' or 'uh'.");
    if (eyeContactScore < 70) tips.push("Maintaining eye contact with the camera helps build trust and show confidence.");

    return {
      tips,
      overallRating: confidenceScore > 80 ? "Exceptional" : confidenceScore > 60 ? "Good" : "Needs Improvement",
      communicationScore: Math.round(100 - (fillerCount * 5))
    };
  }
}
