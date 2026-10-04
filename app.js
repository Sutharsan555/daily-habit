/* ==========================================================================
   AuraHabit - Main Application JavaScript Logic
   ========================================================================== */

(function () {
    // --- State Initialization ---
    const STORAGE_KEY = 'aurahabit_state_v2';

    // Default Sample Habits for immediate WOW factor
    const DEFAULT_HABITS = [
        {
            id: 'h-1',
            name: 'Morning Meditation',
            category: 'Mindfulness',
            emoji: '🧘',
            color: '#8B5CF6',
            target: 1,
            unit: 'session',
            notes: '10-15 minutes of mindfulness breathing after waking up.',
            createdAt: '2026-09-01',
            logs: {}
        },
        {
            id: 'h-2',
            name: 'Hydration Target',
            category: 'Health',
            emoji: '💧',
            color: '#06B6D4',
            target: 8,
            unit: 'glasses',
            notes: 'Stay hydrated throughout the workday.',
            createdAt: '2026-09-01',
            logs: {}
        },
        {
            id: 'h-3',
            name: 'Read 20 Pages',
            category: 'Learning',
            emoji: '📚',
            color: '#F59E0B',
            target: 1,
            unit: 'chapter',
            notes: 'Non-fiction or technical book before bed.',
            createdAt: '2026-09-01',
            logs: {}
        },
        {
            id: 'h-4',
            name: 'Daily Workout',
            category: 'Fitness',
            emoji: '🏃',
            color: '#10B981',
            target: 1,
            unit: 'workout',
            notes: '30 min cardio, gym, or bodyweight exercise.',
            createdAt: '2026-09-01',
            logs: {}
        },
        {
            id: 'h-5',
            name: 'Deep Work Session',
            category: 'Productivity',
            emoji: '💻',
            color: '#6366F1',
            target: 2,
            unit: 'blocks',
            notes: '45-minute distraction-free focus blocks.',
            createdAt: '2026-09-01',
            logs: {}
        }
    ];

    const QUOTES = [
        "We are what we repeatedly do. Excellence is not an act, but a habit. – Aristotle",
        "Small habits don't add up, they compound. – James Clear",
        "Motivation is what gets you started. Habit is what keeps you going. – Jim Ryun",
        "You'll never change your life until you change something you do daily. – John C. Maxwell",
        "Success is the sum of small efforts, repeated day in and day out. – Robert Collier",
        "Your future is found in your daily routine. – Unknown"
    ];

    const BADGES = [
        { id: 'b1', title: 'First Step', desc: 'Complete your first habit check-in', icon: 'sparkles', check: (state) => state.totalCheckins >= 1 },
        { id: 'b2', title: 'Momentum Builder', desc: 'Achieve a 3-day habit streak', icon: 'flame', check: (state) => state.bestStreak >= 3 },
        { id: 'b3', title: 'Unstoppable', desc: 'Achieve a 7-day habit streak', icon: 'zap', check: (state) => state.bestStreak >= 7 },
        { id: 'b4', title: 'Category Master', desc: 'Create habits in at least 3 categories', icon: 'layers', check: (state) => state.categoriesCount >= 3 },
        { id: 'b5', title: 'Centurion', desc: 'Reach 50 total habit completions', icon: 'award', check: (state) => state.totalCheckins >= 50 },
        { id: 'b6', title: 'Level 5 Champion', desc: 'Reach Level 5 in XP progress', icon: 'shield-check', check: (state) => state.level >= 5 },
        { id: 'b7', title: 'Level 25 Achiever', desc: 'Reach Level 25', icon: 'star', check: (state) => state.level >= 25 },
        { id: 'b8', title: 'Level 50 Titan', desc: 'Reach Level 50 (Tough Milestone)', icon: 'trophy', check: (state) => state.level >= 50 },
        { id: 'b9', title: 'Apex Legend', desc: 'Reach Level 100 Maximum Cap', icon: 'crown', check: (state) => state.level >= 100 }
    ];

    // Seed mock history data for past 7 days so heatmaps & streaks look awesome immediately
    function getTodayString(offsetDays = 0) {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().split('T')[0];
    }

    let state = {
        habits: [],
        xp: 45,
        level: 1,
        theme: 'dark',
        soundEnabled: true,
        selectedDate: getTodayString(0),
        selectedWeekOffset: 0
    };

    // Load State from LocalStorage
    function loadState() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                state = { ...state, ...parsed };
            } catch (e) {
                console.error("Failed to parse local storage", e);
            }
        }
        
        if (!state.habits || state.habits.length === 0) {
            state.habits = DEFAULT_HABITS;
            // Seed sample checkins for past 5 days
            seedSampleLogs();
        }

        // Initialize theme
        if (state.theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    }

    function seedSampleLogs() {
        state.habits.forEach(h => {
            h.logs = h.logs || {};
            for (let i = 1; i <= 6; i++) {
                const dayStr = getTodayString(-i);
                if (Math.random() > 0.3) {
                    h.logs[dayStr] = h.target;
                }
            }
        });
    }

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            habits: state.habits,
            xp: state.xp,
            level: state.level,
            theme: state.theme,
            soundEnabled: state.soundEnabled
        }));
    }

    // --- Web Audio Synthesizer Sound Effects ---
    function playAudioTone(freq = 587.33, duration = 0.15, type = 'sine') {
        if (!state.soundEnabled) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            // Audio context fallback silent
        }
    }

    function playSuccessChime() {
        playAudioTone(523.25, 0.12); // C5
        setTimeout(() => playAudioTone(659.25, 0.12), 80); // E5
        setTimeout(() => playAudioTone(783.99, 0.25), 160); // G5
    }

    // --- Calculations & Stats Helpers ---
    function calculateStreak(habit) {
        let currentStreak = 0;
        let dayOffset = 0;
        const todayStr = getTodayString(0);
        
        // If today is completed or pending, start counting back
        const todayVal = habit.logs[todayStr] || 0;
        if (todayVal < habit.target) {
            // If today is not completed yet, check if yesterday was completed to keep streak alive
            const yesterdayStr = getTodayString(-1);
            const yestVal = habit.logs[yesterdayStr] || 0;
            if (yestVal < habit.target) {
                return 0; // Streak broken
            }
            dayOffset = 1; // Start counting back from yesterday
        }

        while (true) {
            const dateStr = getTodayString(-dayOffset);
            const count = habit.logs[dateStr] || 0;
            if (count >= habit.target) {
                currentStreak++;
                dayOffset++;
            } else {
                break;
            }
        }
        return currentStreak;
    }

    function calculateOverallStats() {
        const habits = state.habits;
        const todayStr = state.selectedDate;

        let completedToday = 0;
        let bestStreak = 0;
        let totalCheckins = 0;

        habits.forEach(h => {
            const val = h.logs[todayStr] || 0;
            if (val >= h.target) completedToday++;

            const streak = calculateStreak(h);
            if (streak > bestStreak) bestStreak = streak;

            Object.values(h.logs).forEach(v => {
                if (v > 0) totalCheckins += 1;
            });
        });

        // Weekly rate calculation over past 7 days
        let weekPossible = habits.length * 7;
        let weekCompleted = 0;
        for (let i = 0; i < 7; i++) {
            const dateStr = getTodayString(-i);
            habits.forEach(h => {
                if ((h.logs[dateStr] || 0) >= h.target) {
                    weekCompleted++;
                }
            });
        }
        const weeklyRate = weekPossible > 0 ? Math.round((weekCompleted / weekPossible) * 100) : 0;

        // Progressive 100 Level Progression System
        const levelInfo = calculateLevelDetails(state.xp);
        state.level = levelInfo.level;

        const categoriesCount = new Set(habits.map(h => h.category)).size;

        return {
            totalHabits: habits.length,
            completedToday,
            bestStreak,
            totalCheckins,
            weeklyRate,
            level: levelInfo.level,
            rankTitle: levelInfo.rankTitle,
            levelDetails: levelInfo,
            categoriesCount
        };
    }

    // Cumulative Progressive XP Curve up to Max Level 100
    // Reaching Level 50 is scaled to be tough and earned!
    function getXpForLevel(lvl) {
        if (lvl <= 1) return 0;
        if (lvl > 100) lvl = 100;
        
        let totalXpNeeded = 0;
        for (let l = 1; l < lvl; l++) {
            if (l <= 10) {
                totalXpNeeded += 100; // Early levels (100 XP/lvl)
            } else if (l <= 30) {
                totalXpNeeded += 100 + (l - 10) * 20; // 120 XP to 500 XP
            } else if (l <= 50) {
                totalXpNeeded += 500 + (l - 30) * 50; // 550 XP to 1500 XP (TOUGH Milestone to reach Lvl 50!)
            } else {
                totalXpNeeded += 1500 + (l - 50) * 100; // 1600 XP to 6500 XP (Prestige 50-100)
            }
        }
        return totalXpNeeded;
    }

    function getLevelFromXP(xp) {
        if (xp <= 0) return 1;
        let lvl = 1;
        while (lvl < 100) {
            const nextXp = getXpForLevel(lvl + 1);
            if (xp >= nextXp) {
                lvl++;
            } else {
                break;
            }
        }
        return Math.min(100, lvl);
    }

    function calculateLevelDetails(xp) {
        const level = getLevelFromXP(xp);
        
        let rankTitle = 'Habit Novice';
        if (level >= 5) rankTitle = 'Apprentice Tracker';
        if (level >= 15) rankTitle = 'Consistent Achiever';
        if (level >= 30) rankTitle = 'Habit Master';
        if (level >= 50) rankTitle = 'Disciplined Titan'; // ⭐ Special Level 50 Milestone!
        if (level >= 70) rankTitle = 'Grandmaster Achiever';
        if (level >= 90) rankTitle = 'Mythic Discipline';
        if (level >= 100) rankTitle = 'Supreme Habit Legend (MAX)';

        if (level >= 100) {
            return {
                level: 100,
                rankTitle: 'Supreme Habit Legend (MAX)',
                currentXpInLevel: 100,
                xpNeededForThisLevel: 100,
                xpPercent: 100,
                isMax: true
            };
        }

        const currentLevelBaseXp = getXpForLevel(level);
        const nextLevelBaseXp = getXpForLevel(level + 1);
        const xpNeededForThisLevel = nextLevelBaseXp - currentLevelBaseXp;
        const currentXpInLevel = Math.max(0, xp - currentLevelBaseXp);
        const xpPercent = Math.min(100, Math.floor((currentXpInLevel / xpNeededForThisLevel) * 100));

        return {
            level,
            rankTitle,
            currentXpInLevel,
            xpNeededForThisLevel,
            xpPercent,
            isMax: false
        };
    }

    function addXP(amount) {
        const oldLevel = getLevelFromXP(state.xp);
        state.xp += amount;
        const newLevel = getLevelFromXP(state.xp);
        
        if (newLevel > oldLevel) {
            // Level Up Celebration!
            if (typeof confetti === 'function') {
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            }
            playSuccessChime();
        }
        saveState();
        renderUserLevel();
    }

    // --- UI Rendering ---

    function renderUserLevel() {
        const info = calculateLevelDetails(state.xp);

        document.getElementById('userLevelBadge').textContent = info.isMax ? `Lvl 100 MAX` : `Lvl ${info.level}`;
        document.getElementById('userRankTitle').textContent = info.rankTitle;
        document.getElementById('xpProgressBar').style.width = `${info.xpPercent}%`;

        if (info.isMax) {
            document.getElementById('currentXpText').textContent = `MAX LEVEL 100 REACHED`;
            document.getElementById('nextLevelXpText').textContent = ``;
        } else {
            document.getElementById('currentXpText').textContent = `${info.currentXpInLevel} XP`;
            document.getElementById('nextLevelXpText').textContent = `${info.xpNeededForThisLevel} XP`;
        }
    }

    function renderHeaderDates() {
        const selectedDate = new Date(state.selectedDate + 'T00:00:00');
        const todayStr = getTodayString(0);

        const isToday = state.selectedDate === todayStr;
        document.getElementById('currentDayTitle').textContent = isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
        document.getElementById('fullDateSub').textContent = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        document.getElementById('selectedDateLabel').textContent = isToday ? 'Today' : state.selectedDate;

        const goTodayBtn = document.getElementById('todayDateBtn');
        if (goTodayBtn) {
            goTodayBtn.style.display = isToday ? 'none' : 'inline-block';
        }
    }

    function renderStatsSummary() {
        const stats = calculateOverallStats();
        
        document.getElementById('statCompletedToday').textContent = stats.completedToday;
        document.getElementById('statTotalToday').textContent = `/ ${stats.totalHabits}`;
        document.getElementById('statBestStreak').textContent = `${stats.bestStreak} Days`;
        document.getElementById('statWeeklyRate').textContent = `${stats.weeklyRate}%`;
        document.getElementById('statTotalCheckins').textContent = stats.totalCheckins;

        // Progress ring calculation
        const percent = stats.totalHabits > 0 ? Math.round((stats.completedToday / stats.totalHabits) * 100) : 0;
        document.getElementById('todayProgressPercent').textContent = `${percent}%`;

        const ring = document.getElementById('todayProgressRing');
        if (ring) {
            const circumference = 2 * Math.PI * 22; // 138.2
            const offset = circumference - (percent / 100) * circumference;
            ring.style.strokeDashoffset = offset;
        }
    }

    function renderHabitsList() {
        const container = document.getElementById('habitsContainer');
        const emptyState = document.getElementById('emptyState');
        const countBadge = document.getElementById('habitCountBadge');

        const searchVal = document.getElementById('habitSearchInput').value.toLowerCase().trim();
        const catFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        const todayStr = state.selectedDate;

        let filtered = state.habits.filter(h => {
            const matchesSearch = h.name.toLowerCase().includes(searchVal) || (h.notes && h.notes.toLowerCase().includes(searchVal));
            const matchesCategory = catFilter === 'all' || h.category === catFilter;
            
            const currentVal = h.logs[todayStr] || 0;
            const isCompleted = currentVal >= h.target;
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'completed' && isCompleted) || 
                (statusFilter === 'pending' && !isCompleted);

            return matchesSearch && matchesCategory && matchesStatus;
        });

        countBadge.textContent = `${filtered.length} habit${filtered.length === 1 ? '' : 's'}`;
        container.innerHTML = '';

        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        } else {
            emptyState.classList.add('hidden');
        }

        filtered.forEach(habit => {
            const currentCount = habit.logs[todayStr] || 0;
            const isCompleted = currentCount >= habit.target;
            const streak = calculateStreak(habit);

            const card = document.createElement('div');
            card.className = `habit-card ${isCompleted ? 'completed' : ''}`;
            card.style.setProperty('--habit-color', habit.color);

            card.innerHTML = `
                <div class="habit-header">
                    <div class="habit-title-area">
                        <div class="habit-emoji">${habit.emoji || '⚡'}</div>
                        <div class="habit-info">
                            <h4>${escapeHTML(habit.name)}</h4>
                            <span class="habit-category-tag" style="color: ${habit.color};">${habit.category}</span>
                        </div>
                    </div>
                    <div class="habit-actions-menu">
                        <button class="btn-card-action edit-habit-btn" data-id="${habit.id}" title="Edit Habit">
                            <i data-lucide="edit-3"></i>
                        </button>
                        <button class="btn-card-action delete-habit-btn" data-id="${habit.id}" title="Delete Habit">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>

                ${habit.notes ? `<div class="habit-notes">${escapeHTML(habit.notes)}</div>` : ''}

                <div class="habit-footer">
                    <div class="streak-pill">
                        <i data-lucide="flame"></i>
                        <span>${streak}d streak</span>
                    </div>

                    ${habit.target > 1 ? `
                        <div class="counter-group">
                            <button class="btn-counter decrement-btn" data-id="${habit.id}">-</button>
                            <span class="counter-value">${currentCount} / ${habit.target} ${habit.unit || ''}</span>
                            <button class="btn-counter increment-btn" data-id="${habit.id}">+</button>
                        </div>
                    ` : `
                        <button class="checkin-btn checkin-toggle-btn" data-id="${habit.id}">
                            <i data-lucide="${isCompleted ? 'check-circle' : 'circle'}"></i>
                            <span>${isCompleted ? 'Completed' : 'Mark Done'}</span>
                        </button>
                    `}
                </div>
            `;

            container.appendChild(card);
        });

        // Re-initialize Lucide Icons for dynamic content
        if (window.lucide) lucide.createIcons();

        // Attach Card Event Listeners
        attachHabitCardEvents();
    }

    function attachHabitCardEvents() {
        const todayStr = state.selectedDate;

        document.querySelectorAll('.checkin-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                const habit = state.habits.find(h => h.id === id);
                if (!habit) return;

                const currentVal = habit.logs[todayStr] || 0;
                if (currentVal >= habit.target) {
                    habit.logs[todayStr] = 0;
                } else {
                    habit.logs[todayStr] = habit.target;
                    playSuccessChime();
                    addXP(15);
                    if (typeof confetti === 'function') {
                        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                    }
                }
                saveState();
                renderAll();
            });
        });

        document.querySelectorAll('.increment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const habit = state.habits.find(h => h.id === id);
                if (!habit) return;

                const currentVal = habit.logs[todayStr] || 0;
                habit.logs[todayStr] = currentVal + 1;
                
                if (habit.logs[todayStr] === habit.target) {
                    playSuccessChime();
                    addXP(15);
                    if (typeof confetti === 'function') {
                        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                    }
                } else {
                    playAudioTone(440, 0.08);
                }
                saveState();
                renderAll();
            });
        });

        document.querySelectorAll('.decrement-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const habit = state.habits.find(h => h.id === id);
                if (!habit) return;

                const currentVal = habit.logs[todayStr] || 0;
                if (currentVal > 0) {
                    habit.logs[todayStr] = currentVal - 1;
                    saveState();
                    renderAll();
                }
            });
        });

        document.querySelectorAll('.edit-habit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                openEditHabitModal(id);
            });
        });

        document.querySelectorAll('.delete-habit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const habit = state.habits.find(h => h.id === id);
                if (habit && confirm(`Are you sure you want to delete "${habit.name}"?`)) {
                    state.habits = state.habits.filter(h => h.id !== id);
                    saveState();
                    renderAll();
                }
            });
        });
    }

    // --- Weekly Matrix View ---
    function renderWeeklyMatrix() {
        const table = document.getElementById('matrixTable');
        const offset = state.selectedWeekOffset;
        
        // Generate array of dates for the week
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() + (offset * 7));
        const dayOfWeek = baseDate.getDay(); // 0 is Sunday
        
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(baseDate);
            d.setDate(d.getDate() - dayOfWeek + i);
            weekDates.push(d.toISOString().split('T')[0]);
        }

        const startStr = new Date(weekDates[0] + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = new Date(weekDates[6] + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        document.getElementById('weekRangeText').textContent = `${startStr} - ${endStr}`;

        let html = `
            <thead>
                <tr>
                    <th class="habit-col-header">Habit</th>
                    ${weekDates.map(dateStr => {
                        const d = new Date(dateStr + 'T00:00:00');
                        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                        const dayNum = d.getDate();
                        const isToday = dateStr === getTodayString(0);
                        return `<th style="${isToday ? 'color: var(--accent-primary); font-weight:800;' : ''}">${dayName}<br>${dayNum}</th>`;
                    }).join('')}
                </tr>
            </thead>
            <tbody>
        `;

        state.habits.forEach(habit => {
            html += `
                <tr>
                    <td class="habit-col-cell">
                        <span style="margin-right:0.4rem;">${habit.emoji || '⚡'}</span> ${escapeHTML(habit.name)}
                    </td>
                    ${weekDates.map(dateStr => {
                        const val = habit.logs[dateStr] || 0;
                        const isChecked = val >= habit.target;
                        return `
                            <td>
                                <button class="matrix-check-box ${isChecked ? 'checked' : ''}" 
                                        data-id="${habit.id}" data-date="${dateStr}">
                                    ${isChecked ? '<i data-lucide="check" style="width:18px;height:18px;"></i>' : ''}
                                </button>
                            </td>
                        `;
                    }).join('')}
                </tr>
            `;
        });

        html += `</tbody>`;
        table.innerHTML = html;

        if (window.lucide) lucide.createIcons();

        // Matrix Event Listeners
        table.querySelectorAll('.matrix-check-box').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const dateStr = btn.getAttribute('data-date');
                const habit = state.habits.find(h => h.id === id);
                if (!habit) return;

                const val = habit.logs[dateStr] || 0;
                if (val >= habit.target) {
                    habit.logs[dateStr] = 0;
                } else {
                    habit.logs[dateStr] = habit.target;
                    playSuccessChime();
                    addXP(10);
                }
                saveState();
                renderAll();
            });
        });
    }

    // --- Heatmap View ---
    function renderHeatmaps() {
        const container = document.getElementById('heatmapHabitsContainer');
        container.innerHTML = '';

        state.habits.forEach(habit => {
            const card = document.createElement('div');
            card.className = 'heatmap-card';

            const streak = calculateStreak(habit);

            let cellsHtml = '';
            for (let i = 89; i >= 0; i--) {
                const dateStr = getTodayString(-i);
                const val = habit.logs[dateStr] || 0;
                
                let lvlClass = 'lvl-0';
                if (val > 0) {
                    if (val >= habit.target) lvlClass = 'lvl-3';
                    else if (val >= habit.target / 2) lvlClass = 'lvl-2';
                    else lvlClass = 'lvl-1';
                }

                cellsHtml += `<div class="heatmap-cell ${lvlClass}" title="${dateStr}: ${val}/${habit.target}"></div>`;
            }

            card.innerHTML = `
                <div class="heatmap-header">
                    <div class="heatmap-title">
                        <span>${habit.emoji || '⚡'}</span> ${escapeHTML(habit.name)}
                    </div>
                    <div class="streak-pill">
                        <i data-lucide="flame"></i> ${streak}d active streak
                    </div>
                </div>
                <div class="heatmap-grid">
                    ${cellsHtml}
                </div>
            `;

            container.appendChild(card);
        });

        if (window.lucide) lucide.createIcons();
    }

    // --- Analytics Charts ---
    let weeklyChartInstance = null;
    let categoryChartInstance = null;

    function renderAnalytics() {
        if (typeof Chart === 'undefined') return;

        // Chart 1: Past 7 Days Weekly Completion Trend
        const ctx1 = document.getElementById('weeklyTrendChart').getContext('2d');
        const labels = [];
        const dataRates = [];

        for (let i = 6; i >= 0; i--) {
            const dateStr = getTodayString(-i);
            const d = new Date(dateStr + 'T00:00:00');
            labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));

            let totalCompleted = 0;
            state.habits.forEach(h => {
                if ((h.logs[dateStr] || 0) >= h.target) totalCompleted++;
            });
            const rate = state.habits.length > 0 ? Math.round((totalCompleted / state.habits.length) * 100) : 0;
            dataRates.push(rate);
        }

        if (weeklyChartInstance) weeklyChartInstance.destroy();
        weeklyChartInstance = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Completion Rate (%)',
                    data: dataRates,
                    borderColor: '#6366F1',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#8B5CF6',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { ticks: { color: '#9CA3AF' }, grid: { display: false } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });

        // Chart 2: Category Breakdown
        const ctx2 = document.getElementById('categoryPieChart').getContext('2d');
        const catMap = {};
        state.habits.forEach(h => {
            catMap[h.category] = (catMap[h.category] || 0) + 1;
        });

        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: Object.keys(catMap),
                datasets: [{
                    data: Object.values(catMap),
                    backgroundColor: ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#9CA3AF', font: { family: 'Plus Jakarta Sans' } } }
                }
            }
        });
    }

    // --- Focus Timer Logic ---
    let timerDuration = 25 * 60; // seconds
    let timerRemaining = timerDuration;
    let timerInterval = null;
    let isTimerRunning = false;

    function initFocusTimer() {
        const select = document.getElementById('timerHabitSelect');
        select.innerHTML = `<option value="">General Focus Session</option>`;
        state.habits.forEach(h => {
            select.innerHTML += `<option value="${h.id}">${h.emoji || '⚡'} ${escapeHTML(h.name)}</option>`;
        });

        updateTimerDisplay();

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mins = parseInt(btn.getAttribute('data-minutes'), 10);
                timerDuration = mins * 60;
                timerRemaining = timerDuration;
                if (isTimerRunning) pauseTimer();
                updateTimerDisplay();
            });
        });

        document.getElementById('timerStartBtn').addEventListener('click', () => {
            if (isTimerRunning) pauseTimer();
            else startTimer();
        });

        document.getElementById('timerResetBtn').addEventListener('click', () => {
            pauseTimer();
            timerRemaining = timerDuration;
            updateTimerDisplay();
        });
    }

    function startTimer() {
        isTimerRunning = true;
        document.getElementById('timerStartText').textContent = 'Pause';
        document.getElementById('timerPlayIcon').setAttribute('data-lucide', 'pause');
        if (window.lucide) lucide.createIcons();

        timerInterval = setInterval(() => {
            timerRemaining--;
            updateTimerDisplay();

            if (timerRemaining <= 0) {
                pauseTimer();
                playSuccessChime();
                if (typeof confetti === 'function') {
                    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
                }
                alert("🎉 Focus session completed! Great job!");
                
                // If habit linked, complete it
                const habitId = document.getElementById('timerHabitSelect').value;
                if (habitId) {
                    const habit = state.habits.find(h => h.id === habitId);
                    if (habit) {
                        const todayStr = getTodayString(0);
                        habit.logs[todayStr] = (habit.logs[todayStr] || 0) + 1;
                        addXP(25);
                        saveState();
                        renderAll();
                    }
                }
                timerRemaining = timerDuration;
                updateTimerDisplay();
            }
        }, 1000);
    }

    function pauseTimer() {
        isTimerRunning = false;
        clearInterval(timerInterval);
        document.getElementById('timerStartText').textContent = 'Start';
        document.getElementById('timerPlayIcon').setAttribute('data-lucide', 'play');
        if (window.lucide) lucide.createIcons();
    }

    function updateTimerDisplay() {
        const mins = Math.floor(timerRemaining / 60);
        const secs = timerRemaining % 60;
        const displayStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        document.getElementById('timerDisplay').textContent = displayStr;

        // Update Ring
        const ring = document.getElementById('timerRingProgress');
        if (ring) {
            const circumference = 660; // 2 * PI * 105
            const progress = (timerDuration - timerRemaining) / timerDuration;
            const offset = circumference * (1 - progress);
            ring.style.strokeDashoffset = offset;
        }
    }

    // --- Badges & Achievements ---
    function renderBadges() {
        const container = document.getElementById('badgesContainer');
        container.innerHTML = '';

        const stats = calculateOverallStats();

        BADGES.forEach(badge => {
            const isUnlocked = badge.check(stats);

            const card = document.createElement('div');
            card.className = `badge-card ${isUnlocked ? 'unlocked' : ''}`;
            card.innerHTML = `
                <div class="badge-icon-box">
                    <i data-lucide="${badge.icon}"></i>
                </div>
                <div class="badge-info">
                    <h4>${badge.title}</h4>
                    <p>${badge.desc}</p>
                    <div class="badge-status">${isUnlocked ? '✓ Unlocked' : '🔒 Locked'}</div>
                </div>
            `;
            container.appendChild(card);
        });

        if (window.lucide) lucide.createIcons();
    }

    // --- Modal Handler ---
    let selectedColor = '#6366F1';

    function initModal() {
        const modal = document.getElementById('habitModalBackdrop');
        const openBtn = document.getElementById('openAddHabitModalBtn');
        const emptyOpenBtn = document.getElementById('emptyAddHabitBtn');
        const closeBtn = document.getElementById('closeModalBtn');
        const cancelBtn = document.getElementById('cancelModalBtn');
        const form = document.getElementById('habitForm');

        function openModal(title = 'Create New Habit') {
            document.getElementById('modalTitle').textContent = title;
            modal.classList.remove('hidden');
        }

        function closeModal() {
            modal.classList.add('hidden');
            form.reset();
            document.getElementById('habitIdInput').value = '';
            selectedColor = '#6366F1';
            updateColorSelection();
        }

        openBtn.addEventListener('click', () => openModal('Create New Habit'));
        if (emptyOpenBtn) emptyOpenBtn.addEventListener('click', () => openModal('Create New Habit'));
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        // Color palette selection
        const paletteDots = document.querySelectorAll('.color-dot');
        paletteDots.forEach(dot => {
            dot.addEventListener('click', () => {
                selectedColor = dot.getAttribute('data-color');
                updateColorSelection();
            });
        });

        function updateColorSelection() {
            paletteDots.forEach(dot => {
                if (dot.getAttribute('data-color') === selectedColor) {
                    dot.classList.add('selected');
                } else {
                    dot.classList.remove('selected');
                }
            });
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('habitIdInput').value;
            const name = document.getElementById('habitNameInput').value.trim();
            const category = document.getElementById('habitCategorySelect').value;
            const emoji = document.getElementById('habitEmojiInput').value.trim() || '⚡';
            const target = parseInt(document.getElementById('habitTargetInput').value, 10) || 1;
            const unit = document.getElementById('habitUnitInput').value.trim() || 'times';
            const notes = document.getElementById('habitNotesInput').value.trim();

            if (!name) return;

            if (id) {
                // Edit existing habit
                const habit = state.habits.find(h => h.id === id);
                if (habit) {
                    habit.name = name;
                    habit.category = category;
                    habit.emoji = emoji;
                    habit.color = selectedColor;
                    habit.target = target;
                    habit.unit = unit;
                    habit.notes = notes;
                }
            } else {
                // Create new habit
                const newHabit = {
                    id: 'h-' + Date.now(),
                    name,
                    category,
                    emoji,
                    color: selectedColor,
                    target,
                    unit,
                    notes,
                    createdAt: getTodayString(0),
                    logs: {}
                };
                state.habits.unshift(newHabit);
                addXP(20);
            }

            saveState();
            closeModal();
            renderAll();
        });
    }

    function openEditHabitModal(id) {
        const habit = state.habits.find(h => h.id === id);
        if (!habit) return;

        document.getElementById('habitIdInput').value = habit.id;
        document.getElementById('habitNameInput').value = habit.name;
        document.getElementById('habitCategorySelect').value = habit.category;
        document.getElementById('habitEmojiInput').value = habit.emoji || '⚡';
        document.getElementById('habitTargetInput').value = habit.target;
        document.getElementById('habitUnitInput').value = habit.unit || 'times';
        document.getElementById('habitNotesInput').value = habit.notes || '';

        selectedColor = habit.color || '#6366F1';
        
        // Color selection update
        document.querySelectorAll('.color-dot').forEach(dot => {
            if (dot.getAttribute('data-color') === selectedColor) dot.classList.add('selected');
            else dot.classList.remove('selected');
        });

        document.getElementById('modalTitle').textContent = 'Edit Habit';
        document.getElementById('habitModalBackdrop').classList.remove('hidden');
    }

    // --- Navigation & View Switcher ---
    function initNavigation() {
        const navButtons = document.querySelectorAll('.nav-item');
        const views = document.querySelectorAll('.view-panel');

        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetView = btn.getAttribute('data-view');

                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                views.forEach(v => {
                    if (v.id === `view-${targetView}`) {
                        v.classList.remove('hidden');
                    } else {
                        v.classList.add('hidden');
                    }
                });

                // Render view specific content
                if (targetView === 'matrix') renderWeeklyMatrix();
                if (targetView === 'heatmap') renderHeatmaps();
                if (targetView === 'analytics') renderAnalytics();
                if (targetView === 'achievements') renderBadges();
            });
        });

        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        // Theme Toggle
        document.getElementById('themeToggleBtn').addEventListener('click', () => {
            if (document.body.classList.contains('light-mode')) {
                document.body.classList.remove('light-mode');
                state.theme = 'dark';
                document.getElementById('themeText').textContent = 'Dark Mode';
                document.getElementById('themeIcon').setAttribute('data-lucide', 'moon');
            } else {
                document.body.classList.add('light-mode');
                state.theme = 'light';
                document.getElementById('themeText').textContent = 'Light Mode';
                document.getElementById('themeIcon').setAttribute('data-lucide', 'sun');
            }
            if (window.lucide) lucide.createIcons();
            saveState();
        });

        // Sound Toggle
        document.getElementById('soundToggleBtn').addEventListener('click', () => {
            state.soundEnabled = !state.soundEnabled;
            document.getElementById('soundText').textContent = state.soundEnabled ? 'Sound On' : 'Sound Off';
            document.getElementById('soundIcon').setAttribute('data-lucide', state.soundEnabled ? 'volume-2' : 'volume-x');
            if (window.lucide) lucide.createIcons();
            saveState();
        });

        // Quote Refresh
        document.getElementById('refreshQuoteBtn').addEventListener('click', () => {
            const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
            document.getElementById('quoteText').textContent = `"${randomQuote}"`;
        });

        // Date Picker Controls
        document.getElementById('prevDayBtn').addEventListener('click', () => {
            const d = new Date(state.selectedDate + 'T00:00:00');
            d.setDate(d.getDate() - 1);
            state.selectedDate = d.toISOString().split('T')[0];
            renderAll();
        });

        document.getElementById('nextDayBtn').addEventListener('click', () => {
            const d = new Date(state.selectedDate + 'T00:00:00');
            d.setDate(d.getDate() + 1);
            state.selectedDate = d.toISOString().split('T')[0];
            renderAll();
        });

        document.getElementById('todayDateBtn').addEventListener('click', () => {
            state.selectedDate = getTodayString(0);
            renderAll();
        });

        // Week Matrix Controls
        document.getElementById('prevWeekBtn').addEventListener('click', () => {
            state.selectedWeekOffset--;
            renderWeeklyMatrix();
        });

        document.getElementById('nextWeekBtn').addEventListener('click', () => {
            state.selectedWeekOffset++;
            renderWeeklyMatrix();
        });

        // Filters
        document.getElementById('habitSearchInput').addEventListener('input', renderHabitsList);
        document.getElementById('categoryFilter').addEventListener('change', renderHabitsList);
        document.getElementById('statusFilter').addEventListener('change', renderHabitsList);
    }

    // --- Helper Utilities ---
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    function renderAll() {
        renderHeaderDates();
        renderUserLevel();
        renderStatsSummary();
        renderHabitsList();
    }

    // --- Application Bootstrapping ---
    document.addEventListener('DOMContentLoaded', () => {
        loadState();
        initNavigation();
        initModal();
        initFocusTimer();
        renderAll();

        if (window.lucide) lucide.createIcons();
    });

})();
