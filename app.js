// State Management
let state = {
    currentSection: 'dashboard', // dashboard, reader, quiz, search, cheat-sheet, audit, phishing, notes
    currentChapterNum: 0,
    theme: 'dark',
    progress: {},
    fontSize: 16,
    quizIndex: 0,
    quizScore: 0,
    quizAnswers: [], // stores correct/incorrect for current question
    quizQuestionPool: [], // Loaded dynamically from quiz_questions.json
    quizActiveQuestions: [], // Filtered and sliced subset active for the current run
    quizSelectedChapters: new Set(), // Set of selected chapter indices
    quizSelectedDifficulty: 'all', // all, easy, medium, hard
    quizSelectedCount: 10, // 5, 10, 20, all
    auditIndex: 0,
    auditScore: 0,
    auditAnswers: [], // stores selected option indices for audit
    phishingIndex: 0,
    phishingScore: 0,
    phishingAnswers: [], // stores correctness of phishing decisions
    ttsSpeaking: false,
    ttsPaused: false,
    ttsUtterance: null,
    annotations: JSON.parse(localStorage.getItem('book_annotations') || '[]'),
    bookmarks: JSON.parse(localStorage.getItem('book_bookmarks') || '[]'),
    chapterNotes: JSON.parse(localStorage.getItem('book_chapter_notes') || '{}'),
    paraNotes: JSON.parse(localStorage.getItem('book_paragraph_notes') || '[]'),
    allChaptersData: [], // Cached chapters for search
    toc: []
};

// High-quality interactive quiz questions based on the book contents
const quizQuestions = [
    {
        question: "According to the book, what is the weakest link in any cybersecurity chain?",
        options: [
            "Outdated firewall software",
            "Human beings / people",
            "Weak encryption algorithms",
            "Public Wi-Fi routers"
        ],
        correct: 1,
        explanation: "Chapter 6 explains that the weakest link in the cybersecurity chain is almost always people, and the greatest threat to your own cybersecurity is likely yourself and family members."
    },
    {
        question: "What is the primary difference between cybersecurity and information security?",
        options: [
            "Information security only applies to physical locks and cabinets.",
            "Cybersecurity addresses electronic/digital data; information security encompasses all forms of data.",
            "There is no difference; they are exact synonyms in all contexts.",
            "Cybersecurity is only used by government agencies, while information security is for individuals."
        ],
        correct: 1,
        explanation: "Chapter 1 explains that cybersecurity is the subset of information security addressing data in electronic form, whereas information security covers all forms of data (including paper files)."
    },
    {
        question: "Which type of cyberattack floods a target with requests from many disparate regions simultaneously?",
        options: [
            "Denial-of-Service (DoS) attack",
            "Man-in-the-Middle (MitM) attack",
            "Distributed Denial-of-Service (DDoS) attack",
            "Phishing attack"
        ],
        correct: 2,
        explanation: "Chapter 2 describes a Distributed Denial-of-Service (DDoS) attack as one where many individual computers/devices across different regions simultaneously flood a target."
    },
    {
        question: "What was the famous computer worm discovered in 2010 that targeted industrial PLCs managing nuclear centrifuges?",
        options: [
            "WannaCry",
            "Stuxnet",
            "Mirai",
            "ILOVEYOU"
        ],
        correct: 1,
        explanation: "Chapter 3 details the Stuxnet worm, which targeted programmable logic controllers (PLCs) managing nuclear centrifuges in Iran."
    },
    {
        question: "What is credential stuffing?",
        options: [
            "Filling out multiple login forms using physical hardware tokens",
            "Using usernames and passwords leaked from one site to gain access to accounts on other sites",
            "Writing down all your passwords in a notebook",
            "Brute forcing passwords using random characters"
        ],
        correct: 1,
        explanation: "Chapter 7 defines credential stuffing as taking lists of usernames and passwords compromised in a breach on one site and trying them automatically on other sites."
    },
    {
        question: "Which system is compromised when a hacker uses phishing to trick you into giving away your details?",
        options: [
            "Physical security",
            "Network cryptography",
            "Social engineering",
            "Operating system kernel"
        ],
        correct: 2,
        explanation: "Chapter 8 covers social engineering, explaining how phishing scams trick people into voluntarily revealing passwords and sensitive details."
    },
    {
        question: "What does GDPR stand for, as mentioned in Chapter 9 & 10?",
        options: [
            "Global Data Privacy Regulation",
            "Government Data Protection Rules",
            "General Data Protection Regulation",
            "General Database Prevention Registry"
        ],
        correct: 2,
        explanation: "The General Data Protection Regulation (GDPR) is a major European Union regulation enforcing strict guidelines on how organizations protect personal consumer data."
    },
    {
        question: "Which of the following is considered an 'overt' security breach?",
        options: [
            "A silent background database export",
            "A ransomware attack demanding money to restore files",
            "A tracking cookie logging browsing habits",
            "A credential theft without account modification"
        ],
        correct: 1,
        explanation: "Chapter 11 defines overt breaches as those where the attacker announces the breach and demands action, such as ransomware attacks."
    },
    {
        question: "What is a soft reset of a device?",
        options: [
            "Resetting all data back to factory settings",
            "Physically turning the device off and turning it back on",
            "Uninstalling all security software",
            "Formatting the primary storage drive"
        ],
        correct: 1,
        explanation: "Chapter 14 explains that a soft reset is equivalent to restarting the device (power cycling) and does not wipe data or programs."
    },
    {
        question: "Why is it dangerous to restore backups immediately after discovering a ransomware infection?",
        options: [
            "The backups will immediately lose their license keys.",
            "Ransomware can infect connected backup drives or cloud sync folders if the malware is still active.",
            "Backing up is only useful for hardware failures, not malware.",
            "Restoring files permanently deletes the operating system."
        ],
        correct: 1,
        explanation: "Chapter 15 warns not to restore immediately because ransomware can infect external backup drives the moment they are connected to an infected computer."
    }
];

// Initialize the Application
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initProgress();
    initTTS();
    await loadTOC();
    await initQuizSystem();
    setupEventListeners();
    renderDashboardChecklist();
    updateDashboardBookmarksUI();
    
    // Start background prefetching for search
    prefetchChaptersData();
});

// Load Theme from LocalStorage
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    state.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
}

// Load Reading Progress from LocalStorage
function initProgress() {
    const savedProgress = localStorage.getItem('reading_progress');
    if (savedProgress) {
        state.progress = JSON.parse(savedProgress);
    }
    updateProgressUI();
    updateDashboardAuditUI();
}

// Load Table of Contents
async function loadTOC() {
    try {
        const response = await fetch('./data/toc.json');
        state.toc = await response.json();
        renderSidebarNav();
    } catch (error) {
        console.error('Error loading Table of Contents:', error);
    }
}

// Sidebar Navigation Renderer
function renderSidebarNav() {
    const navContainer = document.getElementById('sidebar-nav-container');
    navContainer.innerHTML = '';

    // Dashboard, Cheat Sheet, Quiz Links
    const mainLinks = [
        { id: 'dashboard', label: 'Dashboard', icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>` },
        { id: 'notes', label: 'Notes & Highlights', icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>` },
        { id: 'cheat-sheet', label: 'Cheat Sheet & Tips', icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>` },
        { id: 'quiz', label: 'Knowledge Quiz', icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>` },
        { id: 'audit', label: 'Security Audit', icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>` },
        { id: 'phishing', label: 'Phishing Simulator', icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>` },
        { id: 'open-pdf', label: 'Open Book PDF', url: './cybersecurity-for-dummies.pdf', icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>` }
    ];

    mainLinks.forEach(link => {
        const item = document.createElement('div');
        item.className = `nav-item ${state.currentSection === link.id ? 'active' : ''}`;
        item.innerHTML = `${link.icon} <span>${link.label}</span>`;
        if (link.url) {
            item.addEventListener('click', () => {
                window.open(link.url, '_blank');
            });
        } else {
            item.addEventListener('click', () => switchSection(link.id));
        }
        navContainer.appendChild(item);
    });

    // Parts Separator
    const sep = document.createElement('div');
    sep.className = 'nav-section-title';
    sep.innerText = 'Book Chapters';
    navContainer.appendChild(sep);

    // Group chapters by Part
    const partsMap = {};
    state.toc.forEach(chapter => {
        const partName = chapter.part;
        if (!partsMap[partName]) {
            partsMap[partName] = [];
        }
        partsMap[partName].push(chapter);
    });

    Object.keys(partsMap).forEach(partName => {
        const partAccordion = document.createElement('div');
        partAccordion.className = 'part-accordion';

        const partHeader = document.createElement('div');
        partHeader.className = 'part-header';
        partHeader.innerHTML = `
            <span>${partName}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        `;

        const partChapters = document.createElement('div');
        partChapters.className = 'part-chapters';

        partsMap[partName].forEach(chap => {
            const chapLink = document.createElement('div');
            chapLink.className = `nav-item ${state.currentSection === 'reader' && state.currentChapterNum === chap.num ? 'active' : ''}`;
            const isRead = state.progress[chap.num];
            
            chapLink.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="color: ${isRead ? 'var(--accent-green)' : 'var(--text-muted)'}">
                    ${isRead ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' : '<circle cx="12" cy="12" r="10"></circle>'}
                </svg>
                <span>${chap.title.split(': ')[1] || chap.title}</span>
            `;
            chapLink.addEventListener('click', () => loadChapter(chap.num));
            partChapters.appendChild(chapLink);
        });

        partHeader.addEventListener('click', () => {
            partHeader.classList.toggle('open');
        });

        partAccordion.appendChild(partHeader);
        partAccordion.appendChild(partChapters);
        navContainer.appendChild(partAccordion);
    });
}

