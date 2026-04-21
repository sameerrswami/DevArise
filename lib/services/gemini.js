import { GoogleGenerativeAI } from "@google/generative-ai";

const TUTOR_SYSTEM_PROMPT = `
You are the DevArise AI Tutor, a highly knowledgeable and professional computer science instructor specializing in subjects like Data Structures and Algorithms (DSA), Operating Systems (OS), Database Management Systems (DBMS), Computer Networks, and Web Development. Your target audience is BTech, BCA, and BSc IT students.

Your behavior guidelines:
1. Tone: Formal, supportive, instructional, and expert. Avoid unnecessary casual language.
2. Structure for Explanations: 
   - Start with basic intuition (conceptual foundation).
   - Provide a step-by-step thorough technical explanation.
   - End with examples or real-world applications where applicable.
3. Coding related questions: 
   - Explain the logic clearly.
   - Provide optimized code solutions (ensure high performance).
   - Include Time and Space Complexity analysis for every solution.
4. Interview Preparation: 
   - If the user is preparing for interviews, simulate real interview-style answers.
   - Provide commonly expected responses and highlight key points that interviewers look for.
5. Continuous Learning: 
   - Generate follow-up questions, quizzes, and practice problems based on the current topic to reinforce learning at the end of each major explanation.
6. Context Awareness: 
   - Maintain continuity of interactions. Use the provided history to recall topics the user previously struggled with and revisit them with improved explanations if necessary.
7. Technical Accuracy: Ensure every explanation is technically accurate and follows academic standards for BTech/BCA/BSc IT.
8. Formatting: Always use Markdown for structure, bolding for emphasis, and code blocks for code.

Stay in character as a professional CS Mentor at all times.
`;

const BUDDY_SYSTEM_PROMPT = `
You are the DevArise AI Buddy, a friendly, supportive, and highly relatable college senior who helps users stay motivated and consistent during their placement preparation journey.

Your personality:
1. Tone: Casual, conversational, and approachable. Use simple language and light humor.
2. Relatability: Talk like a helpful senior (big brother/sister). Understand college struggles (late nights, placement anxiety, burnout).
3. Encouragement: Use supportive phrases to reduce stress. Celebrate small wins to build user confidence.
4. Explanations: Simplify technical concepts using relatable analogies instead of dry, structured technical lectures.
5. Empathy: If the user is stressed or demotivated, offer reassurance and suggest small, actionable steps to regain momentum.
6. Memory: Reference past discussions, struggles, or achievements from the history to create a sense of continuity and friendship.
7. Role: Your primary goal is to be a companion that keeps the user engaged and emotionally supported.

Stay in character as a chill but wise senior at all times.
`;

const INTERVIEWER_SYSTEM_PROMPT = `
You are the DevArise AI Interviewer, an expert recruiter specialized in technical and HR interviews for BTech, BCA, and BSc IT students.

Your behavior guidelines:
1. Tone: Professional, realistic, yet encouraging. Act like an interviewer from a top tech company.
2. Dynamic Flow: 
   - Based on the user's selected role (Frontend, Backend, SDE, etc.) and experience level, conduct a multi-round interview.
   - Start with a natural introduction, then move into technical and behavioral questions.
   - Use adaptive difficulty: If the user answers well, ask harder questions or probe deeper. If they struggle, provide a slight hint or pivot to a related concept to gauge their baseline.
3. Follow-up Questions: Actively probe deeper into their answers (e.g., "You mentioned using Redux for state management, why not Context API in that specific case?").
4. Evaluation: 
   - Analyze technical accuracy, problem-solving approach, and communication clarity.
   - For voice transcripts, identify hesitation, filler words (um, ah, like), and speaking clarity.
5. Empathy: Help build user confidence through supportive but firm framing.

Stay in character as a professional Interviewer at all times.
`;

const CODE_MENTOR_SYSTEM_PROMPT = `
You are the DevArise AI Code Mentor, an elite software engineer and mentor specialized in explaining complex code, debugging logical errors, and optimizing performance.

Your behavior guidelines:
1. Tone: Expert, patient, and pedagogical. You don't just fix code; you teach the user how to think.
2. Line-by-Line Explanation: When analyzing code, provide a detailed breakdown of each logical section.
3. Dry Run Simulation: Simulate the execution of the code with sample inputs. Show how variables change state at each critical step.
4. Bug Detection: Identify logical bugs, edge case vulnerabilities (null pointers, off-by-one errors, overflow), and inefficient patterns.
5. Optimization: Suggest improvements for time and space complexity with clear O(n) notation.
6. Feedback Structure:
   - Summary of what the code does.
   - Line-by-Line walkthrough.
   - Execution Trace (Dry Run).
   - Bugs & Edge Cases.
   - Optimized Version & Performance analysis.

Stay in character as a professional Senior Engineer at all times.
`;

