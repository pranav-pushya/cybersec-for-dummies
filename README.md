# 🛡️ Cybersecurity For Dummies - Interactive Companion WebApp

Welcome to the interactive companion dashboard for **Cybersecurity For Dummies**! This modern, feature-rich web application is designed to help everyday users master security concepts, audit their personal cybersecurity posture, practice identifying phishing attempts, and test their knowledge with customizable quizzes.

---

## 🌟 Key Features

### 💻 1. Retro-Hacker Console UI & Aesthetic
*   **Dynamic Matrix Node Background**: Real-time HTML5 Canvas drawing cascading vertical data lines and glowing network node dots (modeled directly after cyber grid nodes).
*   **CRT Scanline overlay & Screen Flicker**: Simulates the warm refresh cycles of legacy green-phosphor hacking terminals.
*   **Glitching Text Pulse**: Breathing neon shadows on key headers and the main cybersecurity logo.
*   **Interactive Header Controls**: Quick access buttons for settings configurations, themes, and sidebar controllers.

### 🚪 2. Home Gate Landing Console
*   **Central entry point**: Introduces the book companion and provides immediate entrance routes.
*   **Real-Time Diagnostics**:
    *   *Node Parameters*: Readouts for OS Kernel, Privilege level (`ROOT_AUTH`), and Active ports.
    *   *System integrity check*: Status monitors for active protection modules.
    *   *Session Tracker*: Live display of bookmarks saved, overall reading percentage, and the exact title of the last read chapter.
*   **Syllabus Decrypter**: Highlights the outline and target goals of the book's four main parts.

### 🤖 3. Intelligent AI Security Assistant
*   **Groq API Integration**: Powered by Groq's super-fast `llama-3.1-8b-instant` LLM.
*   **Ask Anything**: Prompt the assistant about chapter topics, security jargon, or general safety tips.
*   **Secure API Key Splitting**: Built with split string splits in `app.js` (`GROQ_KEY_PART_1`, `GROQ_KEY_PART_2`, `GROQ_KEY_PART_3`) to secure your API key on host deployment.
*   **Adaptive Personas**: Choose from different responses in Settings: *Strict Expert*, *Friendly Educator*, or *Retro-Hacker*.

### ⚙️ 4. Advanced System Settings Modal
*   **AI Customizer**: Set LLM temperature and choose the active AI chatbot persona dynamically.
*   **Narrator Customizer**: Select preferred browser speech voices and adjust speech synthesis rates (0.5x to 2.0x).
*   **JSON Backup & Recovery**: Export all highlights, bookmark lists, checklists, and audit scores to a JSON backup file, or import it to sync across browsers.
*   **Granular Resets**: Reset checklists, audit histories, or clear highlights separately without erasing other configurations.

### 📖 5. Interactive Book Companion
*   **Side-by-Side Reading**: Access the digital textbook chapters styled like a physical serif book page with binder margins.
*   **Text-to-Speech (TTS)**: Built-in audio reader with play, pause, stop, and speaking rate speed controls.
*   **Aesthetic Typography**: Font adjustment buttons (increase/decrease size) for optimal readability.

### 📝 6. Dynamic Study Notebook
*   **Highlights & Annotations**: Double-click text inside chapters to highlight key sentences and add custom comments.
*   **Inline Paragraph Notes**: Add personal study notes directly to individual paragraphs.
*   **Global Notebook**: View, edit, and delete all chapter notes, highlights, and annotations from a central repository.

### 🔍 7. Dynamic Chapter Search
*   **Instant Querying**: Search across all 20 chapters and the introduction.
*   **Background Prefetching**: Loads chapter contents asynchronously to provide lightning-fast search results.

### 🧠 8. Customizable MCQ Quiz Engine
*   **Multi-Chapter Selection**: Focus on a single chapter, combine a few, or test yourself on the entire book.
*   **Difficulty Filtering**: Choose from *Easy*, *Medium*, *Hard*, or *Mixed* difficulty pools.
*   **Custom Question Counts**: Limit tests to 5, 10, 20, or take all matching questions.
*   **Zero-Bias Scrambling**: Shuffles both the question order and option choices (A, B, C, D) dynamically to eliminate position bias.
*   **Retake & Reconfigure**: Easily retake the same quiz with reshuffled options or configure a new test from scratch.

### 📋 9. Interactive Security Audit
*   **15-Point Posture Scan**: Evaluates your security measures (passwords, MFA, network safety, software practices).
*   **Dynamic Scoring**: Categorizes your safety posture from *Critical Danger* to *Excellent Defense* with personalized advice.

### 🎣 10. Phishing Simulator
*   **Mock Inbox**: Read simulated emails containing red flags and trust indicators.
*   **Interactive Tooltips**: Hover over flagged parts of emails to learn security cues.
*   **Trust/Report Decision Scoring**: Instant feedback explaining why an email is malicious or safe.

---

## 🛠️ Technologies Used
*   **Frontend**: HTML5, Vanilla CSS3 (custom CSS variables, matrix-green theme, custom animations, CRT scanline refresh layers, HTML5 Canvas).
*   **Logic**: Vanilla ES6+ JavaScript (Web Speech API, local storage, asynchronous fetch API, Canvas 2D Context, Web Speech Synthesis).
*   **API Integrations**: Groq Cloud SDK (Llama 3.1 8B Model).
*   **Data Storage**: JSON-based chapter contents and question database.

---

## 🚀 Getting Started

### 1. Prerequisites
To load the chapter texts and quiz questions, the browser needs to fetch local `.json` files. Due to standard browser CORS restrictions on the `file://` protocol, you must run the app using a local HTTP web server.

### 2. Running Locally

#### Option A: Using Python (Recommended)
Open your terminal inside the project directory and run:
```bash
python -m http.server 8888
```
Now, open your browser and navigate to:
```text
http://localhost:8888
```

#### Option B: VS Code Live Server
If you use VS Code, install the **Live Server** extension, open the project workspace, and click the **Go Live** button in the bottom status bar.

---

## 💾 Data Persistence
All highlights, notes, bookmarks, checklist milestones, and audit scores are saved locally on your machine using the browser's `localStorage` API. Your progress will remain saved even if you close the tab or refresh the browser.

