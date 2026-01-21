const monthFormatter = new Intl.DateTimeFormat('en', { month: 'long' });
const dayFormatter = new Intl.DateTimeFormat('en', { day: 'numeric' });

const DOM = {
  month: document.getElementById('calendar-month'),
  year: document.getElementById('calendar-year'),
  days: document.getElementById('calendar-days'),
  buttons: document.querySelectorAll('.calendar__btn'),
};

const state = {
  viewDate: new Date(),
};

function setView(date) {
  state.viewDate = new Date(date.getFullYear(), date.getMonth(), 1);
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
    DOM.days.appendChild(dayElement);
  });
}

DOM.buttons.forEach((button) => {
  button.addEventListener('click', (event) => {
    const { action } = event.currentTarget.dataset;
    if (action === 'prev') changeMonth(-1);
    if (action === 'next') changeMonth(1);
    if (action === 'today') goToToday();
  });
});

setView(new Date());