// Section Switching Logic
function switchSection(sectionId) {
    stopTTS(); // Stop reading aloud if they navigate away!
    state.currentSection = sectionId;
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });

    // Show active section
    const activeSec = document.getElementById(`${sectionId}-section`);
    if (activeSec) {
        activeSec.classList.add('active');
    }

    // Refresh active states in sidebar
    renderSidebarNav();

    // Custom initializers
    if (sectionId === 'dashboard') {
        renderDashboardChecklist();
        updateDashboardAuditUI();
        updateDashboardBookmarksUI();
    } else if (sectionId === 'quiz') {
        showQuizSetup();
    } else if (sectionId === 'audit') {
        resetAudit();
    } else if (sectionId === 'phishing') {
        resetPhishing();
    } else if (sectionId === 'notes') {
        renderNotesList();
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile sidebar if open
    document.getElementById('sidebar').classList.remove('open');
}

// Prefetch Chapters in Background for instant searching
async function prefetchChaptersData() {
    for (let i = 0; i <= 20; i++) {
        try {
            const response = await fetch(`./data/chapter_${i}.json`);
            const data = await response.json();
            state.allChaptersData.push(data);
        } catch (e) {
            console.error(`Error prefetching chapter_${i}:`, e);
        }
    }
}

// Load a specific chapter in the reader
async function loadChapter(chapterNum) {
    stopTTS(); // Stop reading aloud if they switch chapters!
    try {
        state.currentChapterNum = chapterNum;
        const response = await fetch(`./data/chapter_${chapterNum}.json`);
        const data = await response.json();
        
        switchSection('reader');
        renderChapter(data);
        
        // Mark chapter as read
        state.progress[chapterNum] = true;
        localStorage.setItem('reading_progress', JSON.stringify(state.progress));
        updateProgressUI();
        renderSidebarNav();
    } catch (error) {
        console.error('Error loading chapter:', error);
    }
}

