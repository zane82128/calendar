import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAuNVBeAdy-OaZ3LVsGsXYg5RTrFt688Cc",
  authDomain: "calendar-c745b.firebaseapp.com",
  projectId: "calendar-c745b",
  storageBucket: "calendar-c745b.firebasestorage.app",
  messagingSenderId: "890163940632",
  appId: "1:890163940632:web:19511a5bd362838300a26d",
  measurementId: "G-L6TEDLXKN0",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();

const monthFormatter = new Intl.DateTimeFormat('en', { month: 'long' });
const dayFormatter = new Intl.DateTimeFormat('en', { day: 'numeric' });
const fullDateFormatter = new Intl.DateTimeFormat('en', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
const weekdayFormatter = new Intl.DateTimeFormat('en', { weekday: 'long' });
const TIME_STEP_MINUTES = 30;
const HOUR_MINUTES = Array.from({ length: 24 }, (_, hour) => hour * 60);
const DOM = {
  month: document.getElementById('calendar-month'),
  year: document.getElementById('calendar-year'),
  days: document.getElementById('calendar-days'),
  buttons: document.querySelectorAll('.calendar__btn'),
  selectedDate: document.getElementById('selected-date'),
  selectedWeekday: document.getElementById('selected-weekday'),
  dayHours: document.getElementById('day-hours'),
  calendarForm: document.getElementById('calendar-form'),
  calendarDate: document.getElementById('calendar-date'),
  calendarStart: document.getElementById('calendar-start'),
  calendarEnd: document.getElementById('calendar-end'),
  calendarLabel: document.getElementById('calendar-label'),
  authLogin: document.getElementById('auth-login'),
  authLogout: document.getElementById('auth-logout'),
  userName: document.getElementById('user-name'),
  installBtn: document.getElementById('install-btn'),
  authGate: document.getElementById('auth-gate'),
  appRoot: document.getElementById('app-root'),
  taskToggle: document.getElementById('task-toggle'),
  taskPanel: document.getElementById('task-panel'),
  taskList: document.getElementById('task-list'),
  taskClose: document.getElementById('task-close'),
  dayView: document.querySelector('.day-view'),
};

const state = {
  viewDate: new Date(),
  selectedDate: new Date(),
  events: {},
  dayViewVisible: false,
  taskPanelVisible: false,
  currentUser: null,
};

let eventCounter = 0;
let unsubscribeEvents = null;
let deferredInstallPrompt = null;
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches
  || window.navigator.standalone === true;
let isAppInstalled = isStandalone();

function setAuthUI(user) {
  if (!DOM.userName || !DOM.authLogin || !DOM.authLogout || !DOM.authGate || !DOM.appRoot) return;
  if (user) {
    DOM.userName.textContent = user.displayName || user.email || 'Logged in';
    DOM.authGate.hidden = true;
    DOM.appRoot.classList.remove('app--hidden');
    DOM.authLogout.hidden = false;
  } else {
    DOM.userName.textContent = 'Guest';
    DOM.authGate.hidden = false;
    DOM.appRoot.classList.add('app--hidden');
    DOM.authLogout.hidden = true;
  }
}

function setView(date) {
  state.viewDate = new Date(date.getFullYear(), date.getMonth(), 1);
  if (!state.selectedDate || !isSameMonth(state.selectedDate, state.viewDate)) {
    state.selectedDate = new Date(state.viewDate);
    syncQuickFormDate(state.selectedDate);
  } else {
    syncQuickFormDate(state.selectedDate);
  }
  render();
}

function changeMonth(delta) {
  const next = new Date(state.viewDate);
  next.setMonth(state.viewDate.getMonth() + delta);
  setView(next);
}

function goToToday() {
  const now = new Date();
  focusDate(now);
}

function buildCalendarDates(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDayIndex = firstDay.getDay();
  const dates = [];

  // Determine leading days from previous month so the grid starts on Sunday
  for (let i = startDayIndex - 1; i >= 0; i -= 1) {
    const date = new Date(year, month, -i);
    dates.push({ date, outside: true });
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day += 1) {
    dates.push({ date: new Date(year, month, day), outside: false });
  }

  // Fill remaining cells to complete 6 rows (6 * 7 = 42)
  const cellsToFill = 42 - dates.length;
  for (let day = 1; day <= cellsToFill; day += 1) {
    dates.push({ date: new Date(year, month + 1, day), outside: true });
  }

  return dates;
}

function isSameDay(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear()
    && dateA.getMonth() === dateB.getMonth()
    && dateA.getDate() === dateB.getDate()
  );
}

