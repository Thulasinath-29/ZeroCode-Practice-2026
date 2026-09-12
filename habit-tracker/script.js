// Habit Tracker - Refined Editorial Implementation (Vanilla ES6)

(function () {
  'use strict';

  // Local Storage Keys
  const STORAGE_KEY = 'glass_habits_v1';
  const QUOTE_STORAGE_KEY = 'glass_daily_quote_v1';

  // Application State
  let habits = [];
  let editingHabitId = null;
  let selectedPriority = 3;
  let selectedDaysInModal = new Set();
  let currentSort = 'priority-desc';
  let habitIdToDelete = null;

  // DOM Elements
  const habitsGrid = document.getElementById('habitsGrid');
  const emptyState = document.getElementById('emptyState');
  const habitsCountBadge = document.getElementById('habitsCountBadge');
  const habitsControls = document.getElementById('habitsControls');
  const habitSortSelect = document.getElementById('habitSortSelect');
  const totalHabitsCount = document.getElementById('totalHabitsCount');
  const totalCompletedHabits = document.getElementById('totalCompletedHabits');
  const earnedPointsEl = document.getElementById('earnedPoints');
  const targetPointsEl = document.getElementById('targetPoints');
  const pointsProgressBar = document.getElementById('pointsProgressBar');
  const overallPercentEl = document.getElementById('overallPercent');
  const overallProgressBar = document.getElementById('overallProgressBar');
  const dailyPercentEl = document.getElementById('dailyPercent');
  const dailyProgressBar = document.getElementById('dailyProgressBar');
  const toastContainer = document.getElementById('toastContainer');

  // Modal Elements
  const habitModal = document.getElementById('habitModal');
  const modalTitle = document.getElementById('modalTitle');
  const habitForm = document.getElementById('habitForm');
  const habitTitleInput = document.getElementById('habitTitleInput');
  const titleError = document.getElementById('titleError');
  const sliderCurrentBadge = document.getElementById('sliderCurrentBadge');
  const sliderWrap = document.getElementById('sliderWrap');
  const daysGridRow = document.getElementById('daysGridRow');
  const quickSelectAll = document.getElementById('quickSelectAll');
  const quickClearAll = document.getElementById('quickClearAll');
  const habitPointsInput = document.getElementById('habitPointsInput');
  const starContainer = document.getElementById('starContainer');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const addHabitHeaderBtn = document.getElementById('addHabitHeaderBtn');
  const centerAddBtn = document.getElementById('centerAddBtn');
  const deleteHabitInModalBtn = document.getElementById('deleteHabitInModalBtn');

  // Delete Confirmation Modal Elements
  const deleteConfirmModal = document.getElementById('deleteConfirmModal');
  const deleteHabitName = document.getElementById('deleteHabitName');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');

  // Behavioral Matrix Graph
  const chartBarsWrap = document.getElementById('chartBarsWrap');

  // Motivational Quote Elements
  const quoteText = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');
  const refreshQuoteBtn = document.getElementById('refreshQuoteBtn');
  const quoteDateTag = document.getElementById('quoteDateTag');

  const INSPIRATIONAL_QUOTES = [
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
    { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
    { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
    { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
    { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "Consistency is the DNA of mastery.", author: "Robin Sharma" },
    { text: "It is easier to prevent bad habits than to break them.", author: "Benjamin Franklin" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
    { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
    { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },
    { text: "First forget inspiration. Habit is more dependable.", author: "Octavia Butler" },
    { text: "Champions do not become champions when they win the event, but in the hours, weeks, and months before.", author: "Michael Phelps" },
    { text: "Drop by drop is the water pot filled. Likewise, the wise one gathers good little by little.", author: "The Buddha" },
    { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
    { text: "Rest but never quit. Even the sun has a sinking spell each evening. But it always rises the next morning.", author: "Muhammad Ali" },
    { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
    { text: "Great things are not done by impulse, but by a series of small things brought together.", author: "Vincent Van Gogh" },
    { text: "A habit cannot be tossed out the window; it must be coaxed down the stairs a step at a time.", author: "Mark Twain" },
    { text: "If you want to live a happy life, tie it to a goal, not to people or things.", author: "Albert Einstein" },
    { text: "Continuous effort—not strength or intelligence—is the key to unlocking our potential.", author: "Winston Churchill" }
  ];

  const WEEKDAY_NAMES = [
    { num: 1, label: '01', short: 'Mon', full: 'Monday' },
    { num: 2, label: '02', short: 'Tue', full: 'Tuesday' },
    { num: 3, label: '03', short: 'Wed', full: 'Wednesday' },
    { num: 4, label: '04', short: 'Thu', full: 'Thursday' },
    { num: 5, label: '05', short: 'Fri', full: 'Friday' },
    { num: 6, label: '06', short: 'Sat', full: 'Saturday' },
    { num: 7, label: '07', short: 'Sun', full: 'Sunday' }
  ];

  // Initialize Application
  function init() {
    loadHabitsFromStorage();
    setupEventListeners();
    setupStarRating();
    render();
    fetchOrLoadDailyQuote();
  }

  // Load Habits from LocalStorage
  function loadHabitsFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        habits = JSON.parse(data);
        habits.forEach((h) => {
          if (!Array.isArray(h.selectedDays)) {
            h.selectedDays = Array.from({ length: Math.min(7, Math.max(0, h.activeDays || 0)) }, (_, i) => i + 1);
          }
        });
      } else {
        habits = [];
      }
    } catch (e) {
      console.error('Failed to load habits from localStorage', e);
      habits = [];
    }
  }

  // Save Habits to LocalStorage
  function saveHabitsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (e) {
      console.error('Failed to save habits to localStorage', e);
    }
  }

  // Star Rating Selector Setup
  function setupStarRating() {
    starContainer.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const starBtn = document.createElement('button');
      starBtn.type = 'button';
      starBtn.className = 'interactive-star' + (i <= selectedPriority ? ' selected' : '');
      starBtn.dataset.star = i;
      starBtn.setAttribute('aria-label', `${i} star priority`);
      starBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      `;

      starBtn.addEventListener('mouseenter', () => highlightStars(i));
      starBtn.addEventListener('mouseleave', () => highlightStars(selectedPriority));
      starBtn.addEventListener('click', () => {
        selectedPriority = i;
        highlightStars(selectedPriority);
      });

      starContainer.appendChild(starBtn);
    }
  }

  function highlightStars(count) {
    const stars = starContainer.querySelectorAll('.interactive-star');
    stars.forEach((star, idx) => {
      if (idx < count) {
        star.classList.add('selected');
      } else {
        star.classList.remove('selected');
      }
    });
  }

  function setStarPriority(priority) {
    selectedPriority = Math.max(1, Math.min(5, Number(priority) || 1));
    highlightStars(selectedPriority);
  }

  // Update Days Selector inside Modal
  function updateModalDaysUI() {
    const dayBtns = document.querySelectorAll('#daysGridRow .day-toggle-btn');
    dayBtns.forEach((btn) => {
      const dayNum = parseInt(btn.dataset.day, 10);
      if (selectedDaysInModal.has(dayNum)) {
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('selected');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    const count = selectedDaysInModal.size;
    if (count === 0) {
      sliderCurrentBadge.textContent = '0 / 7 Days';
    } else if (count === 7) {
      sliderCurrentBadge.textContent = 'All 7 Weekdays (7/7)';
    } else {
      const sorted = Array.from(selectedDaysInModal).sort((a, b) => a - b);
      const dayLabels = sorted.map((d) => WEEKDAY_NAMES[d - 1].short).join(', ');
      sliderCurrentBadge.textContent = `${dayLabels} (${count}/7)`;
    }
  }

  // Event Listeners
  function setupEventListeners() {
    if (centerAddBtn) {
      centerAddBtn.addEventListener('click', () => openModal());
    }
    if (addHabitHeaderBtn) {
      addHabitHeaderBtn.addEventListener('click', () => openModal());
    }

    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', closeModal);
    }
    if (cancelModalBtn) {
      cancelModalBtn.addEventListener('click', closeModal);
    }

    habitModal.addEventListener('click', (e) => {
      if (e.target === habitModal) {
        closeModal();
      }
    });

    if (daysGridRow) {
      daysGridRow.addEventListener('click', (e) => {
        const btn = e.target.closest('.day-toggle-btn');
        if (!btn) return;
        const dayNum = parseInt(btn.dataset.day, 10);
        if (selectedDaysInModal.has(dayNum)) {
          selectedDaysInModal.delete(dayNum);
        } else {
          selectedDaysInModal.add(dayNum);
        }
        updateModalDaysUI();
      });
    }

    if (quickSelectAll) {
      quickSelectAll.addEventListener('click', () => {
        selectedDaysInModal = new Set([1, 2, 3, 4, 5, 6, 7]);
        updateModalDaysUI();
      });
    }

    if (quickClearAll) {
      quickClearAll.addEventListener('click', () => {
        selectedDaysInModal.clear();
        updateModalDaysUI();
      });
    }

    if (habitSortSelect) {
      habitSortSelect.value = currentSort;
      habitSortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderHabitCards();
      });
    }

    habitForm.addEventListener('submit', handleFormSubmit);

    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', executeDeleteHabit);
    }

    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener('click', closeDeleteConfirmModal);
    }

    if (closeDeleteModalBtn) {
      closeDeleteModalBtn.addEventListener('click', closeDeleteConfirmModal);
    }

    if (deleteConfirmModal) {
      deleteConfirmModal.addEventListener('click', (e) => {
        if (e.target === deleteConfirmModal) {
          closeDeleteConfirmModal();
        }
      });
    }

    if (deleteHabitInModalBtn) {
      deleteHabitInModalBtn.addEventListener('click', () => {
        if (editingHabitId) {
          openDeleteConfirmModal(editingHabitId);
        }
      });
    }

    habitTitleInput.addEventListener('input', () => {
      if (habitTitleInput.value.trim().length > 0) {
        habitTitleInput.classList.remove('input-error');
        sliderWrap.classList.remove('bar-error-vibrate');
        titleError.classList.remove('show');
      }
    });

    if (refreshQuoteBtn) {
      refreshQuoteBtn.addEventListener('click', () => {
        fetchOrLoadDailyQuote(true);
      });
    }
  }

  // Open Modal (Add or Edit)
  function openModal(habitToEdit = null) {
    habitForm.reset();
    habitTitleInput.classList.remove('input-error');
    sliderWrap.classList.remove('bar-error-vibrate');
    titleError.classList.remove('show');

    if (habitToEdit) {
      editingHabitId = habitToEdit.id;
      modalTitle.textContent = 'Edit Habit';
      habitTitleInput.value = habitToEdit.title;
      const initialDays = Array.isArray(habitToEdit.selectedDays)
        ? habitToEdit.selectedDays
        : Array.from({ length: habitToEdit.activeDays || 0 }, (_, i) => i + 1);
      selectedDaysInModal = new Set(initialDays);
      updateModalDaysUI();
      setStarPriority(habitToEdit.priority);
      habitPointsInput.value = habitToEdit.points || 50;
      if (deleteHabitInModalBtn) {
        deleteHabitInModalBtn.style.display = 'inline-flex';
      }
    } else {
      editingHabitId = null;
      modalTitle.textContent = 'Add New Habit';
      habitTitleInput.value = '';
      selectedDaysInModal = new Set();
      updateModalDaysUI();
      setStarPriority(3);
      habitPointsInput.value = '50';
      if (deleteHabitInModalBtn) {
        deleteHabitInModalBtn.style.display = 'none';
      }
    }

    habitModal.classList.add('active');
    setTimeout(() => {
      habitTitleInput.focus();
    }, 150);
  }

  // Close Modal
  function closeModal() {
    habitModal.classList.remove('active');
    editingHabitId = null;
  }

  // Form Submit & Validation
  function handleFormSubmit(e) {
    e.preventDefault();

    const title = habitTitleInput.value.trim();
    const sortedDays = Array.from(selectedDaysInModal).sort((a, b) => a - b);
    const activeDays = sortedDays.length;
    const points = parseInt(habitPointsInput.value, 10) || 50;

    // Minimum 1 non-whitespace character validation
    if (!title || title.length === 0) {
      habitTitleInput.classList.add('input-error');
      titleError.classList.add('show');
      sliderWrap.classList.add('bar-error-vibrate');

      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([100, 50, 100]);
        } catch (err) {
          // Ignore
        }
      }

      habitTitleInput.focus();

      setTimeout(() => {
        sliderWrap.classList.remove('bar-error-vibrate');
      }, 500);
      return;
    }

    if (editingHabitId) {
      const habitIndex = habits.findIndex((h) => h.id === editingHabitId);
      if (habitIndex !== -1) {
        habits[habitIndex].title = title;
        habits[habitIndex].selectedDays = sortedDays;
        habits[habitIndex].activeDays = activeDays;
        habits[habitIndex].priority = selectedPriority;
        habits[habitIndex].points = points;
        showToast(`RECORD UPDATED: "${title}"`);
      }
    } else {
      const newHabit = {
        id: 'habit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        title: title,
        selectedDays: sortedDays,
        activeDays: activeDays,
        priority: selectedPriority,
        points: points,
        createdAt: Date.now(),
      };
      habits.unshift(newHabit);
      showToast(`NEW HABIT ARCHIVED: "${title}"`);
    }

    saveHabitsToStorage();
    render();
    closeModal();
  }

  // Increment / Decrement Day
  window.handleDayChange = function (habitId, change) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    if (!Array.isArray(habit.selectedDays)) {
      habit.selectedDays = Array.from({ length: Math.min(7, Math.max(0, habit.activeDays || 0)) }, (_, i) => i + 1);
    }

    if (change > 0) {
      if (habit.selectedDays.length >= 7) return;
      for (let d = 1; d <= 7; d++) {
        if (!habit.selectedDays.includes(d)) {
          habit.selectedDays.push(d);
          break;
        }
      }
    } else if (change < 0) {
      if (habit.selectedDays.length <= 0) return;
      habit.selectedDays.sort((a, b) => a - b);
      habit.selectedDays.pop();
    }

    habit.selectedDays.sort((a, b) => a - b);
    habit.activeDays = habit.selectedDays.length;

    if (habit.activeDays === 7) {
      showToast(`COMPLETED 7/7: "${habit.title}"`);
    }

    saveHabitsToStorage();
    render();
  };

  // Toggle specific day directly on habit card
  window.handleToggleHabitDay = function (habitId, dayNum) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    if (!Array.isArray(habit.selectedDays)) {
      habit.selectedDays = Array.from({ length: Math.min(7, Math.max(0, habit.activeDays || 0)) }, (_, i) => i + 1);
    }

    const idx = habit.selectedDays.indexOf(dayNum);
    if (idx !== -1) {
      habit.selectedDays.splice(idx, 1);
    } else {
      if (habit.selectedDays.length < 7) {
        habit.selectedDays.push(dayNum);
      }
    }

    habit.selectedDays.sort((a, b) => a - b);
    habit.activeDays = habit.selectedDays.length;

    if (habit.activeDays === 7) {
      showToast(`COMPLETED 7/7: "${habit.title}"`);
    }

    saveHabitsToStorage();
    render();
  };

  // Edit Habit Action
  window.handleEditHabit = function (habitId) {
    const habit = habits.find((h) => h.id === habitId);
    if (habit) {
      openModal(habit);
    }
  };

  // Delete Confirmation Modal
  function openDeleteConfirmModal(habitId) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    habitIdToDelete = habitId;
    if (deleteHabitName) {
      deleteHabitName.textContent = `"${habit.title}"`;
    }
    if (deleteConfirmModal) {
      deleteConfirmModal.classList.add('active');
    }
  }

  function closeDeleteConfirmModal() {
    if (deleteConfirmModal) {
      deleteConfirmModal.classList.remove('active');
    }
    habitIdToDelete = null;
  }

  function executeDeleteHabit() {
    if (!habitIdToDelete) return;
    const habit = habits.find((h) => h.id === habitIdToDelete);
    const habitTitle = habit ? habit.title : 'Habit';

    habits = habits.filter((h) => h.id !== habitIdToDelete);
    saveHabitsToStorage();
    render();

    closeDeleteConfirmModal();
    closeModal();
    showToast(`REMOVED: "${habitTitle}"`);
  }

  window.handleDeleteHabit = function (habitId) {
    openDeleteConfirmModal(habitId);
  };

  // Render Master UI
  function render() {
    renderHabitCards();
    renderStatistics();
    renderWeeklyGraph();
  }

  // Render Habit Cards
  function renderHabitCards() {
    const count = habits.length;
    habitsCountBadge.textContent = count < 10 ? `0${count}` : `${count}`;

    if (count === 0) {
      habitsGrid.style.display = 'none';
      emptyState.style.display = 'flex';
      if (habitsControls) {
        habitsControls.style.display = 'none';
      }
      return;
    }

    habitsGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    if (habitsControls) {
      habitsControls.style.display = 'flex';
    }

    const sortedHabits = [...habits];
    if (currentSort === 'priority-desc') {
      sortedHabits.sort((a, b) => {
        const diff = (b.priority || 0) - (a.priority || 0);
        if (diff !== 0) return diff;
        return (a.title || '').localeCompare(b.title || '');
      });
    } else if (currentSort === 'title-asc') {
      sortedHabits.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    habitsGrid.innerHTML = sortedHabits
      .map((habit) => {
        const isCompleted = habit.activeDays >= 7;
        const progressPercent = Math.round((habit.activeDays / 7) * 100);
        const earnedPoints = Math.round((habit.activeDays / 7) * habit.points);

        // Render Star SVGs
        let starIconsHtml = '';
        for (let s = 1; s <= 5; s++) {
          const filled = s <= habit.priority ? 'filled' : '';
          starIconsHtml += `
            <svg class="star-icon ${filled}" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          `;
        }

        const selectedDays = Array.isArray(habit.selectedDays)
          ? habit.selectedDays
          : Array.from({ length: Math.min(7, Math.max(0, habit.activeDays || 0)) }, (_, i) => i + 1);

        // Render 7 Weekday Buttons (01 Mon to 07 Sun)
        let dayChipsHtml = '';
        WEEKDAY_NAMES.forEach((dayObj) => {
          const isActive = selectedDays.includes(dayObj.num);
          const activeClass = isActive ? 'active' : '';
          dayChipsHtml += `
            <button 
              type="button" 
              class="card-day-btn ${activeClass}" 
              onclick="handleToggleHabitDay('${habit.id}', ${dayObj.num})"
              title="${dayObj.full} (Day ${dayObj.num}): ${isActive ? 'Active (Click to deselect)' : 'Inactive (Click to activate)'}"
              aria-label="Toggle ${dayObj.full} for ${escapeHtml(habit.title)}"
            >
              <span>${dayObj.label}</span>
              <span class="sub-day">${dayObj.short}</span>
            </button>
          `;
        });

        const priorityWords = ['Minimal', 'Low', 'Medium', 'High', 'Critical'];
        const priorityLabel = priorityWords[(habit.priority || 3) - 1] || 'Medium';

        return `
          <div class="habit-card ${isCompleted ? 'is-completed' : ''}" id="card-${habit.id}">
            <div class="habit-card-header">
              <div>
                <h3 class="habit-title">${escapeHtml(habit.title)}</h3>
                <div class="habit-stars" title="${habit.priority} Star Priority">
                  ${starIconsHtml}
                </div>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                <div class="habit-points-badge">
                  ⭐ ${earnedPoints} / ${habit.points} pts
                </div>
                ${
                  isCompleted
                    ? `<span class="completed-tag">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Completed
                       </span>`
                    : ''
                }
              </div>
            </div>

            <div>
              <span class="label" style="margin-bottom: 0.35rem;">Priority: ${priorityLabel}</span>
              <div class="bar-track">
                <div class="bar-fill ${isCompleted ? 'secondary' : 'accent'}" style="width: ${progressPercent}%;"></div>
              </div>
              <div class="card-progress-meta">
                <span class="label" style="margin-bottom: 0;">Weekly Rhythm</span>
                <span class="label" style="margin-bottom: 0; color: var(--ink); font-weight: 700;">${habit.activeDays} / 7 Days (${progressPercent}%)</span>
              </div>
            </div>

            <div>
              <div class="card-days-grid">
                ${dayChipsHtml}
              </div>
            </div>

            <div class="habit-card-footer">
              <div class="day-counter-controls">
                <button 
                  type="button" 
                  class="btn-counter" 
                  onclick="handleDayChange('${habit.id}', -1)"
                  ${habit.activeDays <= 0 ? 'disabled' : ''}
                  title="Subtract Day (-1)"
                  aria-label="Subtract 1 day from ${escapeHtml(habit.title)}"
                >−</button>
                <button 
                  type="button" 
                  class="btn-counter" 
                  onclick="handleDayChange('${habit.id}', 1)"
                  ${habit.activeDays >= 7 ? 'disabled' : ''}
                  title="Add Completed Day (+1)"
                  aria-label="Add 1 day to ${escapeHtml(habit.title)}"
                >+</button>
              </div>

              <div class="habit-actions-group">
                <button 
                  type="button" 
                  class="btn-card-action" 
                  onclick="handleEditHabit('${habit.id}')"
                  title="Update Habit"
                >Update</button>
                <button 
                  type="button" 
                  class="btn-card-action delete-action" 
                  onclick="handleDeleteHabit('${habit.id}')"
                  title="Delete Habit"
                >Delete</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // Render Sidebar Statistics & Progress
  function renderStatistics() {
    const totalHabits = habits.length;
    const completedHabits = habits.filter((h) => h.activeDays >= 7).length;

    totalHabitsCount.textContent = totalHabits < 10 ? `0${totalHabits}` : `${totalHabits}`;
    totalCompletedHabits.textContent = completedHabits < 10 ? `0${completedHabits}` : `${completedHabits}`;

    let totalTargetPoints = 0;
    let totalEarnedPoints = 0;
    let totalActiveDays = 0;
    const maxPossibleDays = totalHabits * 7;

    habits.forEach((h) => {
      totalTargetPoints += h.points || 0;
      totalEarnedPoints += Math.round(((h.activeDays || 0) / 7) * (h.points || 0));
      totalActiveDays += h.activeDays || 0;
    });

    earnedPointsEl.textContent = totalEarnedPoints;
    targetPointsEl.textContent = totalTargetPoints;

    const pointsPercent = totalTargetPoints > 0 ? Math.round((totalEarnedPoints / totalTargetPoints) * 100) : 0;
    pointsProgressBar.style.width = `${pointsPercent}%`;

    const overallPercent = maxPossibleDays > 0 ? Math.round((totalActiveDays / maxPossibleDays) * 100) : 0;
    overallPercentEl.textContent = `${overallPercent}%`;
    overallProgressBar.style.width = `${overallPercent}%`;

    let dailyRate = 0;
    if (totalHabits > 0) {
      dailyRate = Math.round((totalActiveDays / (totalHabits * 7)) * 100);
    }
    dailyPercentEl.textContent = `${dailyRate}%`;
    dailyProgressBar.style.width = `${dailyRate}%`;
  }

  // Render Behavioral Matrix with Weekday Names
  function renderWeeklyGraph() {
    const totalHabits = habits.length;
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    habits.forEach((h) => {
      const days = Array.isArray(h.selectedDays)
        ? h.selectedDays
        : Array.from({ length: Math.min(7, Math.max(0, h.activeDays || 0)) }, (_, i) => i + 1);

      days.forEach((d) => {
        if (d >= 1 && d <= 7) {
          dayCounts[d - 1]++;
        }
      });
    });

    chartBarsWrap.innerHTML = WEEKDAY_NAMES.map((day, index) => {
      const count = dayCounts[index];
      const percentage = totalHabits > 0 ? Math.round((count / totalHabits) * 100) : 0;
      const barHeight = Math.max(4, percentage);

      return `
        <div class="chart-col">
          <div class="chart-bar-outer" title="${day.full}: ${count} of ${totalHabits} active (${percentage}%)">
            <div class="chart-bar-inner" style="height: ${barHeight}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Quote of the Day: Fetch & Daily Caching
  async function fetchOrLoadDailyQuote(forceNew = false) {
    if (!quoteText || !quoteAuthor) return;

    const todayStr = new Date().toISOString().slice(0, 10);

    if (!forceNew) {
      try {
        const cachedRaw = localStorage.getItem(QUOTE_STORAGE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached && cached.date === todayStr && cached.text) {
            displayQuote(cached.text, cached.author, 'Today');
            return;
          }
        }
      } catch (err) {
        console.warn('Could not read cached quote', err);
      }
    }

    if (refreshQuoteBtn) {
      refreshQuoteBtn.classList.add('loading');
      refreshQuoteBtn.setAttribute('disabled', 'true');
    }

    let quoteFound = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch('https://dummyjson.com/quotes/random', {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.quote) {
          quoteFound = {
            text: data.quote,
            author: data.author || 'Inspirational'
          };
        }
      }
    } catch (fetchErr) {
      console.log('Daily quote API fetch fallback engaged:', fetchErr.message);
    }

    if (!quoteFound) {
      if (forceNew) {
        const randomIdx = Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length);
        quoteFound = INSPIRATIONAL_QUOTES[randomIdx];
      } else {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const diff = now - startOfYear;
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
        const dayIndex = Math.abs(dayOfYear) % INSPIRATIONAL_QUOTES.length;
        quoteFound = INSPIRATIONAL_QUOTES[dayIndex];
      }
    }

    try {
      localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify({
        text: quoteFound.text,
        author: quoteFound.author,
        date: todayStr
      }));
    } catch (e) {
      // LocalStorage fallback
    }

    displayQuote(quoteFound.text, quoteFound.author, forceNew ? 'Fresh' : 'Today');

    if (refreshQuoteBtn) {
      setTimeout(() => {
        refreshQuoteBtn.classList.remove('loading');
        refreshQuoteBtn.removeAttribute('disabled');
      }, 400);
    }
  }

  function displayQuote(text, author, tag = 'Today') {
    if (!quoteText || !quoteAuthor) return;

    quoteText.style.opacity = '0';
    quoteAuthor.style.opacity = '0';

    setTimeout(() => {
      quoteText.textContent = `"${text.replace(/^["']|["']$/g, '')}"`;
      quoteAuthor.textContent = `— ${author || 'Anonymous'}`;
      if (quoteDateTag) {
        quoteDateTag.textContent = tag;
      }
      quoteText.style.opacity = '1';
      quoteAuthor.style.opacity = '1';
      quoteText.style.transition = 'opacity 0.35s ease';
      quoteAuthor.style.transition = 'opacity 0.35s ease';
    }, 150);
  }

  // Toast Notification helper
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => {
        toast.remove();
      }, 250);
    }, 3000);
  }

  // HTML sanitizer
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Bootstrap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