// Render Chapter Content
function renderChapter(chapterData) {
    const headerContainer = document.getElementById('reader-header-container');
    const bodyContainer = document.getElementById('reader-body-container');
    
    // Set Part tag, Title, Pages details
    const isBookmarked = state.bookmarks.includes(chapterData.num);
    headerContainer.innerHTML = `
        <span class="reader-part-tag">${chapterData.part}</span>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
            <h1 class="reader-title" style="margin-bottom: 0;">${chapterData.title}</h1>
            <button class="theme-toggle-btn" id="bookmark-toggle-btn" title="${isBookmarked ? 'Remove Bookmark' : 'Bookmark Chapter'}" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border-color: ${isBookmarked ? 'var(--accent-yellow)' : 'var(--border-color)'}; color: ${isBookmarked ? 'var(--accent-yellow)' : 'var(--text-primary)'};">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </button>
        </div>
        <div class="reader-meta" style="margin-top: 10px;">
            <span>Pages: ${chapterData.pages}</span>
            <span>Estimated Reading Time: ${Math.ceil(chapterData.content.length * 0.15)} mins</span>
        </div>
    `;

    // Attach click listener
    document.getElementById('bookmark-toggle-btn').onclick = () => toggleBookmark(chapterData.num);

    // Reset Font size on page
    bodyContainer.style.fontSize = `${state.fontSize}px`;
    bodyContainer.innerHTML = '';

    // Render key focus areas card if present
    if (chapterData.in_this_chapter && chapterData.in_this_chapter.length > 0) {
        const focusCard = document.createElement('div');
        focusCard.className = 'focus-card';
        focusCard.innerHTML = `
            <h4>In This Chapter:</h4>
            <ul class="focus-list">
                ${chapterData.in_this_chapter.map(item => `<li>${item}</li>`).join('')}
            </ul>
        `;
        bodyContainer.appendChild(focusCard);
    }

    // Render paragraphs and subheadings
    chapterData.content.forEach((block, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'paragraph-block-wrapper';
        wrapper.setAttribute('data-block-index', index);
        
        const row = document.createElement('div');
        row.className = 'paragraph-content-row';
        
        const contentEl = document.createElement(block.type === 'heading' ? 'h3' : 'p');
        contentEl.innerText = block.text;
        row.appendChild(contentEl);
        
        // Add note trigger button
        const actionBtn = document.createElement('button');
        actionBtn.className = 'para-action-btn';
        actionBtn.title = 'Add note to this paragraph';
        actionBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
        actionBtn.onclick = () => showParaNoteEditor(chapterData.num, index, block.text, wrapper);
        row.appendChild(actionBtn);
        
        wrapper.appendChild(row);
        
        // Render existing paragraph note if present
        const existingNote = state.paraNotes.find(pn => pn.chapterNum === chapterData.num && pn.blockIndex === index);
        if (existingNote) {
            const noteBox = document.createElement('div');
            noteBox.className = 'para-note-box';
            noteBox.innerHTML = `
                <div class="para-note-box-text"><strong>Note:</strong> ${existingNote.text}</div>
                <div style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
                    <button class="para-note-box-edit" title="Edit note">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="para-note-box-delete" title="Delete note">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            noteBox.querySelector('.para-note-box-edit').onclick = (e) => {
                e.stopPropagation();
                showParaNoteEditor(chapterData.num, index, block.text, wrapper);
            };
            noteBox.querySelector('.para-note-box-delete').onclick = (e) => {
                e.stopPropagation();
                deleteParaNote(existingNote.id, chapterData.num);
            };
            wrapper.appendChild(noteBox);
        }
        
        bodyContainer.appendChild(wrapper);
    });

    // Apply existing highlights for this chapter
    applyHighlightsToChapter(chapterData.num);

    // Render Chapter Notes Input Box
    const savedChapterNote = state.chapterNotes[chapterData.num] || '';
    const chapterNoteCard = document.createElement('div');
    chapterNoteCard.className = 'chapter-note-box glass-card';
    chapterNoteCard.style.cssText = 'margin-top: 32px; padding: 20px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(255, 255, 255, 0.01)); border: 1px solid var(--border-color);';
    chapterNoteCard.innerHTML = `
        <h4 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; color: var(--accent-purple); display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-purple);"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Chapter Notes & Key Takeaways
        </h4>
        <textarea id="chapter-note-textarea" placeholder="Type personal notes, ideas, or security takeaways for this chapter here... (saves automatically)" style="width: 100%; min-height: 90px; background-color: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; color: var(--text-primary); font-size: 13px; font-family: inherit; resize: vertical; line-height: 1.5; outline: none; transition: border-color 0.2s ease;"></textarea>
    `;
    bodyContainer.appendChild(chapterNoteCard);

    const noteTextarea = chapterNoteCard.querySelector('#chapter-note-textarea');
    noteTextarea.value = savedChapterNote;
    
    noteTextarea.addEventListener('input', (e) => {
        saveChapterNote(chapterData.num, e.target.value);
    });

    // Navigation buttons at bottom
    const prevNum = chapterData.num - 1;
    const nextNum = chapterData.num + 1;

    const prevBtn = document.getElementById('prev-chapter-btn');
    const nextBtn = document.getElementById('next-chapter-btn');

    if (prevNum >= 0) {
        prevBtn.style.display = 'inline-flex';
        prevBtn.onclick = () => loadChapter(prevNum);
    } else {
        prevBtn.style.display = 'none';
    }

    if (nextNum <= 20) {
        nextBtn.style.display = 'inline-flex';
        nextBtn.onclick = () => loadChapter(nextNum);
    } else {
        nextBtn.style.display = 'none';
    }
}

// Global Search Functionality
function handleSearch(query) {
    if (!query || query.trim() === '') {
        return;
    }
    
    query = query.toLowerCase().trim();
    const resultsContainer = document.getElementById('search-results-container');
    const resultsSummary = document.getElementById('search-results-summary');
    
    resultsContainer.innerHTML = '';
    switchSection('search');
    
    let totalMatches = 0;
    const matchedBlocks = [];

    // Search across cached/pre-loaded chapter data
    state.allChaptersData.forEach(chapter => {
        // Search chapter title
        if (chapter.title.toLowerCase().includes(query)) {
            matchedBlocks.push({
                chapterNum: chapter.num,
                chapterTitle: chapter.title,
                text: `Chapter Title matches: "${chapter.title}"`,
                isTitle: true
            });
            totalMatches++;
        }

        // Search text contents
        chapter.content.forEach(block => {
            if (block.text.toLowerCase().includes(query)) {
                matchedBlocks.push({
                    chapterNum: chapter.num,
                    chapterTitle: chapter.title,
                    text: block.text
                });
                totalMatches++;
            }
        });
    });

    resultsSummary.innerText = `Found ${totalMatches} matching results for "${query}"`;

    if (matchedBlocks.length === 0) {
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px; color: var(--text-muted);">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <p>No results found. Try matching different keywords.</p>
            </div>
        `;
        return;
    }

    // Render matches
    matchedBlocks.slice(0, 50).forEach(match => {
        const card = document.createElement('div');
        card.className = 'search-result-card';
        card.addEventListener('click', () => loadChapter(match.chapterNum));

        // Highlight matched query text
        const highlightedText = highlightQuery(match.text, query);

        card.innerHTML = `
            <div class="search-result-chapter">${match.chapterTitle}</div>
            <div class="search-result-text">${highlightedText}</div>
        `;
        resultsContainer.appendChild(card);
    });
}

function highlightQuery(text, query) {
    const index = text.toLowerCase().indexOf(query);
    if (index === -1) return text;
    
    // Highlight matched term
    const originalQuery = text.substr(index, query.length);
    return text.split(originalQuery).join(`<mark>${originalQuery}</mark>`);
}

// Progress Trackers
function updateProgressUI() {
    const totalChapters = 21; // 0 to 20
    const chaptersRead = Object.keys(state.progress).filter(k => state.progress[k]).length;
    const percentage = Math.round((chaptersRead / totalChapters) * 100);
    
    document.getElementById('progress-bar').style.width = `${percentage}%`;
    document.getElementById('progress-percentage').innerText = `${percentage}% Completed`;
    
    // Update dashboard reading details
    const dashProgressText = document.getElementById('dash-progress-text');
    if (dashProgressText) {
        dashProgressText.innerText = `You have read ${chaptersRead} of ${totalChapters} chapters (${percentage}% finished).`;
    }
}

// Theme toggling
function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const btn = document.getElementById('theme-toggle-btn');
    if (state.theme === 'dark') {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="18.36" x2="5.64" y2="16.93"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line></svg>`;
    } else {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    }
}

// Interactive Quiz System
// Interactive Quiz System
async function initQuizSystem() {
    try {
        const response = await fetch('./data/quiz_questions.json');
        state.quizQuestionPool = await response.json();
    } catch (e) {
        console.error("Error loading quiz questions:", e);
        // Fallback to static quizQuestions declared at the top of the file
        state.quizQuestionPool = quizQuestions.map((q, idx) => ({
            ...q,
            chapterNum: [6, 1, 2, 3, 7, 8, 9, 11, 14, 15][idx] || 1,
            difficulty: ['easy', 'medium', 'hard'][idx % 3]
        }));
    }

    state.quizSelectedDifficulty = 'all';
    state.quizSelectedCount = 10;
    state.quizSelectedChapters = new Set();
    
    // Wire up events
    const selectAllBtn = document.getElementById('quiz-select-all-btn');
    if (selectAllBtn) {
        selectAllBtn.onclick = () => {
            const pills = document.querySelectorAll('#setup-chapter-grid .chapter-pill');
            pills.forEach(pill => {
                pill.classList.add('selected');
                const num = parseInt(pill.getAttribute('data-num'));
                state.quizSelectedChapters.add(num);
            });
        };
    }
    
    const clearAllBtn = document.getElementById('quiz-clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.onclick = () => {
            const pills = document.querySelectorAll('#setup-chapter-grid .chapter-pill');
            pills.forEach(pill => {
                pill.classList.remove('selected');
                const num = parseInt(pill.getAttribute('data-num'));
                state.quizSelectedChapters.delete(num);
            });
        };
    }
    
    document.querySelectorAll('#setup-difficulty-group .pill-option').forEach(opt => {
        opt.onclick = (e) => {
            document.querySelectorAll('#setup-difficulty-group .pill-option').forEach(el => el.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
            state.quizSelectedDifficulty = e.currentTarget.getAttribute('data-value');
        };
    });
    
    document.querySelectorAll('#setup-count-group .pill-option').forEach(opt => {
        opt.onclick = (e) => {
            document.querySelectorAll('#setup-count-group .pill-option').forEach(el => el.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
            state.quizSelectedCount = e.currentTarget.getAttribute('data-value');
        };
    });
    
    const startBtn = document.getElementById('quiz-start-btn');
    if (startBtn) {
        startBtn.onclick = generateCustomQuiz;
    }
    
    const quitBtn = document.getElementById('quiz-quit-btn');
    if (quitBtn) {
        quitBtn.onclick = () => {
            showCustomConfirm("Are you sure you want to quit the current quiz? Your progress will not be saved.", () => {
                showQuizSetup();
            });
        };
    }
}

function showQuizSetup() {
    document.getElementById('quiz-setup-card').style.display = 'block';
    document.getElementById('quiz-play-card').style.display = 'none';
    
    if (state.toc.length === 0) return;
    
    const grid = document.getElementById('setup-chapter-grid');
    if (grid && grid.children.length === 0) {
        state.quizSelectedChapters = new Set();
        state.toc.forEach(ch => {
            state.quizSelectedChapters.add(ch.num);
            
            const pill = document.createElement('div');
            pill.className = 'chapter-pill selected';
            pill.setAttribute('data-num', ch.num);
            
            let shortName = "Intro";
            if (ch.num > 0) {
                let cleanTitle = ch.title.replace(/^Chapter \d+:\s*/i, '');
                if (cleanTitle.length > 22) {
                    cleanTitle = cleanTitle.substring(0, 20) + '...';
                }
                shortName = `Ch ${ch.num}: ${cleanTitle}`;
            } else {
                shortName = "Intro: Introduction";
            }
            
            pill.title = ch.title;
            pill.innerHTML = `
                <div class="chapter-pill-checkbox">
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>${shortName}</span>
            `;
            
            pill.onclick = () => {
                if (state.quizSelectedChapters.has(ch.num)) {
                    state.quizSelectedChapters.delete(ch.num);
                    pill.classList.remove('selected');
                } else {
                    state.quizSelectedChapters.add(ch.num);
                    pill.classList.add('selected');
                }
            };
            
            grid.appendChild(pill);
        });
    }
}

function generateCustomQuiz() {
    const selectedChapters = Array.from(state.quizSelectedChapters);
    const selectedDifficulty = state.quizSelectedDifficulty;
    const selectedCount = state.quizSelectedCount;
    
    if (selectedChapters.length === 0) {
        alert("Please select at least one chapter to include in your quiz!");
        return;
    }
    
    let filteredQuestions = state.quizQuestionPool.filter(q => {
        const chMatch = selectedChapters.includes(q.chapterNum);
        const diffMatch = (selectedDifficulty === 'all' || q.difficulty === selectedDifficulty);
        return chMatch && diffMatch;
    });
    
    if (filteredQuestions.length === 0) {
        alert("No questions found matching your criteria. Please select more chapters or different settings!");
        return;
    }
    
    filteredQuestions = shuffleArray(filteredQuestions);
    
    let count = filteredQuestions.length;
    if (selectedCount !== 'all') {
        count = Math.min(parseInt(selectedCount), filteredQuestions.length);
    }
    // Randomize the position of the choices to eliminate any bias (e.g. Option B)
    state.quizActiveQuestions = filteredQuestions.slice(0, count).map(q => shuffleOptions(q));
    
    state.quizIndex = 0;
    state.quizScore = 0;
    state.quizAnswers = [];
    
    document.getElementById('quiz-setup-card').style.display = 'none';
    document.getElementById('quiz-play-card').style.display = 'block';
    
    showQuizQuestion();
}

function showQuizQuestion() {
    const currentQ = state.quizActiveQuestions[state.quizIndex];
    const progressText = document.getElementById('quiz-progress-text');
    const quizBar = document.getElementById('quiz-bar-fill');
    const questionEl = document.getElementById('quiz-question');
    const optionsContainer = document.getElementById('quiz-options');
    const feedbackEl = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('quiz-next-btn');

    progressText.innerText = `Question ${state.quizIndex + 1} of ${state.quizActiveQuestions.length}`;
    quizBar.style.width = `${((state.quizIndex) / state.quizActiveQuestions.length) * 100}%`;
    questionEl.innerText = currentQ.question;
    optionsContainer.innerHTML = '';
    feedbackEl.style.display = 'none';
    nextBtn.style.display = 'none';

    currentQ.options.forEach((option, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = option;
        btn.onclick = () => submitQuizAnswer(idx);
        optionsContainer.appendChild(btn);
    });
}

function submitQuizAnswer(selectedIdx) {
    const currentQ = state.quizActiveQuestions[state.quizIndex];
    const optionsContainer = document.getElementById('quiz-options');
    const feedbackEl = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('quiz-next-btn');

    optionsContainer.querySelectorAll('.option-btn').forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === currentQ.correct) {
            btn.classList.add('correct');
        } else if (idx === selectedIdx) {
            btn.classList.add('incorrect');
        }
    });

    const isCorrect = (selectedIdx === currentQ.correct);
    if (isCorrect) {
        state.quizScore++;
    }

    feedbackEl.style.display = 'block';
    feedbackEl.innerHTML = `
        <strong style="color: ${isCorrect ? 'var(--accent-green)' : 'var(--accent-red)'}">
            ${isCorrect ? 'Correct!' : 'Incorrect'}
        </strong>
        ${currentQ.explanation}
    `;

    nextBtn.style.display = 'inline-flex';
    if (state.quizIndex === state.quizActiveQuestions.length - 1) {
        nextBtn.innerText = 'Show Final Score';
    } else {
        nextBtn.innerText = 'Next Question';
    }
}

function handleNextQuizQuestion() {
    if (state.quizIndex === state.quizActiveQuestions.length - 1) {
        showQuizResults();
    } else {
        state.quizIndex++;
        showQuizQuestion();
    }
}

function showQuizResults() {
    const questionEl = document.getElementById('quiz-question');
    const optionsContainer = document.getElementById('quiz-options');
    const feedbackEl = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('quiz-next-btn');
    const progressText = document.getElementById('quiz-progress-text');
    const quizBar = document.getElementById('quiz-bar-fill');

    progressText.innerText = `Quiz Complete`;
    quizBar.style.width = '100%';
    
    questionEl.innerText = `Your Score: ${state.quizScore} / ${state.quizActiveQuestions.length}`;
    
    const percentage = Math.round((state.quizScore / state.quizActiveQuestions.length) * 100);
    
    optionsContainer.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 48px; font-weight: 800; color: ${percentage >= 70 ? 'var(--accent-green)' : 'var(--accent-red)'}; margin-bottom: 16px;">
                ${percentage}%
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 24px;">
                ${percentage >= 70 ? 'Excellent! You have a solid understanding of the selected cybersecurity principles.' : 'We recommend reading through the corresponding chapters to improve your cybersecurity posture.'}
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button class="btn btn-secondary" id="quiz-btn-setup-again" style="padding: 10px 20px; font-size: 13px;">Configure New Quiz</button>
                <button class="btn btn-primary" id="quiz-btn-retake-same" style="padding: 10px 20px; font-size: 13px;">Retake Same Quiz</button>
            </div>
        </div>
    `;

    feedbackEl.style.display = 'none';
    nextBtn.style.display = 'none';
    
    document.getElementById('quiz-btn-setup-again').onclick = showQuizSetup;
    document.getElementById('quiz-btn-retake-same').onclick = () => {
        // Reshuffle both questions and their option choice order for the retake
        state.quizActiveQuestions = shuffleArray(state.quizActiveQuestions).map(q => shuffleOptions(q));
        state.quizIndex = 0;
        state.quizScore = 0;
        state.quizAnswers = [];
        showQuizQuestion();
    };
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function shuffleOptions(questionObj) {
    // Deep clone to avoid mutating the master pool
    const cloned = JSON.parse(JSON.stringify(questionObj));
    const originalOptions = cloned.options;
    const correctOptionText = originalOptions[cloned.correct];
    
    // Shuffle the options
    const shuffledOptions = shuffleArray(originalOptions);
    
    // Re-map the correct index to the shuffled position
    cloned.options = shuffledOptions;
    cloned.correct = shuffledOptions.indexOf(correctOptionText);
    
    return cloned;
}

// Dashboard Checklist Storage & Toggle
const checklistItems = [
    { id: 'checklist_1', text: "Create unique, complex passwords for all key accounts (Chapter 7)" },
    { id: 'checklist_2', text: "Enable Multi-Factor Authentication (MFA) everywhere possible (Chapter 6)" },
    { id: 'checklist_3', text: "Run local security software (antivirus/firewall) on all devices (Chapter 18)" },
    { id: 'checklist_4', text: "Establish an automated 3-2-1 backup strategy for critical files (Chapter 13)" },
    { id: 'checklist_5', text: "Turn off Wi-Fi auto-connectivity when moving in public (Chapter 20)" },
    { id: 'checklist_6', text: "Use a VPN when forced to access sensitive data on public networks (Chapter 20)" },
    { id: 'checklist_7', text: "Encrypt highly sensitive local data volumes (Chapter 18)" }
];

function renderDashboardChecklist() {
    const listContainer = document.getElementById('dash-checklist-container');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const storedStatus = JSON.parse(localStorage.getItem('dashboard_checklist') || '{}');

    checklistItems.forEach(item => {
        const isChecked = !!storedStatus[item.id];
        
        const row = document.createElement('div');
        row.className = 'checklist-item';

        row.innerHTML = `
            <div class="checklist-checkbox ${isChecked ? 'checked' : ''}" data-id="${item.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="checklist-text">${item.text}</div>
        `;

        row.querySelector('.checklist-checkbox').addEventListener('click', (e) => {
            const chBox = e.currentTarget;
            const itemId = chBox.getAttribute('data-id');
            const newChecked = !chBox.classList.contains('checked');
            
            if (newChecked) {
                chBox.classList.add('checked');
            } else {
                chBox.classList.remove('checked');
            }

            storedStatus[itemId] = newChecked;
            localStorage.setItem('dashboard_checklist', JSON.stringify(storedStatus));
        });

        listContainer.appendChild(row);
    });
}

// Event Listeners Setup
function setupEventListeners() {
    // Theme Toggle
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);

    // Reset Progress Button
    const resetProgressBtn = document.getElementById('reset-progress-btn');
    if (resetProgressBtn) {
        resetProgressBtn.addEventListener('click', () => {
            showCustomConfirm(
                "Are you sure you want to reset all reading progress, checklist achievements, and audit scores? Your book annotations and notes will remain intact.",
                () => {
                    // Clear local storage keys related to progress
                    localStorage.removeItem('reading_progress');
                    localStorage.removeItem('dashboard_checklist');
                    localStorage.removeItem('security_audit_score');
                    
                    // Reset local progress state
                    state.progress = {};
                    
                    // Re-initialize progress tracking
                    initProgress();
                    
                    // Re-render dashboard, sidebar, and progress indicator UI
                    renderSidebarNav();
                    renderDashboardChecklist();
                    updateDashboardAuditUI();
                    updateProgressUI();
                    
                    showToastNotification("Progress successfully reset!");
                },
                "Reset"
            );
        });
    }

    // Sidebar search triggers
    const sInput = document.getElementById('search-query');
    sInput.addEventListener('keypress', (e) => {
        if (e.key === 'ENTER' || e.keyCode === 13) {
            handleSearch(sInput.value);
        }
    });

    // Font adjusters in reader
    document.getElementById('font-increase-btn').addEventListener('click', () => {
        if (state.fontSize < 24) {
            state.fontSize += 2;
            document.getElementById('reader-body-container').style.fontSize = `${state.fontSize}px`;
        }
    });

    document.getElementById('font-decrease-btn').addEventListener('click', () => {
        if (state.fontSize > 12) {
            state.fontSize -= 2;
            document.getElementById('reader-body-container').style.fontSize = `${state.fontSize}px`;
        }
    });

    // Quiz next button
    document.getElementById('quiz-next-btn').addEventListener('click', handleNextQuizQuestion);

    // Audit buttons
    document.getElementById('audit-next-btn').addEventListener('click', handleNextAuditStep);
    document.getElementById('audit-retry-btn').addEventListener('click', resetAudit);

    // Phishing buttons
    document.getElementById('phishing-trust-btn').addEventListener('click', () => submitPhishingChoice(false));
    document.getElementById('phishing-report-btn').addEventListener('click', () => submitPhishingChoice(true));
    document.getElementById('phishing-next-btn').addEventListener('click', handleNextPhishingStep);
    document.getElementById('phishing-retry-btn').addEventListener('click', resetPhishing);

    // TTS buttons
    document.getElementById('tts-play-btn').addEventListener('click', toggleTTS);
    document.getElementById('tts-stop-btn').addEventListener('click', stopTTS);
    document.getElementById('tts-rate').addEventListener('change', () => {
        if (state.ttsSpeaking) {
            const wasSpeaking = state.ttsSpeaking && !state.ttsPaused;
            stopTTS();
            if (wasSpeaking) {
                setTimeout(toggleTTS, 100);
            }
        }
    });
    document.getElementById('tts-voice').addEventListener('change', () => {
        if (state.ttsSpeaking) {
            const wasSpeaking = state.ttsSpeaking && !state.ttsPaused;
            stopTTS();
            if (wasSpeaking) {
                setTimeout(toggleTTS, 100);
            }
        }
    });

    // Highlighter selection listeners
    const bodyContainer = document.getElementById('reader-body-container');
    if (bodyContainer) {
        bodyContainer.addEventListener('mouseup', handleTextSelection);
        bodyContainer.addEventListener('click', handleHighlightClick);
    }

    document.addEventListener('mousedown', (e) => {
        const toolbar = document.getElementById('highlight-toolbar');
        const rbc = document.getElementById('reader-body-container');
        if (toolbar && !toolbar.contains(e.target) && (!rbc || !rbc.contains(e.target))) {
            hideHighlightToolbar();
        }
    });

    // Highlight colors click
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            const color = e.target.getAttribute('data-color');
            if (currentSelection) {
                addHighlight(currentSelection.text, currentSelection.chapterNum, color);
            }
        });
    });

    // Add note button click
    const noteBtn = document.getElementById('toolbar-note-btn');
    if (noteBtn) {
        noteBtn.addEventListener('click', () => {
            if (currentSelection) {
                showNoteEditorModal("Add Note to Highlight", "", (noteText) => {
                    if (noteText !== null && noteText.trim() !== '') {
                        addHighlight(currentSelection.text, currentSelection.chapterNum, 'yellow', noteText);
                    }
                });
            }
        });
    }

    // Mobile sidebar toggle
    document.getElementById('menu-toggle-btn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
    });

    document.getElementById('sidebar-close-btn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });

    // Click outside mobile sidebar to close
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('menu-toggle-btn');
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !toggleBtn.contains(e.target) && 
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });
}