function isSameMonth(dateA, dateB) {
  return dateA.getFullYear() === dateB.getFullYear() && dateA.getMonth() === dateB.getMonth();
}

function showDayView() {
  state.dayViewVisible = true;
  DOM.dayView?.removeAttribute('hidden');
}

function hideDayView() {
  state.dayViewVisible = false;
  DOM.dayView?.setAttribute('hidden', '');
}

function showTaskPanel() {
  state.taskPanelVisible = true;
  DOM.taskPanel?.removeAttribute('hidden');
  renderTaskList();
}

function hideTaskPanel() {
  state.taskPanelVisible = false;
  DOM.taskPanel?.setAttribute('hidden', '');
}

function toggleTaskPanel() {
  if (state.taskPanelVisible) hideTaskPanel();
  else showTaskPanel();
}

function focusDate(date, { reRender = true } = {}) {
  state.viewDate = new Date(date.getFullYear(), date.getMonth(), 1);
  setSelectedDate(date, { reRender });
}

function setSelectedDate(date, { reRender = true } = {}) {
  state.selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  syncQuickFormDate(state.selectedDate);
  showDayView();
  if (reRender) render();
}

function handleDaySelection(date, outside) {
  if (outside) {
    focusDate(date);
    return;
  }
  if (state.dayViewVisible && state.selectedDate && isSameDay(date, state.selectedDate)) {
    hideDayView();
    renderDayView();
    return;
  }
  setSelectedDate(date);
}

function populateTimeSelects(startSelect, endSelect) {
  if (!startSelect || !endSelect) return;
  const totalMinutes = 24 * 60;
  startSelect.innerHTML = '';
  endSelect.innerHTML = '';

  for (let minutes = 0; minutes < totalMinutes; minutes += TIME_STEP_MINUTES) {
    startSelect.appendChild(createOption(minutes, formatTime(minutes)));
    const endValue = minutes + TIME_STEP_MINUTES;
    const endLabel = formatTime(Math.min(endValue, totalMinutes));
    endSelect.appendChild(createOption(endValue, endLabel));
  }

  startSelect.value = String(9 * 60);
  endSelect.value = String(10 * 60);
}

function createOption(value, label) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  return option;
}

function formatDateInput(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function syncQuickFormDate(date = state.selectedDate) {
  if (!DOM.calendarDate) return;
  const target = date ?? new Date();
  DOM.calendarDate.value = formatDateInput(target);
}

function parseDateInput(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if ([year, month, day].some(Number.isNaN)) return null;
  return new Date(year, month - 1, day);
}

function parseDateKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatTaskDate(key) {
  return key.replace(/-/g, '/');
}

function startEventListener(user) {
  if (unsubscribeEvents) {
    unsubscribeEvents();
    unsubscribeEvents = null;
  }

  if (!user) {
    state.events = {};
    render();
    renderTaskList();
    return;
  }

  const eventsQuery = query(
    collection(db, 'events'),
    where('userId', '==', user.uid),
  );

  unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
    state.events = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const dateKey = data.dateKey;
      if (!state.events[dateKey]) state.events[dateKey] = [];
      state.events[dateKey].push({
        id: docSnap.id,
        startMinutes: data.startMinutes,
        endMinutes: data.endMinutes,
        label: data.label,
        completed: Boolean(data.completed),
      });
    });

    Object.keys(state.events).forEach((key) => {
      state.events[key].sort((a, b) => a.startMinutes - b.startMinutes);
    });

    render();
    renderTaskList();
  });
}

function getDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTime(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function normalizeEvent(event) {
  if (!event) return null;
  return {
    id: event.id ?? `evt-${eventCounter += 1}`,
    startMinutes: event.startMinutes,
    endMinutes: event.endMinutes,
    label: event.label,
    completed: Boolean(event.completed),
  };
}

function addEventToState(date, event) {
  const key = getDateKey(date);
  if (!state.events[key]) state.events[key] = [];
  const normalized = normalizeEvent(event);
  if (!normalized) return;
  state.events[key].push(normalized);
  state.events[key].sort((a, b) => a.startMinutes - b.startMinutes);
  renderTaskList();
}

async function addEventAndReveal(date, event) {
  if (!state.currentUser) {
    alert('請先登入');
    return;
  }
  const dateKey = getDateKey(date);
  await addDoc(collection(db, 'events'), {
    userId: state.currentUser.uid,
    dateKey,
    startMinutes: event.startMinutes,
    endMinutes: event.endMinutes,
    label: event.label,
    completed: Boolean(event.completed),
    createdAt: serverTimestamp(),
  });
  if (!state.selectedDate || !isSameDay(date, state.selectedDate)) {
    focusDate(date);
    return;
  }
  showDayView();
  renderDayView();
}

function renderDayView() {
  if (!state.selectedDate || !state.dayViewVisible) return;
  if (DOM.dayView?.hasAttribute('hidden')) return;
  if (!DOM.selectedDate || !DOM.selectedWeekday || !DOM.dayHours) return;

  DOM.selectedDate.textContent = fullDateFormatter.format(state.selectedDate);
  DOM.selectedWeekday.textContent = weekdayFormatter.format(state.selectedDate);

  DOM.dayHours.innerHTML = '';
  const key = getDateKey(state.selectedDate);
  const events = state.events[key] ?? [];

  HOUR_MINUTES.forEach((slotMinutes, slotIndex) => {
    const hourEl = document.createElement('div');
    hourEl.className = 'day-view__hour';

    const labelEl = document.createElement('span');
    labelEl.className = 'day-view__hour-label';
    labelEl.textContent = formatTime(slotMinutes);

    const blockContainer = document.createElement('div');
    blockContainer.className = 'day-view__hour-blocks';

    events.forEach((event) => {
      if (typeof event.completed !== 'boolean') event.completed = false;
      const eventSlotIndex = Math.floor(event.startMinutes / 60);
      if (eventSlotIndex === slotIndex) {
        const block = document.createElement('div');
        block.className = 'day-view__event';
        if (event.completed) block.classList.add('day-view__event--completed');
        const durationHours = (event.endMinutes - event.startMinutes) / 60;
        block.style.setProperty('--duration', Math.max(durationHours, TIME_STEP_MINUTES / 60));
        const offsetRatio = (event.startMinutes % 60) / 60;
        block.style.setProperty('--offset', offsetRatio);
        const zIndex = 1000 - (event.endMinutes - event.startMinutes);
        block.style.setProperty('--z-index', zIndex);
        block.style.zIndex = zIndex;

        const check = document.createElement('button');
        check.className = 'event-check';
        if (event.completed) {
          check.classList.add('event-check--checked');
          check.textContent = '✓';
        }
        check.type = 'button';
        check.addEventListener('click', (evt) => {
          evt.stopPropagation();
          toggleEventCompletion(key, event.id);
        });

        const time = document.createElement('span');
        time.className = 'day-view__event-time';
        time.textContent = `${formatTime(event.startMinutes)}~${formatTime(event.endMinutes)}`;

        const labelText = document.createElement('span');
        labelText.textContent = event.label;

        const textWrapper = document.createElement('div');
        textWrapper.className = 'day-view__event-text';
        textWrapper.append(time, labelText);

        block.append(check, textWrapper);
        blockContainer.appendChild(block);
      }
    });

    hourEl.append(labelEl, blockContainer);
    DOM.dayHours.appendChild(hourEl);
  });
}

function toggleEventCompletion(dateKey, eventId) {
  const events = state.events[dateKey];
  if (!events) return;
  const target = events.find((event) => event.id === eventId);
  if (!target) return;
  if (!state.currentUser) return;
  if (target.completed) {
    updateDoc(doc(db, 'events', eventId), { completed: false });
    return;
  }
  deleteDoc(doc(db, 'events', eventId));
}

function renderTaskList() {
  if (!DOM.taskList) return;
  const entries = [];
  Object.keys(state.events).forEach((key) => {
    state.events[key].forEach((event) => {
      if (typeof event.completed !== 'boolean') event.completed = false;
      if (event.completed) return;
      entries.push({
        dateKey: key,
        startMinutes: event.startMinutes,
        label: event.label,
        id: event.id,
        completed: false,
      });
    });
  });

  entries.sort((a, b) => {
    const dateA = parseDateKey(a.dateKey);
    const dateB = parseDateKey(b.dateKey);
    if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
    return a.startMinutes - b.startMinutes;
  });

  DOM.taskList.innerHTML = '';

  if (!entries.length) {
    const empty = document.createElement('p');
    empty.className = 'task-panel__empty';
    empty.textContent = '尚未新增行程';
    DOM.taskList.appendChild(empty);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'task-panel__item';
    const check = document.createElement('button');
    check.className = 'task-panel__check';
    check.type = 'button';
    check.addEventListener('click', (evt) => {
      evt.stopPropagation();
      toggleEventCompletion(entry.dateKey, entry.id);
    });

    const date = document.createElement('span');
    date.className = 'task-panel__item-date';
    date.textContent = formatTaskDate(entry.dateKey);

    const label = document.createElement('span');
    label.className = 'task-panel__item-label';
    label.textContent = entry.label;

    const textWrapper = document.createElement('div');
    textWrapper.className = 'task-panel__item-text';
    textWrapper.append(date, label);

    item.append(check, textWrapper);
    DOM.taskList.appendChild(item);
  });
}