const PLACEMENT_ROADMAP_PROMPT = `
You are the DevArise AI Placement Strategist, an expert career counselor who helps students land jobs at top tier product-based (FAANG/MAANG) and service-based companies.

Guidelines for Roadmaps:
1. Personalization: Tailor the plan based on the user's current year (1st, 2nd, 3rd, Final), target company type, and current skill level.
2. Structure: Break the roadmap into specific phases (e.g., Foundations, Intermediate, Advanced, Interview Prep).
3. Weekly/Daily Breakdown: Provide specific tasks for each week.
4. Adaptability: Include milestones and logic for adjustment (e.g., "If you master Arrays in 3 days, skip to Strings").
5. Balanced Focus: Include DSA, Core Subjects (OS/DBMS/CN), Projects, and Soft Skills.

Return the roadmap in a structured JSON format.
`;

export class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.modelName = "models/gemini-1.5-flash";
  }

  getModel(modelName = this.modelName) {
    return this.genAI.getGenerativeModel({ model: modelName });
  }

  extractJsonBlock(text) {
    if (!text || typeof text !== "string") {
      throw new Error("Empty AI response");
    }

    const cleaned = text.replace(/```json|```/gi, "").trim();

    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) return arrayMatch[0];

    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) return objectMatch[0];

    throw new Error("No JSON payload found in AI response");
  }

  async generateVideoSummary(title, description) {
    try {
      const model = this.getModel();

      const prompt = `
        Create a concise, educational summary of this video:

        Title: ${title}
        Description: ${description}

        - Explain what the viewer will learn
        - Highlight key concepts
        - Mention target audience
        - Keep under 150 words
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Summary unavailable.";
    }
  }

  async generateQuiz(title, description) {
    try {
      const model = this.getModel();

      const prompt = `
        Create 3 MCQs based on:

        Title: ${title}
        Description: ${description}

        Return JSON:
        [
          {
            "question": "",
            "options": ["", "", "", ""],
            "correctAnswer": 0,
            "explanation": ""
          }
        ]
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("Quiz Error:", error);
      return [];
    }
  }

  async generateLearningNotes(content) {
    try {
      const model = this.getModel();
      const prompt = `
        As an expert CS Instructor, generate concise, structured study notes for the following content.
        
        Content:
        ${content}
        
        Format:
        1. Context & Importance
        2. Core Concepts (Bulleted)
        3. Key Takeaways
        4. Practical Application
        
        Use clean Markdown with bolding for emphasis.
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Notes Error:", error);
      return "Study notes are currently being processed.";
    }
  }

  async curateLearningContent(topic, level) {
    try {
      const model = this.getModel();
      const prompt = `
        The user wants to learn "${topic}" at level "${level}".
        Provide a list of 5 key sub-topics and their specific search terms for high-quality video content.
        
        Return JSON:
        [
          {"title": "Subtopic Title", "searchTerm": "youtube search query", "difficulty": "Beginner"}
        ]
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("Curation Error:", error);
      return [];
    }
  }

  async generateInterviewQuestions(jobPosition, jobDescription, jobExperience, questionCount = 10) {
    try {
      const model = this.getModel();

      const prompt = `
        Generate ${questionCount} interview questions.

        Role: ${jobPosition}
        Description: ${jobDescription}
        Experience: ${jobExperience}

        Return JSON:
        [
          {
            "question": "",
            "answer": ""
          }
        ]
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("Interview Error:", error);
      throw error;
    }
  }

  async evaluateInterviewAnswer(question, correctAnswer, userAnswer) {
    try {
      const model = this.getModel();

      const prompt = `
        Evaluate answer.

        Question: ${question}
        Correct: ${correctAnswer}
        User: ${userAnswer}

        Return JSON:
        {
          "rating": "x/10",
          "feedback": ""
        }
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("Evaluation Error:", error);
      throw error;
    }
  }

  async enhanceJobKeywords(jobTitle, jobDescription) {
    try {
      const model = this.getModel();

      const prompt = `
        Analyze job and return JSON:
        {
          "title": "",
          "summary": "",
          "keywords": []
        }

        Job Title: ${jobTitle}
        Description: ${jobDescription}
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("Enhance Error:", error);
      return {
        title: jobTitle,
        summary: "Failed",
        keywords: [],
      };
    }
  }

  async categorizeDifficulty(title, description) {
    try {
      const model = this.getModel();

      const prompt = `
        Categorize:

        Title: ${title}
        Description: ${description}

        Return: beginner | intermediate | advanced
      `;

      const result = await model.generateContent(prompt);
      const difficulty = result.response.text().toLowerCase().trim();

      if (["beginner", "intermediate", "advanced"].includes(difficulty)) {
        return difficulty;
      }
      return "beginner";
    } catch (error) {
      console.error("Difficulty Error:", error);
      return "beginner";
    }
  }

  async chat(message, history = []) {
    try {
      const model = this.getModel();

      const chat = model.startChat({
        history: history.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
        generationConfig: { maxOutputTokens: 500 },
      });

      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error) {
      console.error("Chat Error:", error);
      throw error;
    }
  }

  async generateRoadmap(topic) {
    try {
      const model = this.getModel();

      const prompt = `
        Create 5-step roadmap for: ${topic}

        Return JSON:
        [
          {
            "title": "",
            "description": "",
            "duration": "",
            "topics": []
          }
        ]
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("Roadmap Error:", error);
      throw error;
    }
  }

  async tutorExplain(topic) {
    try {
      const model = this.getModel();
      const prompt = `
        ${TUTOR_SYSTEM_PROMPT}

        Topic: "${topic}"
        
        Provide a comprehensive, professional lesson on this topic following your structural guidelines.
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Tutor Explain Error:", error);
      throw error;
    }
  }

  async tutorChat(topic, message, history = []) {
    try {
      const model = this.getModel();
      const primedHistory = [
        {
          role: "user",
          parts: [{ text: `${TUTOR_SYSTEM_PROMPT}\n\nThe student is currently learning about "${topic}".` }]
        },
        {
          role: "model",
          parts: [{ text: `I understand. I am the DevArise AI Tutor for "${topic}". I will provide structured, technical, and professional instruction. How can I assist you in your learning journey today?` }]
        },
        ...history.map(msg => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        }))
      ];

      const chat = model.startChat({
        history: primedHistory,
        generationConfig: { maxOutputTokens: 1000 },
      });

      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error) {
      console.error("Tutor Chat Error:", error);
      throw error;
    }
  }

  async buddyChat(message, history = []) {
    try {
      const model = this.getModel();
      const primedHistory = [
        {
          role: "user",
          parts: [{ text: `${BUDDY_SYSTEM_PROMPT}` }]
        },
        {
          role: "model",
          parts: [{ text: "Hey there! I'm your DevArise AI Buddy. Think of me as your chill senior who's been through the grind and is here to keep you sane, motivated, and moving forward. What's up? How's the prep going today?" }]
        },
        ...history.map(msg => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        }))
      ];

      const chat = model.startChat({
        history: primedHistory,
        generationConfig: { maxOutputTokens: 800 },
      });

      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error) {
      console.error("Buddy Chat Error:", error);
      throw error;
    }
  }

  async codingReview(problem, code, language) {
    try {
      const model = this.getModel();
      const prompt = `
        ${CODE_MENTOR_SYSTEM_PROMPT}

        You are reviewing a code submission for the problem: "${problem.title}".
        Difficulty: ${problem.difficulty}
        Language: ${language}
        
        Code Submitted:
        \`\`\`
        ${code}
        \`\`\`
        
        Evaluate the code against production-ready engineering standards. You must deeply analyze correctness, logic, performance, and boundary limits.
        
        Provide high-quality, unsparingly honest feedback in JSON format:
        {
          "status": "Accepted" | "Logic Error" | "Inefficient" | "Compilation Error",
          "feedback": "A very detailed, senior-engineer level critique of their approach. Explain WHY it works or fails.",
          "timeComplexity": "O(...)",
          "spaceComplexity": "O(...)",
          "edgeCasesMissed": ["List specific potential inputs that would break this code (e.g. empty arrays, extreme bounds, negative constraints)"],
          "optimizations": "Provide exact recommendations on how to restructure the algorithm for maximum efficiency. If it is already optimal, explain why."
        }
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("Coding Review Error:", error);
      return { status: "Error", feedback: "Failed to review code." };
    }
  }

  async codingHint(problem, currentCode, hintLevel) {
    try {
      const model = this.getModel();
      const prompt = `
        The user is struggling with the problem: "${problem.title}".
        Difficulty: ${problem.difficulty}
        Current Code:
        ${currentCode}
        
        Provide hint level ${hintLevel} (1: Intuition, 2: Approach, 3: Step-by-step logic).
        Be encouraging like a supportive senior. Do NOT give the full code.
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Coding Hint Error:", error);
      return "Keep thinking! You've got this.";
    }
  }

  async generateDynamicInterviewQuestion(role, experience, history = []) {
    try {
      const model = this.getModel();
      const prompt = `
        ${INTERVIEWER_SYSTEM_PROMPT}

        Context:
        Role: ${role}
        Experience: ${experience}

        Based on the interview history so far, generate the NEXT interview question. 
        If the interview should end, return "END_INTERVIEW".
        
        Requirements:
        1. If technical, include a specific scenario or coding logical problem.
        2. If behavioral, ask about real experiences.
        3. Adaptive: Adjust difficulty based on previous answers.
        
        History:
        ${JSON.stringify(history)}
        
        Return ONLY the question text.
      `;

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error("Dynamic Question Error:", error);
      return "Could you tell me more about your recent projects?";
    }
  }

  async evaluateInterviewSession(history) {
    try {
      const model = this.getModel();
      const prompt = `
        ${INTERVIEWER_SYSTEM_PROMPT}

        You must meticulously evaluate the following interview transcript. As an elite technical recruiter comparing this candidate against a high-bar standard, you must not sugarcoat errors. Find the nuances in their logic, tone, and clarity.
        
        Transcript History:
        ${JSON.stringify(history)}
        
        Provide an exhaustive evaluation. Your JSON fields MUST be detailed, analytical, and highly specific to the context discussed. Do not use generic filler text. Determine exactly where they hesitated or failed to dive deep into trade-offs.
        
        Return JSON strictly matching this schema:
        {
          "overallScore": 85, // Number 0-100 indicating hireability 
          "metrics": {
             "technical": 8, // 0-10 scale
             "communication": 7,
             "problemSolving": 9,
             "confidence": 6
          },
          "feedback": {
             "overallImpression": "Paragraph summarizing their hireability, red flags, and strongest traits.",
             "strengths": ["Insight 1", "Insight 2", "Insight 3"], 
             "mistakes": ["Specific technical logic flaw they made", "Behavioral misstep", "Rambling on question X"],
             "improvements": ["Actionable step 1", "Actionable step 2"],
             "fillerWordAnalysis": "Detailed paragraph dissecting their pacing, use of filler words, hesitation delays, and speech authority."
          },
          "idealAnswers": [
             {"question": "The specific question asked", "idealResponse": "How a Senior Engineer would have constructed this answer perfectly in 3-4 sentences."}
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("Evaluation Error:", error);
      throw error;
    }
  }

  async analyzeResume(resumeText) {
    try {
      const model = this.getModel();
      const prompt = `
        Analyze the following resume text as an expert Technical Recruiter and ATS system.
        
        Resume Content:
        ${resumeText}
        
        Return JSON analysis:
        {
          "score": "x/100",
          "details": {
            "keywords": "Score and feedback on keyword optimization",
            "skills": "Score and feedback on technical skill relevance",
            "projects": "Score and feedback on project quality and impact",
            "formatting": "Score and feedback on layout and clarity"
          },
          "suggestions": {
            "missingSections": [],
            "weakPoints": [],
            "actionItems": []
          },
          "parsedInfo": {
            "skills": [],
            "topProjects": [],
            "education": ""
          }
        }
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("Resume Analysis Error:", error);
      throw error;
    }
  }

  async analyzeGitHub(githubData) {
    try {
      const model = this.getModel();
      const prompt = `
        Analyze this GitHub profile information:
        ${JSON.stringify(githubData)}
        
        Evaluate technical complexity, consistency, and professional presence.
        
        Return JSON:
        {
          "score": "x/100",
          "feedback": "Overall technical presence analysis",
          "strengths": [],
          "areasToImprove": [],
          "recommendedProjects": ["Ideas for new projects based on their current gap"]
        }
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("GitHub Analysis Error:", error);
      throw error;
    }
  }

  async matchResumeWithJD(resumeText, jobDescription) {
    try {
      const model = this.getModel();
      const prompt = `
        Compare the resume with the Job Description (JD).
        
        Resume: ${resumeText}
        JD: ${jobDescription}
        
        Return JSON:
        {
          "matchPercentage": "x%",
          "missingSkills": [],
          "matchingSkills": [],
          "alignmentFeedback": "How well the candidate fits this specific role",
          "resumeTweaks": "Specific small changes to improve matching for THIS role"
        }
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("JD Match Error:", error);
      throw error;
    }
  }

  async recommendJobs(userProfile, jobList) {
    try {
      const model = this.getModel();
      const prompt = `
        Given the user profile and a list of job postings, rank the jobs by compatibility and provide a score (0-100) for each.
        
        User Profile (Skills, Projects, Level):
        ${JSON.stringify(userProfile)}
        
        Job Postings:
        ${JSON.stringify(jobList)}
        
        Return JSON:
        [
          {
            "jobId": "id from jobList",
            "score": 85,
            "reason": "Brief explanation of why it's a good match"
          }
        ]
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("Job Recommendation Error:", error);
      return [];
    }
  }

  async analyzeJobGap(userProfile, jobDetails) {
    try {
      const model = this.getModel();
      const prompt = `
        Compare user profile with this specific job. Identify missing skills and suggest learning resources.
        
        User: ${JSON.stringify(userProfile)}
        Job: ${JSON.stringify(jobDetails)}
        
        Return JSON:
        {
          "missingSkills": ["React", "AWS", etc],
          "learningPath": [
            {"skill": "React", "suggestion": "Try the 'Frontend' roadmap and solve 5 Array problems"}
          ],
          "compatibility": "High/Medium/Low"
        }
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("Job Gap Analysis Error:", error);
      throw error;
    }
  }

  async calculatePlacementReadiness(userData) {
    try {
      const model = this.getModel();
      const prompt = `
        As a Senior Lead Recruiter, calculate the "Placement Readiness Score" (0-100) for this student.
        
        Data:
        - Coding Submissions: ${JSON.stringify(userData.submissions)}
        - Interview Performance: ${JSON.stringify(userData.interviews)}
        - Profile Strength (Resume): ${JSON.stringify(userData.resumeData)}
        - Preparation Level: ${userData.preparationLevel}
        
        Return JSON:
        {
          "overallScore": 82,
          "breakdown": {
            "coding": 85,
            "interview": 70,
            "communication": 75,
            "profile": 90
          },
          "topicPerformance": [
            {"topic": "Arrays", "score": 90},
            {"topic": "Graphs", "score": 40},
            {"topic": "Trees", "score": 60},
            {"topic": "DP", "score": 30},
            {"topic": "OS", "score": 75},
            {"topic": "DBMS", "score": 80}
          ],
          "readinessLevel": "Intermediate / Job-Ready in 2 weeks"
        }
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("Readiness Calculation Error:", error);
      return { overallScore: 0, breakdown: {}, topicPerformance: [], readinessLevel: "Awaiting Data" };
    }
  }

  async generateDashboardInsights(userData) {
    try {
      const model = this.getModel();
      const prompt = `
        Provide 3-4 highly specific, actionable insights for the user's dashboard.
        Focus on their WEAKEST areas based on this data:
        ${JSON.stringify(userData)}
        
        Return JSON Array:
        [
          {
            "type": "Improvement" | "Milestone" | "Goal",
            "title": "Master Graphs",
            "description": "You've missed 3 graph problems recently. Focus on BFS/DFS specifically.",
            "link": "/problems?category=Graphs",
            "priority": "High" | "Medium" | "Low"
          }
        ]
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("Insights Error:", error);
      return [];
    }
  }

  async explainCode(code, language, context = "") {
    try {
      const model = this.getModel("models/gemini-1.5-pro"); // Pro is better for complex code analysis
      const prompt = `
        ${CODE_MENTOR_SYSTEM_PROMPT}

        Language: ${language}
        Additional Context: ${context}
        Code:
        ${code}

        Perform a deep analysis and provide a detailed explanation, dry run, bug report, and optimizations.
        Use Markdown for the response.
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Code Mentor Error:", error);
      throw error;
    }
  }

  async generateDetailedPlacementRoadmap(userData) {
    try {
      const model = this.getModel("models/gemini-1.5-pro");
      const prompt = `
        ${PLACEMENT_ROADMAP_PROMPT}

        User Profile:
        - Academic Year: ${userData.year}
        - Target Role: ${userData.targetRole}
        - Target Company Type: ${userData.targetCompanyType}
        - Current Skill Level: ${userData.skillLevel}
        - Familiar Subjects: ${userData.subjects?.join(", ")}
        - Daily Time Commitment: ${userData.dailyTime} hours

        Generate a highly detailed, personalized placement preparation roadmap.
        
        Return JSON ONLY:
        {
          "summary": "High level strategy",
          "totalDurationWeeks": 12,
          "phases": [
            {
              "name": "Phase Name",
              "duration": "Duration",
              "objective": "What to achieve",
              "topics": ["Topic 1", "Topic 2"],
              "weeks": [
                {
                  "weekNumber": 1,
                  "focus": "Main focus of the week",
                  "dailyTasks": {
                    "Mon": "Task details",
                    "Tue": "Task details",
                    "Wed": "Task details",
                    "Thu": "Task details",
                    "Fri": "Task details",
                    "Sat": "Practice/Revision",
                    "Sun": "Mock Test/Rest"
                  },
                  "resources": ["Resource links/names"],
                  "practiceGoals": "Specific problems to solve"
                }
              ]
            }
          ],
          "milestones": [
            {"title": "Milestone name", "criteria": "How to know you reached it"}
          ],
          "adaptabilityAdvice": "Advice on how to adjust the plan based on speed"
        }
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("Roadmap Generation Error:", error);
      throw error;
    }
  }

  async adjustRoadmap(currentRoadmap, progressData, performanceData) {
    try {
      const model = this.getModel("models/gemini-1.5-pro");
      const prompt = `
        As the DevArise AI Placement Strategist, you need to ADJUST the user's current preparation roadmap based on their recent progress and performance.

        Current Roadmap Summary: ${currentRoadmap.summary}
        Current Phase: ${currentRoadmap.activePhaseName}
        
        Progress Data:
        ${JSON.stringify(progressData)}
        
        Performance Data (Contests/Practice):
        ${JSON.stringify(performanceData)}

        Analysis Goals:
        1. If user is CONSISTENTLY missing coding tasks, allocate more time to simpler DSA foundations.
        2. If user is EXCELLING in a topic, accelerate through that phase and move to more advanced topics.
        3. If user is struggling with core subjects (OS/DBMS), add specific deep-dive daily tasks.
        4. Maintain the overall target date if possible, but prioritize depth of understanding over speed.

        Return the ADJUSTED roadmap in the same structured JSON format as the original.
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("Roadmap Adjustment Error:", error);
      throw error;
    }
  }

  async recommendProjects(userData) {
    try {
      const model = this.getModel("models/gemini-1.5-pro");
      const prompt = `
        As the DevArise AI Project Architect, recommend 3-5 software development projects for a user based on their profile.

        User Profile:
        - Current Skill Level: ${userData.skillLevel}
        - Interests: ${userData.interests?.join(", ") || "Web Development"}
        - Target Job Role: ${userData.targetRole}
        - Resume Analysis (Existing Skills): ${JSON.stringify(userData.resumeData?.parsedInfo?.skills || [])}
        - Portfolio Gaps: ${JSON.stringify(userData.resumeData?.suggestions?.weakPoints || [])}

        Guidelines:
        1. Categorize each project as Beginner, Intermediate, or Advanced.
        2. Ensure projects fill technical gaps identified in the resume analysis.
        3. Suggest a modern tech stack (tools, frameworks, databases) for each project.
        4. Provide a "Career Impact" explanation: How this project helps them get hired for ${userData.targetRole}.
        
        Return JSON ONLY:
        [
          {
            "title": "Project Title",
            "difficulty": "Intermediate",
            "summary": "Brief description of the project and its core features.",
            "techStack": ["React", "Node.js", "PostgreSQL", "Redis"],
            "difficultyReason": "Why this level?",
            "learningObjectives": ["Objective 1", "Objective 2"],
            "careerImpact": "Detailed explanation of why this project is great for their target role",
            "estimatedTime": "Time to complete (e.g., 2 weeks)",
            "keyFeatures": ["Feature 1", "Feature 2"],
            "gapFilled": "The specific gap in their portfolio this project addresses"
          }
        ]
      `;

      const result = await model.generateContent(prompt);
      const json = this.extractJsonBlock(result.response.text());
      return JSON.parse(json);
    } catch (error) {
      console.error("Project Recommendation Error:", error);
      throw error;
    }
  }
}