// Security Audit Questions Data
const auditQuestions = [
    {
        question: "How do you manage passwords for your online accounts?",
        options: [
            { text: "I reuse similar/identical passwords across multiple services.", points: 0, recommendations: ["Weak password hygiene makes you vulnerable to credential stuffing attacks.", "Read Chapter 7 to learn how to create unique passphrases and use a password manager.", 7] },
            { text: "I write my passwords down in a notebook or keep them in a text document.", points: 10, recommendations: ["Physical tracking creates a risk of local loss or unauthorized reading.", "Read Chapter 7 to secure your credentials digitally.", 7] },
            { text: "I use a digital password manager (e.g. 1Password, Bitwarden) with unique passwords.", points: 25, recommendations: ["Excellent! Your accounts are secured against single-credential leaks.", "", 7] }
        ]
    },
    {
        question: "Have you activated Multi-Factor Authentication (MFA) on your services?",
        options: [
            { text: "No, I only use traditional passwords.", points: 0, recommendations: ["Single-factor logins are highly vulnerable if passwords leak.", "Read Chapter 6 to implement MFA and add a second layer of defense.", 6] },
            { text: "Only on a few key profiles, like primary email and online banking.", points: 15, recommendations: ["Good start, but all critical logins should be protected with MFA.", "Read Chapter 6 to extend MFA to all supporting sites.", 6] },
            { text: "Yes, I enforce MFA on all online accounts that offer it.", points: 25, recommendations: ["Fantastic! You protect logins against credential compromises.", "", 6] }
        ]
    },
    {
        question: "What is your backup strategy for important personal and work files?",
        options: [
            { text: "I do not maintain regular backups.", points: 0, recommendations: ["No backup leaves you at extreme risk of hardware failures or ransomware.", "Read Chapter 13 to understand the necessity of backup protection.", 13] },
            { text: "I occasionally copy files manually to a USB drive or local hard disk.", points: 10, recommendations: ["Manual backups are often outdated and local drives can be infected by active ransomware.", "Read Chapter 13 to set up an automated 3-2-1 backup strategy.", 13] },
            { text: "I use the 3-2-1 rule (3 copies, 2 media formats, 1 stored offsite/cloud).", points: 25, recommendations: ["Superb! Your data can survive system crashes, theft, or ransomware encryption.", "", 13] }
        ]
    },
    {
        question: "How do you connect to the internet when you are in public locations?",
        options: [
            { text: "I connect to any open Wi-Fi network and perform whatever tasks I need.", points: 0, recommendations: ["Public hotspots expose network traffic to snooping or Man-in-the-Middle attacks.", "Read Chapter 20 to protect your public data connections.", 20] },
            { text: "I connect but avoid entering passwords or credit cards.", points: 10, recommendations: ["Avoiding transactions helps, but browser sessions can still be hijacked on open Wi-Fi.", "Read Chapter 20 to implement encrypted connections.", 20] },
            { text: "I always route traffic through a VPN or use my phone's cellular hotspot data.", points: 25, recommendations: ["Wonderful! Your traffic is encrypted and safe from local network eavesdroppers.", "", 20] }
        ]
    }
];