async function handleQuickFormSubmit(event) {
  event.preventDefault();
  if (!DOM.calendarDate || !DOM.calendarStart || !DOM.calendarEnd || !DOM.calendarLabel) return;
  const dateValue = DOM.calendarDate.value;
  const startMinutes = Number(DOM.calendarStart.value);
  const endMinutes = Number(DOM.calendarEnd.value);
  const label = DOM.calendarLabel.value.trim();

  if (!dateValue) {
    alert('請選擇日期');
    return;
  }
  const date = parseDateInput(dateValue);
  if (!date) {
    alert('日期格式錯誤');
    return;
  }
  if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) return;
  if (startMinutes >= endMinutes) {
    alert('結束時間必須晚於開始時間');
    return;
  }
  if (!label) {
    alert('請輸入行程名稱');
    return;
  }

  await addEventAndReveal(date, {
    startMinutes,
    endMinutes,
    label,
  });
  DOM.calendarLabel.value = '';
}

function render() {
  const { viewDate } = state;
  DOM.month.textContent = monthFormatter.format(viewDate);
  DOM.year.textContent = viewDate.getFullYear();

  const todayISO = new Date().toDateString();
  const days = buildCalendarDates(viewDate);

  DOM.days.innerHTML = '';

  days.forEach(({ date, outside }) => {
    const dayElement = document.createElement('button');
    dayElement.classList.add('calendar__day');
    if (outside) dayElement.classList.add('calendar__day--outside');
    if (date.toDateString() === todayISO && !outside) {
      dayElement.classList.add('calendar__day--today');
      dayElement.setAttribute('aria-current', 'date');
    }
    dayElement.textContent = dayFormatter.format(date);
    dayElement.type = 'button';
    dayElement.title = date.toDateString();
    dayElement.dataset.date = date.toISOString();
    if (outside) dayElement.dataset.outside = 'true';

    if (state.selectedDate && isSameDay(date, state.selectedDate)) {
      dayElement.classList.add('calendar__day--selected');
    }

    dayElement.addEventListener('click', () => handleDaySelection(date, outside));
    DOM.days.appendChild(dayElement);
  });

  renderDayView();
}

populateTimeSelects(DOM.calendarStart, DOM.calendarEnd);
syncQuickFormDate();

DOM.buttons.forEach((button) => {
  button.addEventListener('click', (event) => {
    const { action } = event.currentTarget.dataset;
    if (action === 'prev') changeMonth(-1);
    if (action === 'next') changeMonth(1);
    if (action === 'today') goToToday();
  });
});

if (DOM.calendarForm) {
  DOM.calendarForm.addEventListener('submit', handleQuickFormSubmit);
}

if (DOM.taskToggle) {
  DOM.taskToggle.addEventListener('click', toggleTaskPanel);
}

if (DOM.taskClose) {
  DOM.taskClose.addEventListener('click', hideTaskPanel);
}

if (DOM.authLogin) {
  DOM.authLogin.addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      alert('登入失敗，請稍後再試');
    }
  });
}

if (DOM.authLogout) {
  DOM.authLogout.addEventListener('click', async () => {
    await signOut(auth);
  });
}

if (DOM.installBtn) {
  DOM.installBtn.addEventListener('click', async () => {
    if (isStandalone()) {
      isAppInstalled = true;
    } else if (navigator.getInstalledRelatedApps) {
      const related = await navigator.getInstalledRelatedApps();
      isAppInstalled = related.length > 0;
    }

    if (isAppInstalled) {
      alert('You already installed this app.');
      return;
    }
    if (!deferredInstallPrompt) {
      alert('目前瀏覽器未提供安裝提示，請稍後再試或使用瀏覽器的「安裝應用程式」選單。');
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    DOM.installBtn.disabled = true;
  });
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (DOM.installBtn) {
    DOM.installBtn.disabled = false;
  }
});

window.addEventListener('appinstalled', () => {
  isAppInstalled = true;
  deferredInstallPrompt = null;
  if (DOM.installBtn) {
    DOM.installBtn.disabled = true;
  }
});

onAuthStateChanged(auth, (user) => {
  state.currentUser = user;
  setAuthUI(user);
  startEventListener(user);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  });
}

setView(new Date());
renderTaskList();
