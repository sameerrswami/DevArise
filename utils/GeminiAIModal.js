async function postInterviewAi(body) {
  const response = await fetch("/api/interview/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || "AI request failed");
  }

  return data;
}

export async function generateInterviewQuestions({
  jobPosition,
  jobDesc,
  jobExperience,
  questionCount,
}) {
  const data = await postInterviewAi({
    action: "generate-questions",
    jobPosition,
    jobDesc,
    jobExperience,
    questionCount,
  });

  return data.questions;
}

export async function evaluateInterviewAnswer({
  question,
  correctAnswer,
  userAnswer,
}) {
  const data = await postInterviewAi({
    action: "evaluate-answer",
    question,
    correctAnswer,
    userAnswer,
  });

  return data.evaluation;
}

export async function generateDynamicQuestion({
  jobPosition,
  jobExperience,
  history,
}) {
  const data = await postInterviewAi({
    action: "generate-dynamic-question",
    jobPosition,
    jobExperience,
    history,
  });

  return data.question;
}

export async function evaluateSession({ history }) {
  const data = await postInterviewAi({
    action: "evaluate-session",
    history,
  });

  return data.evaluation;
}