function updateDashboardAuditUI() {
    const storedAuditScore = localStorage.getItem('security_audit_score');
    const auditText = document.getElementById('dash-audit-text');
    const auditCard = document.getElementById('dash-audit-card');
    
    if (storedAuditScore !== null && auditText) {
        const score = parseInt(storedAuditScore);
        let rating = "HIGH RISK 🔴";
        let color = "var(--accent-red)";
        
        if (score > 75) {
            rating = "SECURE / LOW RISK 🟢";
            color = "var(--accent-green)";
        } else if (score > 40) {
            rating = "MODERATE RISK 🟡";
            color = "var(--accent-yellow)";
        }
        
        auditText.innerHTML = `Your computed rating is <strong style="color: ${color}">${rating}</strong> with a score of <strong>${score}%</strong>.`;
        if (auditCard) {
            auditCard.style.background = `linear-gradient(135deg, rgba(${score > 75 ? '16, 185, 129' : score > 40 ? '245, 158, 11' : '239, 68, 68'}, 0.08), rgba(255,255,255,0.01))`;
        }
    }
}

// Interactive Security Audit System
function resetAudit() {
    state.auditIndex = 0;
    state.auditScore = 0;
    state.auditAnswers = [];
    
    // Toggle containers
    document.getElementById('audit-card').style.display = 'block';
    document.getElementById('audit-result-card').style.display = 'none';
    
    showAuditStep();
}

function showAuditStep() {
    const currentQ = auditQuestions[state.auditIndex];
    const progressText = document.getElementById('audit-progress-text');
    const auditBar = document.getElementById('audit-bar-fill');
    const questionEl = document.getElementById('audit-question');
    const optionsContainer = document.getElementById('audit-options');
    const nextBtn = document.getElementById('audit-next-btn');

    progressText.innerText = `Step ${state.auditIndex + 1} of ${auditQuestions.length}`;
    auditBar.style.width = `${((state.auditIndex) / auditQuestions.length) * 100}%`;
    questionEl.innerText = currentQ.question;
    optionsContainer.innerHTML = '';
    nextBtn.style.display = 'none';

    currentQ.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt.text;
        btn.onclick = () => submitAuditChoice(idx);
        optionsContainer.appendChild(btn);
    });
}

function submitAuditChoice(idx) {
    const currentQ = auditQuestions[state.auditIndex];
    const optionsContainer = document.getElementById('audit-options');
    const nextBtn = document.getElementById('audit-next-btn');

    optionsContainer.querySelectorAll('.option-btn').forEach((btn, optionIdx) => {
        btn.disabled = true;
        if (optionIdx === idx) {
            btn.classList.add('correct'); // Highlight choice
        }
    });

    state.auditAnswers[state.auditIndex] = idx;
    
    nextBtn.style.display = 'inline-flex';
    if (state.auditIndex === auditQuestions.length - 1) {
        nextBtn.innerText = 'Calculate Posture';
    } else {
        nextBtn.innerText = 'Next Step';
    }
}

function handleNextAuditStep() {
    if (state.auditIndex === auditQuestions.length - 1) {
        showAuditResults();
    } else {
        state.auditIndex++;
        showAuditStep();
    }
}

function showAuditResults() {
    document.getElementById('audit-card').style.display = 'none';
    const resultCard = document.getElementById('audit-result-card');
    resultCard.style.display = 'block';
    
    // Sum points
    let totalScore = 0;
    auditQuestions.forEach((q, qIdx) => {
        const selectedIdx = state.auditAnswers[qIdx];
        totalScore += q.options[selectedIdx].points;
    });
    
    // Save to localStorage
    localStorage.setItem('security_audit_score', totalScore);
    updateDashboardAuditUI();
    
    // Update Score gauge
    document.getElementById('audit-score-gauge').innerText = `${totalScore}%`;
    
    // Update badge styling
    const badge = document.getElementById('audit-rating-badge');
    const recommendationsContainer = document.getElementById('audit-recommendations');
    recommendationsContainer.innerHTML = '';
    
    if (totalScore >= 80) {
        badge.innerText = "SECURE / LOW RISK";
        badge.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
        badge.style.color = "var(--accent-green)";
    } else if (totalScore >= 50) {
        badge.innerText = "MODERATE RISK";
        badge.style.backgroundColor = "rgba(245, 158, 11, 0.15)";
        badge.style.color = "var(--accent-yellow)";
    } else {
        badge.innerText = "HIGH RISK";
        badge.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
        badge.style.color = "var(--accent-red)";
    }
    
    // Build recommendation items
    auditQuestions.forEach((q, qIdx) => {
        const selectedIdx = state.auditAnswers[qIdx];
        const choice = q.options[selectedIdx];
        
        const card = document.createElement('div');
        card.className = 'recommendation-card';
        
        const isSecure = choice.points === 25;
        
        card.innerHTML = `
            <div class="recommendation-icon ${isSecure ? 'secure' : ''}">
                ${isSecure ? 
                    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>` : 
                    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line><circle cx="12" cy="12" r="10"></circle></svg>`
                }
            </div>
            <div style="flex-grow: 1;">
                <div class="recommendation-title" style="color: ${isSecure ? 'var(--accent-green)' : 'var(--accent-red)'}">
                    ${isSecure ? 'Good posture: ' + q.question.split('?')[0] : 'Vulnerability found: ' + q.question.split('?')[0]}
                </div>
                <div class="recommendation-desc">${isSecure ? 'Your current choice follows recommended best practices.' : choice.recommendations[0]}</div>
                ${!isSecure ? `<a class="recommendation-link" onclick="loadChapter(${choice.recommendations[2]})">${choice.recommendations[1]}</a>` : ''}
            </div>
        `;
        
        recommendationsContainer.appendChild(card);
    });
}

// Phishing Scenarios Data
const phishingScenarios = [
    {
        from: "Chase Support <security@chase-alert-service.net>",
        subject: "Action Required: Suspicious Activity Detected on Card",
        body: `Dear Chase Customer,

We detected some suspicious transactions on your debit card ending in 9044. For your safety, we have temporarily locked access to your digital accounts.

To unlock your access, please verify your identity immediately:
<span class="email-redflag" data-tooltip="This link leads to an external unverified domain (chase-alert-service.net) rather than chase.com.">https://www.chase.com/verify-identity</span>

Failure to verify within 24 hours will result in permanent suspension.

Thank you,
Chase Security Department`,
        isPhishing: true,
        redflags: [
            "Urgent, threatening tone asking for immediate action",
            "Mismatched sender domain (chase-alert-service.net instead of chase.com)",
            "Hyperlink looks like chase.com, but hovering reveals it redirects to the attacker's server"
        ],
        explanation: "This is a classic banking credential phishing attempt (Chapter 8). Chase will never email you a link demanding immediate verification under threat of suspension."
    },
    {
        from: "FedEx Delivery <packages@fedx-tracking-hub.com>",
        subject: "Delivery Delayed - Action Required",
        body: `SMS Notification:
FedEx Alert: Your parcel #782-901 cannot be delivered due to an incorrect street address.

Please update your address details and schedule redelivery here:
<span class="email-redflag" data-tooltip="Shortened or custom tracking domains (fedx-tracking-hub.com) are used by scammers. Real FedEx uses fedex.com.">http://fedx-tracking-hub.com/update</span>

Failure to update details will result in your package being returned to the sender.`,
        isPhishing: true,
        redflags: [
            "Fake FedEx domain (fedx-tracking-hub.com instead of fedex.com)",
            "Uses urgent threat of returning package",
            "Broad/generic notification not addressed to your name"
        ],
        explanation: "This is Smishing/Phishing targeted at package delivery (Chapter 8). Never click on links in SMS or random delivery alerts asking for address details."
    },
    {
        from: "Robert Johnson <r.johnson@company-external.com>",
        subject: "URGENT: Purchase client gift cards",
        body: `Hi,

I am in an urgent client meeting right now and need you to complete a quick task. I need to send 5 Apple Gift Cards ($100 each) to some key stakeholders immediately.

Please purchase them online, scratch the backs, and send me clear photos of the codes here. I will submit the reimbursement first thing tomorrow morning.

Do not call me as my phone is on silent in the meeting room.

Best regards,
Robert Johnson, CEO`,
        isPhishing: true,
        redflags: [
            "CEO using an external email domain (company-external.com)",
            "Demanding gift card purchase (gift cards are non-refundable and untraceable)",
            "Telling you not to call or verify via other channels"
        ],
        explanation: "This is Spear Phishing and Business Email Compromise (BEC) (Chapter 11). Attackers impersonate high-level executives to bypass verification and steal funds via gift cards."
    },
    {
        from: "Microsoft Accounts <noreply@microsoft.com>",
        subject: "Security Notification: Password Changed",
        body: `Microsoft Account Security Info

The password for your Microsoft account (user@example.com) was successfully changed on 2026-06-26 21:04 UTC.

If this was you, you can safely ignore this email.
If this was not you, someone else might have accessed your account. Please review your active log-ins and secure your account here:
<span class="email-redflag" data-tooltip="The sender address and format look genuine. Microsoft does send notifications from noreply@microsoft.com for changes.">https://account.microsoft.com/activity</span>`,
        isPhishing: false,
        redflags: [],
        explanation: "This is a legitimate transactional email from Microsoft. The sender is genuine, and the link points directly to the verified account domain (account.microsoft.com/activity) without suspicious redirects."
    },
    {
        from: "Netflix Support <billing@netflix-updates-payment.org>",
        subject: "Update your payment method - account on hold",
        body: `We were unable to process your monthly subscription payment.

As a result, your membership is currently on hold. Please update your billing information to continue enjoying Netflix:
<span class="email-redflag" data-tooltip="Netflix uses netflix.com, not netflix-updates-payment.org.">https://netflix.com/youraccount</span>

If no update is made, your account will be closed.

The Netflix Team`,
        isPhishing: true,
        redflags: [
            "Fake Netflix billing domain (netflix-updates-payment.org)",
            "Generic greeting instead of personal name",
            "Urgent call-to-action warning of immediate account closure"
        ],
        explanation: "This is a subscription phishing scam. Attackers lure users to fake login portals to steal credit card details and streaming account passwords."
    }
];

