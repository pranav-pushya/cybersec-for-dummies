# 🛡️ Cybersecurity For Dummies - Interactive Companion WebApp

Welcome to the interactive companion dashboard for **Cybersecurity For Dummies**! This modern, feature-rich web application is designed to help everyday users master security concepts, audit their personal cybersecurity posture, practice identifying phishing attempts, and test their knowledge with customizable quizzes.

---

## 🌟 Key Features

### 📖 1. Interactive Book Companion
*   **Dual Mode Reading**: Access the digital textbook side-by-side with the companion interface.
*   **Text-to-Speech (TTS)**: Built-in audio reader with play, pause, stop, and speaking rate speed controls.
*   **Aesthetic Typography**: Font adjustment buttons (increase/decrease size) for optimal readability.

### 📝 2. Dynamic Study Notebook
*   **Highlights & Annotations**: Double-click text inside chapters to highlight key sentences and add custom comments.
*   **Inline Paragraph Notes**: Add personal study notes directly to individual paragraphs.
*   **Global Notebook**: View, edit, and delete all chapter notes, highlights, and annotations from a central repository.

### 🔍 3. Dynamic Chapter Search
*   **Instant Querying**: Search across all 20 chapters and the introduction.
*   **Background Prefetching**: Loads chapter contents asynchronously to provide lightning-fast search results.

### 🧠 4. Customizable MCQ Quiz Engine
*   **Multi-Chapter Selection**: Focus on a single chapter, combine a few, or test yourself on the entire book.
*   **Difficulty Filtering**: Choose from *Easy*, *Medium*, *Hard*, or *Mixed* difficulty pools.
*   **Custom Question Counts**: Limit tests to 5, 10, 20, or take all matching questions.
*   **Zero-Bias Scrambling**: Shuffles both the question order and option choices (A, B, C, D) dynamically to eliminate position bias.
*   **Retake & Reconfigure**: Easily retake the same quiz with reshuffled options or configure a new test from scratch.

### 📋 5. Interactive Security Audit
*   **15-Point Posture Scan**: Evaluates your security measures (passwords, MFA, network safety, software practices).
*   **Dynamic Scoring**: Categorizes your safety posture from *Critical Danger* to *Excellent Defense* with personalized advice.

### 🎣 6. Phishing Simulator
*   **Mock Inbox**: Read simulated emails containing red flags and trust indicators.
*   **Interactive Tooltips**: Hover over flagged parts of emails to learn security cues.
*   **Trust/Report Decision Scoring**: Instant feedback explaining why an email is malicious or safe.

### ⚙️ 7. Core Settings
*   **Dark & Light Modes**: Sleek glassmorphism visual design with fully responsive layouts.
*   **Progress Tracker**: Live calculation of your book reading progress.
*   **Progress Reset Settings**: Clear all reading, checklist, and audit scores safely while retaining your study notes.

---

## 🛠️ Technologies Used
*   **Frontend**: HTML5, Vanilla CSS3 (custom CSS variables, modern gradients, glassmorphism filters).
*   **Logic**: Vanilla ES6+ JavaScript (Web Speech API, local storage, asynchronous fetch API).
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
