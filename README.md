# 🧠 DevArise AI - The Complete Career & Learning Ecosystem

**DevArise AI** (formerly NeuroLearn AI) is a highly sophisticated, production-grade EdTech ecosystem designed from the ground up for aspiring software engineers. It bridges the gap between theoretical computer science concepts and practical placement readiness by enveloping the user in a highly responsive, AI-driven environment.

Rather than offering isolated features, DevArise acts as a **unified intelligence engine** that continuously learns from a user's coding submissions, interview hesitations, and theoretical knowledge to generate highly personalized career roadmaps and real-time performance analytics.

---

## 🏗️ Architectural Core: The System Orchestrator
DevArise is built on an event-driven architecture using a custom `SystemOrchestrator` (`lib/services/orchestrator.js`). This ensures there is absolutely zero data isolation across the platform.

**The Orchestrator Loop:**
1. **Action**: The user performs a high-value task (e.g., submitting a Python array solution, uploading a resume, answering a technical interview question).
2. **Event Dispatch**: The API resolves the action and fires a global event (e.g., `SystemEvents.PROBLEM_SOLVED`).
3. **Synchronization**: The Orchestrator intercepts the event in the background and:
   - Recalculates the master **Placement Readiness Score**.
   - Awards relative **Experience Points (XP)** to the gamification database.
   - Adjusts the user's underlying **Preparation Level** (Beginner -> Intermediate) altering future algorithmic difficulty.

---

## 🗺️ Comprehensive Page-by-Page Feature Mapping

Every route handles specific logic designed to guide students fluidly from onboarding to job application.

### 🏠 1. Identity & Onboarding 
*   **`/` (Landing Platform)**: High-performance marketing portal utilizing complex `framer-motion` timelines and glassmorphic UI elements to highlight features.
*   **`/sign-in` & `/sign-up` (NextAuth Subsystem)**: Extends standard credentials with Social OAuth. Upon first mount, triggers a deep onboarding flow collecting `targetRole` (e.g., Backend Developer), current degree type, and perceived skill level to instantly configure the AI's baseline difficulty.

### 📊 2. The Command Center
*   **`/dashboard`**: The master analytics hub.
    *   **Placement Readiness Radar**: Uses dynamic `Recharts` data to map a user's competence across 4 core areas: Coding Logic, Communication, Interview Psychology, and Profile Depth.
    *   **AI Growth Insights**: Rather than standard notifications, the dashboard generates contextual, prioritized directives (e.g., *"High Priority: You missed edge cases in your last 3 Graph problems. Route to `/courses` to restudy BFS."*).

### 🤖 3. The Mock Interview Simulator
*   **`/dashboard/interview`**: Generates new interview configurations requiring a Job Title, Description, and Years of Experience.
*   **`/dashboard/interview/[id]` (Hardware Calibration)**: Locks progress until `react-webcam` and `react-hook-speech-to-text` establish valid permissions and pass functional environment checks.
*   **`/dashboard/interview/[id]/start` (Live Session)**: The high-stress emulation room. The AI operates on a "Dynamic Senior HR Interviewer" prompt, asking follow-up questions adapted from the user's live audio transcripts.
*   **`/dashboard/interview/[id]/feedback` (Deep Analysis Screen)**:
    *   *Speech Telemetry*: Calculates active WPM (Words Per Minute) and identifies exact moments of hesitation or filler-word ("um", "uh") crutches.
    *   *The "Ideal Target"*: Evaluates technical accuracy and creates a side-by-side comparison of the user's transcript versus exactly how a Senior FAANG candidate would have phrased the logic in 3 sentences.

### 💻 4. Coding & Algorithm Engine
*   **`/problems/[slug]`**: An integrated Monoco/CodeMirror IDE execution space.
    *   **Elite Code Evaluation**: The Submission API (`/api/problems/submit`) does not rely on simple unit tests. The payload is sent to Gemini instructed strictly as a "Senior Code Reviewer".
    *   **Complexity Enforcement**: The AI actively calculates the Big-O Time & Space complexity of the submission.
    *   **Boundary Detection**: Submissions receive harsh critique for missed structural boundaries, returning an array of specific `edgeCasesMissed` (e.g., integer overflows, empty arrays).