// Interactive Phishing Simulator System
function resetPhishing() {
    state.phishingIndex = 0;
    state.phishingScore = 0;
    state.phishingAnswers = [];
    
    // Toggle containers
    document.getElementById('phishing-card').style.display = 'block';
    document.getElementById('phishing-result-card').style.display = 'none';
    
    showPhishingScenario();
}

function showPhishingScenario() {
    const scenario = phishingScenarios[state.phishingIndex];
    const progressText = document.getElementById('phishing-progress-text');
    const barFill = document.getElementById('phishing-bar-fill');
    const fromEl = document.getElementById('email-from');
    const subjectEl = document.getElementById('email-subject');
    const bodyEl = document.getElementById('email-body');
    const feedbackEl = document.getElementById('phishing-feedback');
    const nextBtn = document.getElementById('phishing-next-btn');
    
    // Reset buttons state
    document.getElementById('phishing-trust-btn').disabled = false;
    document.getElementById('phishing-report-btn').disabled = false;
    
    // Set text
    progressText.innerText = `Scenario ${state.phishingIndex + 1} of ${phishingScenarios.length}`;
    barFill.style.width = `${((state.phishingIndex) / phishingScenarios.length) * 100}%`;
    fromEl.innerText = scenario.from;
    subjectEl.innerText = scenario.subject;
    bodyEl.innerHTML = scenario.body;
    
    feedbackEl.style.display = 'none';
    nextBtn.style.display = 'none';
}

function submitPhishingChoice(reported) {
    const scenario = phishingScenarios[state.phishingIndex];
    const feedbackEl = document.getElementById('phishing-feedback');
    const nextBtn = document.getElementById('phishing-next-btn');
    
    // Disable buttons
    document.getElementById('phishing-trust-btn').disabled = true;
    document.getElementById('phishing-report-btn').disabled = true;
    
    const correct = (reported === scenario.isPhishing);
    if (correct) {
        state.phishingScore++;
        state.phishingAnswers.push(true);
    } else {
        state.phishingAnswers.push(false);
    }
    
    feedbackEl.style.display = 'block';
    
    let redflagsHTML = "";
    if (scenario.isPhishing && scenario.redflags.length > 0) {
        redflagsHTML = `
            <div style="margin-top: 12px; font-size: 13px;">
                <strong>Key Red Flags to Look Out For (Hover over dashed text above):</strong>
                <ul style="margin: 6px 0 0 20px; padding: 0;">
                    ${scenario.redflags.map(flag => `<li>${flag}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    feedbackEl.innerHTML = `
        <div style="color: ${correct ? 'var(--accent-green)' : 'var(--accent-red)'}; font-weight: 700; margin-bottom: 8px;">
            ${correct ? 'Correct Choice!' : 'Incorrect Choice!'}
        </div>
        <div>
            <strong>Type:</strong> ${scenario.isPhishing ? 'Phishing Email / Scam' : 'Legitimate / Safe Email'}
        </div>
        <div style="margin-top: 6px; font-size: 13px; line-height: 1.5; color: var(--text-secondary);">
            ${scenario.explanation}
        </div>
        ${redflagsHTML}
    `;
    
    nextBtn.style.display = 'inline-flex';
    if (state.phishingIndex === phishingScenarios.length - 1) {
        nextBtn.innerText = 'Show Simulator Results';
    } else {
        nextBtn.innerText = 'Next Scenario';
    }
}

function handleNextPhishingStep() {
    if (state.phishingIndex === phishingScenarios.length - 1) {
        showPhishingResults();
    } else {
        state.phishingIndex++;
        showPhishingScenario();
    }
}

function showPhishingResults() {
    document.getElementById('phishing-card').style.display = 'none';
    const resultCard = document.getElementById('phishing-result-card');
    resultCard.style.display = 'block';
    
    document.getElementById('phishing-score-gauge').innerText = `${state.phishingScore} / ${phishingScenarios.length}`;
    
    const resultText = document.getElementById('phishing-result-text');
    const pct = (state.phishingScore / phishingScenarios.length) * 100;
    
    if (pct === 100) {
        resultText.innerText = "Excellent! You scored 100%. You have an outstanding eye for identifying phishing cues and social engineering red flags.";
    } else if (pct >= 60) {
        resultText.innerText = "Good effort! You spotted most of the scams, but some tricks slipped past. Review Chapter 8 of the book to brush up on email verification techniques.";
    } else {
        resultText.innerText = "Critical risk warning! You fell for several realistic simulation scams. We highly recommend reading Chapter 8 immediately to safeguard your accounts.";
    }
}

// Web Speech Text-To-Speech (TTS) System
let ttsVoices = [];

function initTTS() {
    if (!('speechSynthesis' in window)) {
        const container = document.querySelector('.tts-container');
        if (container) container.style.display = 'none';
        return;
    }
    
    // Populate voice list
    const populateVoices = () => {
        ttsVoices = window.speechSynthesis.getVoices();
        const voiceSelect = document.getElementById('tts-voice');
        if (!voiceSelect) return;
        
        voiceSelect.innerHTML = '';
        
        // Filter for English voices first as fallback, or show all
        let englishVoices = ttsVoices.filter(v => v.lang.startsWith('en-'));
        const voicesToUse = englishVoices.length > 0 ? englishVoices : ttsVoices;
        
        voicesToUse.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.name;
            opt.innerText = `${v.name} (${v.lang})`;
            voiceSelect.appendChild(opt);
        });
    };
    
    populateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = populateVoices;
    }
}

function toggleTTS() {
    if (!state.ttsSpeaking) {
        startTTS();
    } else {
        if (state.ttsPaused) {
            window.speechSynthesis.resume();
            state.ttsPaused = false;
            updateTTSPlayButtonUI(true);
        } else {
            window.speechSynthesis.pause();
            state.ttsPaused = true;
            updateTTSPlayButtonUI(false);
        }
    }
}

function startTTS() {
    // Get text to read
    const headerContainer = document.getElementById('reader-header-container');
    const bodyContainer = document.getElementById('reader-body-container');
    if (!headerContainer || !bodyContainer) return;
    
    // Stop any current reading
    window.speechSynthesis.cancel();
    
    // Aggregate text
    const title = headerContainer.querySelector('.reader-title')?.innerText || '';
    const paragraphs = Array.from(bodyContainer.querySelectorAll('p, h3')).map(el => el.innerText);
    const fullText = [title, ...paragraphs].join('. ');
    
    if (!fullText.trim()) return;
    
    state.ttsUtterance = new SpeechSynthesisUtterance(fullText);
    
    // Rate
    const rateSelect = document.getElementById('tts-rate');
    state.ttsUtterance.rate = parseFloat(rateSelect.value || '1');
    
    // Voice
    const voiceSelect = document.getElementById('tts-voice');
    if (voiceSelect && voiceSelect.value) {
        const selectedVoice = ttsVoices.find(v => v.name === voiceSelect.value);
        if (selectedVoice) {
            state.ttsUtterance.voice = selectedVoice;
        }
    }
    
    // Event handlers
    state.ttsUtterance.onstart = () => {
        state.ttsSpeaking = true;
        state.ttsPaused = false;
        document.getElementById('tts-controls').style.display = 'inline-flex';
        updateTTSPlayButtonUI(true);
    };
    
    state.ttsUtterance.onend = () => {
        resetTTSState();
    };
    
    state.ttsUtterance.onerror = () => {
        resetTTSState();
    };
    
    window.speechSynthesis.speak(state.ttsUtterance);
}

