const monthFormatter = new Intl.DateTimeFormat('en', { month: 'long' });
const dayFormatter = new Intl.DateTimeFormat('en', { day: 'numeric' });
const fullDateFormatter = new Intl.DateTimeFormat('en', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
const weekdayFormatter = new Intl.DateTimeFormat('en', { weekday: 'long' });
const HOURS = Array.from({ length: 25 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`);

const DOM = {
  month: document.getElementById('calendar-month'),
  year: document.getElementById('calendar-year'),
  days: document.getElementById('calendar-days'),
  buttons: document.querySelectorAll('.calendar__btn'),
  selectedDate: document.getElementById('selected-date'),
  selectedWeekday: document.getElementById('selected-weekday'),
  dayHours: document.getElementById('day-hours'),
};

const state = {
  viewDate: new Date(),
  selectedDate: new Date(),
};

function setView(date) {
  state.viewDate = new Date(date.getFullYear(), date.getMonth(), 1);
  if (!state.selectedDate || !isSameMonth(state.selectedDate, state.viewDate)) {
    state.selectedDate = new Date(state.viewDate);
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
  setView(now);
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

function setSelectedDate(date, { reRender = true } = {}) {
  state.selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (reRender) render();
}

function handleDaySelection(date, outside) {
  if (outside) {
    state.viewDate = new Date(date.getFullYear(), date.getMonth(), 1);
    setSelectedDate(date, { reRender: false });
    render();
    return;
  }

  setSelectedDate(date);
}

function buildHourList() {
  DOM.dayHours.innerHTML = '';
  HOURS.forEach((label) => {
    const hourEl = document.createElement('div');
    hourEl.className = 'day-view__hour';
    hourEl.textContent = label;
    DOM.dayHours.appendChild(hourEl);
  });
}

function updateDayView() {
  if (!state.selectedDate) return;
  DOM.selectedDate.textContent = fullDateFormatter.format(state.selectedDate);
  DOM.selectedWeekday.textContent = weekdayFormatter.format(state.selectedDate);
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

  updateDayView();
}

DOM.buttons.forEach((button) => {
  button.addEventListener('click', (event) => {
    const { action } = event.currentTarget.dataset;
    if (action === 'prev') changeMonth(-1);
    if (action === 'next') changeMonth(1);
    if (action === 'today') goToToday();
  });
});

buildHourList();
setView(new Date());