*   **Security Gating**: The backend actively limits payload buffer sizes to 50,000 characters to prevent memory-spike DoS attacks through the code executor.

### 🎓 5. The Knowledge Studio
*   **`/courses/[id]/learn/[topicId]`**: Cinematic, structured learning paths covering core conceptual science (OS, DBMS, OOP).
*   **Active Summarization**: Binds a YouTube video ID overlay with asynchronous AI processing that reads the educational transcript, generating formatted "Key Takeaways" and bulleted Context sheets.
*   **Embedded Active Recall**: Concludes study sessions with dynamically generated Multiple Choice Quizzes to convert short-term memory to long-term retention. 

### 💼 6. Career Bridging & Resume Analytics
*   **`/resume`**: An ATS (Applicant Tracking System) emulator. Users upload their PDF. The platform scans formatting, deeply evaluates project impacts, and automatically extracts technical buzzwords (e.g., "Docker", "Redux") into the global User DB model.
*   **`/roadmap`**: Constructs a tailored, week-by-week curriculum. If the user masters Arrays quickly, the generative logic adapts and shortens the learning phase dynamically.
*   **`/jobs`**: A localized job board that cross-references the User's parsed resume skills against requested traits, highlighting verbatim "Missing Skills".

### 🏆 7. Gamification & Progression
*   **`/dashboard/rewards`**: A psychological engagement mechanism.
    *   **Tier Progression**: Tracks streaks and cumulative XP to rank users up.
    *   **The Points Store**: A modeled virtual economy where users expend earned "Study Points" to permanently unlock premium features like *Unlimited AI Tutoring* or *Advanced System Design Problems*.

---

## 🛠️ The Technology Stack

### Frontend Architecture
- **Next.js 14 App Router**: Utilized for highly performant Server-Side Generation (SSG) and robust API routing.
- **Tailwind CSS & Shadcn UI**: Deeply customized utility classes merged with accessible, headless UI components to maintain a stark, "Dark Mode Glassmorphic" design language system.
- **Framer Motion**: Deployed across the system to intercept heavy AI loading states with calming, intentional micro-animations (`Loader2` spinners, pulsing icons), preventing user anxiety during asynchronous delays.

### Backend & Database Intelligence
- **Google Gemini 1.5 Advanced Models**: Heavy prompt-engineering dictates strict JSON-schema outputs, ensuring the database only ever receives perfectly structured strings from the LLM.
- **PostgreSQL & Prisma ORM**: A highly relational schema tying `User` -> `TopicProgress` -> `MockInterviews` -> `Submissions` -> `PointTransactions` securely.
- **Edge Middleware Security**: `middleware.js` resides globally, intercepting unauthenticated JWT routing attempts, validating Recruiter roles, and applying strict HTTP Security Headers before Node.js resources are ever consumed.
- **Tier-Based API Gating (`lib/gating.js`)**: Backend logic intrinsically measures a user's Database footprint against their `isPremium` Stripe status, cleanly terminating API usage for free users attempting to exploit expensive AI bandwidth.

---

## ⚙️ Initialization & Deployment

Ensure Node.js 18+ is installed on your local machine.

### 1. Clone & Install
```bash
git clone https://github.com/your-username/NeuroLearn-Ai.git
cd NeuroLearn-Ai
npm install
```

### 2. Environment Configuration
Create a `.env` file containing the necessary secret bindings:
```env
# Database Connections
DATABASE_URL="postgresql://user:password@localhost:5432/devarise"

# Auth Keys
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate_a_secure_random_string_here"

# AI Integrations
GEMINI_API_KEY="your_google_studio_key"

# Monetization
STRIPE_SECRET_KEY="sk_test_..."
```

### 3. Database Hydration
Push the Prisma schemas to your active Postgres instance:
```bash
npx prisma generate
npx prisma db push
```

### 4. Development Instance
```bash
npm run dev
```
Navigate to `http://localhost:3000` to enter the platform.

---

*Engineered for Excellence. DevArise AI was designed not simply to function, but to fundamentally recreate the rigor of a FAANG-level career preparation journey within an automated digital space.*