function stopTTS() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    resetTTSState();
}

function resetTTSState() {
    state.ttsSpeaking = false;
    state.ttsPaused = false;
    state.ttsUtterance = null;
    
    const controls = document.getElementById('tts-controls');
    if (controls) controls.style.display = 'none';
    
    updateTTSPlayButtonUI(false);
}

function updateTTSPlayButtonUI(isPlaying) {
    const playBtn = document.getElementById('tts-play-btn');
    const playIcon = document.getElementById('tts-play-icon');
    const playText = document.getElementById('tts-play-text');
    
    if (!playBtn) return;
    
    if (isPlaying) {
        playIcon.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>`; // Pause icon
        playText.innerText = "Pause Narrator";
        playBtn.style.borderColor = "var(--accent-purple)";
        playBtn.style.color = "var(--accent-purple)";
    } else {
        playIcon.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`; // Play icon
        playText.innerText = state.ttsPaused ? "Resume Narrator" : "Listen to Chapter";
        playBtn.style.borderColor = "var(--border-color)";
        playBtn.style.color = "var(--text-primary)";
    }
}

// Highlights & Annotations System
let currentSelection = null;

function handleTextSelection(e) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        const toolbar = document.getElementById('highlight-toolbar');
        if (toolbar) {
            toolbar.style.display = 'flex';
            toolbar.style.top = `${window.scrollY + rect.top - 40}px`;
            toolbar.style.left = `${window.scrollX + rect.left + (rect.width / 2) - (toolbar.offsetWidth / 2)}px`;
        }
        
        currentSelection = {
            text: selectedText,
            chapterNum: state.currentChapterNum
        };
    } else {
        hideHighlightToolbar();
    }
}

function hideHighlightToolbar() {
    const toolbar = document.getElementById('highlight-toolbar');
    if (toolbar) toolbar.style.display = 'none';
    currentSelection = null;
}

function addHighlight(text, chapterNum, color, note = '') {
    const id = 'ann_' + Date.now();
    const newAnn = {
        id,
        chapterNum,
        text,
        color,
        note,
        createdAt: new Date().toISOString()
    };
    
    state.annotations.push(newAnn);
    localStorage.setItem('book_annotations', JSON.stringify(state.annotations));
    
    // Rerender chapter to apply highlight
    loadChapter(chapterNum);
    hideHighlightToolbar();
    window.getSelection().removeAllRanges();
}

function applyHighlightsToChapter(chapterNum) {
    const chapterAnnotations = state.annotations.filter(ann => ann.chapterNum === chapterNum);
    if (chapterAnnotations.length === 0) return;
    
    const bodyContainer = document.getElementById('reader-body-container');
    if (!bodyContainer) return;
    
    const elements = bodyContainer.querySelectorAll('p, h3');
    
    chapterAnnotations.forEach(ann => {
        elements.forEach(el => {
            const index = el.innerText.indexOf(ann.text);
            if (index !== -1) {
                const escapedText = ann.text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const regex = new RegExp(`(${escapedText})`, 'g');
                if (!el.innerHTML.includes(`data-ann-id="${ann.id}"`)) {
                    el.innerHTML = el.innerHTML.replace(regex, `<span class="highlight highlight-${ann.color}" data-ann-id="${ann.id}" title="${ann.note || ''}">$1</span>`);
                }
            }
        });
    });
}

function renderNotesList() {
    const container = document.getElementById('notes-list-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    let allItems = [];
    
    // Add text highlights
    state.annotations.forEach(ann => {
        allItems.push({
            type: 'highlight',
            id: ann.id,
            chapterNum: ann.chapterNum,
            text: ann.text,
            note: ann.note,
            color: ann.color,
            createdAt: ann.createdAt
        });
    });
    
    // Add paragraph notes
    state.paraNotes.forEach(pn => {
        allItems.push({
            type: 'paranote',
            id: pn.id,
            chapterNum: pn.chapterNum,
            text: pn.originalText,
            note: pn.text,
            color: 'purple',
            createdAt: pn.createdAt
        });
    });
    
    // Add chapter notes
    Object.keys(state.chapterNotes).forEach(chNumKey => {
        const num = parseInt(chNumKey);
        allItems.push({
            type: 'chapternote',
            id: 'cnote_' + num,
            chapterNum: num,
            text: '',
            note: state.chapterNotes[chNumKey],
            color: 'violet',
            createdAt: new Date().toISOString()
        });
    });
    
    if (allItems.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 40px;">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 16px; opacity: 0.5;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <p>No notes or highlights saved yet. Start typing notes or highlighting text inside the book reader.</p>
            </div>
        `;
        return;
    }
    
    // Sort allItems by chapter, then type, then date
    allItems.sort((a, b) => {
        if (a.chapterNum !== b.chapterNum) {
            return a.chapterNum - b.chapterNum;
        }
        if (a.type !== b.type) {
            return a.type.localeCompare(b.type);
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    allItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'note-card';
        
        let accentColor = 'var(--accent-purple)';
        if (item.type === 'highlight') {
            accentColor = `var(--accent-${item.color === 'yellow' ? 'yellow' : item.color === 'cyan' ? 'blue' : 'purple'})`;
        } else if (item.type === 'paranote') {
            accentColor = 'var(--accent-purple)';
        } else if (item.type === 'chapternote') {
            accentColor = 'var(--accent-green)';
        }
        
        card.style.borderLeftColor = accentColor;
        
        let typeBadge = 'Highlight';
        if (item.type === 'paranote') typeBadge = 'Paragraph Note';
        if (item.type === 'chapternote') typeBadge = 'Chapter General Note';
        
        card.innerHTML = `
            <div class="note-card-controls">
                <button class="note-card-control-btn edit" title="Edit note">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="note-card-control-btn delete" title="Delete entry">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">
                    Chapter ${item.chapterNum}
                </span>
                <span style="font-size: 9px; font-weight: 700; background-color: ${accentColor}15; color: ${accentColor}; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${typeBadge}
                </span>
            </div>
            
            ${item.text ? `
                <div style="font-style: italic; font-size: 13px; color: var(--text-primary); margin-bottom: 8px; border-left: 2px solid var(--border-color); padding-left: 10px; line-height: 1.4;">
                    "${item.text}"
                </div>
            ` : ''}
            
            <div style="font-size: 13px; color: var(--text-secondary); background-color: var(--bg-tertiary); padding: 8px 12px; border-radius: 4px; line-height: 1.5; white-space: pre-wrap;">
                ${item.type === 'highlight' && item.note ? `<strong>Note:</strong> ` : ''}${item.note}
            </div>
            
            <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 10px; color: var(--text-secondary);">${item.type === 'chapternote' ? '' : new Date(item.createdAt).toLocaleDateString()}</span>
                <a class="recommendation-link" style="font-size: 11px;" onclick="loadChapter(${item.chapterNum})">Jump to Chapter</a>
            </div>
        `;
        
        card.querySelector('.note-card-control-btn.edit').onclick = (e) => {
            e.stopPropagation();
            editNotesListEntry(item.id, item.type, item.chapterNum);
        };
        
        card.querySelector('.note-card-control-btn.delete').onclick = (e) => {
            e.stopPropagation();
            deleteNotesListEntry(item.id, item.type, item.chapterNum);
        };
        
        container.appendChild(card);
    });
}

function deleteNotesListEntry(id, type, chapterNum) {
    showCustomConfirm("Are you sure you want to delete this note/highlight?", () => {
        if (type === 'highlight') {
            state.annotations = state.annotations.filter(ann => ann.id !== id);
            localStorage.setItem('book_annotations', JSON.stringify(state.annotations));
        } else if (type === 'paranote') {
            state.paraNotes = state.paraNotes.filter(pn => pn.id !== id);
            localStorage.setItem('book_paragraph_notes', JSON.stringify(state.paraNotes));
        } else if (type === 'chapternote') {
            delete state.chapterNotes[chapterNum];
            localStorage.setItem('book_chapter_notes', JSON.stringify(state.chapterNotes));
        }
        renderNotesList();
    });
}

// Chapter Notes Utilities
function saveChapterNote(chapterNum, text) {
    if (text.trim() === '') {
        delete state.chapterNotes[chapterNum];
    } else {
        state.chapterNotes[chapterNum] = text;
    }
    localStorage.setItem('book_chapter_notes', JSON.stringify(state.chapterNotes));
}

// Paragraph Notes Utilities
function showParaNoteEditor(chapterNum, blockIndex, originalText, wrapperEl) {
    if (wrapperEl.querySelector('.para-note-editor')) return;
    
    const noteBox = wrapperEl.querySelector('.para-note-box');
    if (noteBox) noteBox.style.display = 'none';
    
    const editor = document.createElement('div');
    editor.className = 'para-note-editor';
    editor.innerHTML = `
        <textarea placeholder="Type a note for this paragraph..."></textarea>
        <div class="para-note-editor-actions">
            <button class="btn btn-secondary btn-cancel-para-note" style="padding: 6px 12px; font-size: 11px;">Cancel</button>
            <button class="btn btn-primary btn-save-para-note" style="padding: 6px 12px; font-size: 11px;">Save Note</button>
        </div>
    `;
    
    const textarea = editor.querySelector('textarea');
    const existingNote = state.paraNotes.find(pn => pn.chapterNum === chapterNum && pn.blockIndex === blockIndex);
    if (existingNote) {
        textarea.value = existingNote.text;
    }
    
    editor.querySelector('.btn-cancel-para-note').onclick = () => {
        editor.remove();
        if (noteBox) noteBox.style.display = 'flex';
    };
    
    editor.querySelector('.btn-save-para-note').onclick = () => {
        const text = textarea.value.trim();
        if (text) {
            saveParaNote(chapterNum, blockIndex, originalText, text);
        } else {
            if (existingNote) {
                deleteParaNote(existingNote.id, chapterNum);
            }
        }
        loadChapter(chapterNum);
    };
    
    wrapperEl.appendChild(editor);
    textarea.focus();
}

function saveParaNote(chapterNum, blockIndex, originalText, text) {
    const existingIdx = state.paraNotes.findIndex(pn => pn.chapterNum === chapterNum && pn.blockIndex === blockIndex);
    if (existingIdx !== -1) {
        state.paraNotes[existingIdx].text = text;
        state.paraNotes[existingIdx].createdAt = new Date().toISOString();
    } else {
        const newNote = {
            id: 'pnote_' + Date.now(),
            chapterNum,
            blockIndex,
            originalText,
            text,
            createdAt: new Date().toISOString()
        };
        state.paraNotes.push(newNote);
    }
    localStorage.setItem('book_paragraph_notes', JSON.stringify(state.paraNotes));
}

function deleteParaNote(id, chapterNum) {
    showCustomConfirm("Are you sure you want to delete this paragraph note?", () => {
        state.paraNotes = state.paraNotes.filter(pn => pn.id !== id);
        localStorage.setItem('book_paragraph_notes', JSON.stringify(state.paraNotes));
        loadChapter(chapterNum);
    });
}

// Bookmarking System
function toggleBookmark(chapterNum) {
    const idx = state.bookmarks.indexOf(chapterNum);
    if (idx !== -1) {
        state.bookmarks.splice(idx, 1);
    } else {
        state.bookmarks.push(chapterNum);
    }
    localStorage.setItem('book_bookmarks', JSON.stringify(state.bookmarks));
    
    // Refresh reader header to update icon state
    const currentChapterData = state.allChaptersData.find(c => c.num === chapterNum);
    if (currentChapterData) {
        renderChapter(currentChapterData);
    } else {
        // Fallback: reload current chapter
        loadChapter(chapterNum);
    }
    
    // Update Dashboard bookmarks widget
    updateDashboardBookmarksUI();
}

function updateDashboardBookmarksUI() {
    const container = document.getElementById('dash-bookmarks-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (state.bookmarks.length === 0) {
        container.innerHTML = `<p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">No bookmarks saved yet. Click the bookmark icon inside any chapter to save it here.</p>`;
        return;
    }
    
    const sorted = [...state.bookmarks].sort((a, b) => a - b);
    
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '8px';
    
    sorted.forEach(num => {
        let title = `Chapter ${num}`;
        let rawTitle = '';
        const chData = state.allChaptersData.find(c => c.num === num);
        if (chData) {
            rawTitle = chData.title;
        } else if (state.toc && state.toc[num]) {
            rawTitle = state.toc[num].title;
        }
        
        if (rawTitle) {
            if (rawTitle.toLowerCase().startsWith(`chapter ${num}:`) || rawTitle.toLowerCase().startsWith(`chapter ${num} `)) {
                title = rawTitle;
            } else {
                title = `Chapter ${num}: ${rawTitle}`;
            }
        }
        
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.backgroundColor = 'var(--bg-secondary)';
        item.style.padding = '8px 12px';
        item.style.borderRadius = '6px';
        item.style.border = '1px solid var(--border-color)';
        
        item.innerHTML = `
            <a onclick="loadChapter(${num})" style="cursor: pointer; font-weight: 600; font-size: 12px; color: var(--accent-yellow); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">${title}</a>
            <button class="note-card-delete" onclick="event.stopPropagation(); toggleBookmark(${num});" style="position: static; padding: 2px; color: var(--text-secondary);" title="Remove bookmark">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;
        list.appendChild(item);
    });
    
    container.appendChild(list);
}

// Custom Modal Confirmation Popup
function showCustomConfirm(message, onConfirm, okLabel = "Delete") {
    const existing = document.getElementById('custom-confirm-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'custom-confirm-modal';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.2s ease;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 24px;
        max-width: 380px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        text-align: center;
        transform: scale(0.9);
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    dialog.innerHTML = `
        <div style="width: 48px; height: 48px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.1); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </div>
        <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 16px; color: var(--text-primary); font-weight: 600;">Confirm Action</h3>
        <p style="margin-top: 0; margin-bottom: 24px; font-size: 14px; color: var(--text-secondary); line-height: 1.5;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="confirm-cancel-btn" class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px; min-width: 100px;">Cancel</button>
            <button id="confirm-ok-btn" class="btn btn-primary" style="background: ${okLabel === 'Delete' || okLabel === 'Reset' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))'}; border: none; padding: 8px 16px; font-size: 13px; min-width: 100px; color: #fff;">${okLabel}</button>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.style.opacity = '1';
        dialog.style.transform = 'scale(1)';
    }, 10);

    const closeModal = () => {
        overlay.style.opacity = '0';
        dialog.style.transform = 'scale(0.9)';
        setTimeout(() => overlay.remove(), 200);
    };

    overlay.querySelector('#confirm-cancel-btn').onclick = closeModal;
    
    overlay.onclick = (e) => {
        if (e.target === overlay) closeModal();
    };

    overlay.querySelector('#confirm-ok-btn').onclick = () => {
        closeModal();
        if (onConfirm) onConfirm();
    };
}

// Custom Modal Note Editor
function showNoteEditorModal(title, initialText, onSave, onDelete = null) {
    const existing = document.getElementById('custom-edit-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'custom-edit-modal';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.2s ease;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 24px;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        transform: scale(0.9);
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    dialog.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 16px; color: var(--text-primary); font-weight: 600;">${title}</h3>
        <textarea id="modal-note-textarea" placeholder="Type your note here..." style="width: 100%; min-height: 120px; background-color: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; color: var(--text-primary); font-size: 13px; font-family: inherit; resize: vertical; line-height: 1.5; outline: none; margin-bottom: 20px; box-sizing: border-box;"></textarea>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            ${onDelete ? `<button id="modal-delete-btn" class="btn btn-secondary" style="border-color: var(--accent-red); color: var(--accent-red); padding: 8px 16px; font-size: 13px;">Delete</button>` : ''}
            <button id="modal-cancel-btn" class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px;">Cancel</button>
            <button id="modal-save-btn" class="btn btn-primary" style="padding: 8px 16px; font-size: 13px; color: #fff;">Save</button>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const textarea = dialog.querySelector('#modal-note-textarea');
    textarea.value = initialText;

    setTimeout(() => {
        overlay.style.opacity = '1';
        dialog.style.transform = 'scale(1)';
        textarea.focus();
    }, 10);

    const closeModal = () => {
        overlay.style.opacity = '0';
        dialog.style.transform = 'scale(0.9)';
        setTimeout(() => overlay.remove(), 200);
    };

    dialog.querySelector('#modal-cancel-btn').onclick = closeModal;
    
    overlay.onclick = (e) => {
        if (e.target === overlay) closeModal();
    };

    dialog.querySelector('#modal-save-btn').onclick = () => {
        const text = textarea.value.trim();
        closeModal();
        if (onSave) onSave(text);
    };

    if (onDelete) {
        dialog.querySelector('#modal-delete-btn').onclick = () => {
            closeModal();
            onDelete();
        };
    }
}

// Edit Notes from notes list
function editNotesListEntry(id, type, chapterNum) {
    if (type === 'highlight') {
        const ann = state.annotations.find(a => a.id === id);
        if (ann) {
            showNoteEditorModal("Edit Highlight Note", ann.note, (newNoteText) => {
                ann.note = newNoteText;
                localStorage.setItem('book_annotations', JSON.stringify(state.annotations));
                renderNotesList();
            });
        }
    } else if (type === 'paranote') {
        const pn = state.paraNotes.find(p => p.id === id);
        if (pn) {
            showNoteEditorModal("Edit Paragraph Note", pn.text, (newNoteText) => {
                pn.text = newNoteText;
                localStorage.setItem('book_paragraph_notes', JSON.stringify(state.paraNotes));
                renderNotesList();
            });
        }
    } else if (type === 'chapternote') {
        const text = state.chapterNotes[chapterNum] || '';
        showNoteEditorModal("Edit Chapter Note", text, (newNoteText) => {
            saveChapterNote(chapterNum, newNoteText);
            renderNotesList();
        });
    }
}

// Edit Highlight click inside reader
function handleHighlightClick(e) {
    const selection = window.getSelection();
    if (selection.toString().trim().length > 0) {
        return; // User is selecting text, don't open editor!
    }
    
    const highlightEl = e.target.closest('.highlight');
    if (!highlightEl) return;
    
    const annId = highlightEl.getAttribute('data-ann-id');
    if (!annId) return;
    
    const ann = state.annotations.find(a => a.id === annId);
    if (!ann) return;
    
    showNoteEditorModal(
        "Edit Highlight Note", 
        ann.note, 
        (newNoteText) => {
            ann.note = newNoteText;
            localStorage.setItem('book_annotations', JSON.stringify(state.annotations));
            loadChapter(state.currentChapterNum);
        },
        () => {
            state.annotations = state.annotations.filter(a => a.id !== annId);
            localStorage.setItem('book_annotations', JSON.stringify(state.annotations));
            loadChapter(state.currentChapterNum);
        }
    );
}

// Toast notification helper
function showToastNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary));
        border: 1px solid var(--accent-green);
        border-left: 4px solid var(--accent-green);
        padding: 12px 20px;
        border-radius: 8px;
        color: var(--text-primary);
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        transform: translateY(20px);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
    toast.innerText = message;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 50);
    
    // Animate out and remove
    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
