(() => {
  const STORAGE_KEY = 'spaceTimerKitanPlan';
  const SERIES = ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
  const BOOKS_PER_SERIES = 5;
  const PAGES_PER_BOOK = 60;
  const TOTAL_PAGES = SERIES.length * BOOKS_PER_SERIES * PAGES_PER_BOOK;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function createDefaultPlan() {
    return {
      nextStartIndex: 0
    };
  }

  function readPlan() {
    try {
      const rawValue = window.localStorage.getItem(STORAGE_KEY);
      if (!rawValue) return createDefaultPlan();
      const parsedValue = JSON.parse(rawValue);
      return {
        nextStartIndex: clamp(Number(parsedValue.nextStartIndex) || 0, 0, TOTAL_PAGES - 1)
      };
    } catch {
      return createDefaultPlan();
    }
  }

  function writePlan(plan) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    } catch {
      // Storage can be unavailable in private browsing or restricted environments.
    }
  }

  function toIndex(series, book, page) {
    const seriesIndex = SERIES.indexOf(series);
    const safeSeriesIndex = seriesIndex >= 0 ? seriesIndex : 0;
    const safeBook = clamp(Number(book) || 1, 1, BOOKS_PER_SERIES);
    const safePage = clamp(Number(page) || 1, 1, PAGES_PER_BOOK);
    return (safeSeriesIndex * BOOKS_PER_SERIES * PAGES_PER_BOOK)
      + ((safeBook - 1) * PAGES_PER_BOOK)
      + (safePage - 1);
  }

  function fromIndex(index) {
    const safeIndex = clamp(Number(index) || 0, 0, TOTAL_PAGES - 1);
    const pagesPerSeries = BOOKS_PER_SERIES * PAGES_PER_BOOK;
    const seriesIndex = Math.floor(safeIndex / pagesPerSeries);
    const seriesPageIndex = safeIndex % pagesPerSeries;
    const book = Math.floor(seriesPageIndex / PAGES_PER_BOOK) + 1;
    const page = (seriesPageIndex % PAGES_PER_BOOK) + 1;
    return {
      series: SERIES[seriesIndex],
      book,
      page,
      index: safeIndex
    };
  }

  function formatPosition(position) {
    return `${position.series}-${position.book} ${position.page}장`;
  }

  function formatRange(startIndex, pageCount) {
    const start = fromIndex(startIndex);
    const end = fromIndex(clamp(start.index + Math.max(1, pageCount) - 1, 0, TOTAL_PAGES - 1));
    if (start.index === end.index) {
      return formatPosition(start);
    }
    if (start.series === end.series && start.book === end.book) {
      return `${start.series}-${start.book} ${start.page}~${end.page}장`;
    }
    return `${formatPosition(start)}~${formatPosition(end)}`;
  }

  function addDays(date, days) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  function formatDate(date) {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]})`;
  }

  function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getMonthLabel(date) {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  }

  function getMonthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function getNextMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
  }

  function getNextStartIndex() {
    return readPlan().nextStartIndex;
  }

  function setNextStartIndex(index) {
    const plan = readPlan();
    plan.nextStartIndex = clamp(Number(index) || 0, 0, TOTAL_PAGES - 1);
    writePlan(plan);
    return plan.nextStartIndex;
  }

  function setNextStart(series, book, page) {
    return setNextStartIndex(toIndex(series, book, page));
  }

  function advanceNextStart(pageCount) {
    return setNextStartIndex(getNextStartIndex() + Math.max(0, Number(pageCount) || 0));
  }

  function getSchedule(pageCount, days = 21, startDate = new Date()) {
    const dailyPages = Math.max(1, Number(pageCount) || 1);
    const firstIndex = getNextStartIndex();
    return Array.from({ length: days }, (_, dayIndex) => {
      const startIndex = clamp(firstIndex + (dayIndex * dailyPages), 0, TOTAL_PAGES - 1);
      const start = fromIndex(startIndex);
      return {
        dateLabel: formatDate(addDays(startDate, dayIndex)),
        dayLabel: dayIndex === 0 ? '오늘' : dayIndex === 1 ? '내일' : `${dayIndex + 1}일차`,
        rangeLabel: formatRange(startIndex, dailyPages),
        series: start.series
      };
    });
  }

  function buildScheduleMap(pageCount, days, today) {
    const schedule = getSchedule(pageCount, days, today);
    return new Map(schedule.map((item, dayIndex) => {
      const date = addDays(today, dayIndex);
      return [toDateKey(date), {
        ...item,
        dateKey: toDateKey(date),
        dayNumber: date.getDate()
      }];
    }));
  }

  function buildMonthCalendar(monthDate, today, scheduleByDate) {
    const firstOfMonth = getMonthStart(monthDate);
    const nextMonth = getNextMonth(firstOfMonth);
    const lastOfMonth = addDays(nextMonth, -1);
    const firstGridDate = addDays(firstOfMonth, -firstOfMonth.getDay());
    const totalGridDays = Math.ceil((firstOfMonth.getDay() + lastOfMonth.getDate()) / 7) * 7;
    const daysInGrid = Array.from({ length: totalGridDays }, (_, dayIndex) => {
      const date = addDays(firstGridDate, dayIndex);
      const dateKey = toDateKey(date);
      const dayOfWeek = date.getDay();
      return {
        dateKey,
        dayNumber: date.getDate(),
        dayOfWeek,
        isSaturday: dayOfWeek === 6,
        isSunday: dayOfWeek === 0,
        isToday: dateKey === toDateKey(today),
        isCurrentMonth: date.getMonth() === firstOfMonth.getMonth(),
        plan: scheduleByDate.get(dateKey) || null
      };
    });

    return {
      monthLabel: getMonthLabel(firstOfMonth),
      weekdays: ['일', '월', '화', '수', '목', '금', '토'],
      weeks: Array.from({ length: totalGridDays / 7 }, (_, weekIndex) =>
        daysInGrid.slice(weekIndex * 7, (weekIndex + 1) * 7)
      )
    };
  }

  function getCalendar(pageCount, days = 35, startDate = new Date()) {
    const today = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const scheduleByDate = buildScheduleMap(pageCount, days, today);
    return buildMonthCalendar(today, today, scheduleByDate);
  }

  function getCalendars(pageCount, startDate = new Date()) {
    const today = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const dailyPages = Math.max(1, Number(pageCount) || 1);
    const daysUntilDone = Math.ceil((TOTAL_PAGES - getNextStartIndex()) / dailyPages);
    const scheduleByDate = buildScheduleMap(pageCount, daysUntilDone, today);
    const lastPlanDate = addDays(today, Math.max(0, daysUntilDone - 1));
    const calendars = [];
    let cursor = getMonthStart(today);

    while (cursor <= lastPlanDate) {
      calendars.push(buildMonthCalendar(cursor, today, scheduleByDate));
      cursor = getNextMonth(cursor);
    }

    return calendars;
  }

  window.SpaceTimerKitanPlan = {
    SERIES,
    BOOKS_PER_SERIES,
    PAGES_PER_BOOK,
    TOTAL_PAGES,
    fromIndex,
    formatRange,
    getNextStartIndex,
    setNextStart,
    setNextStartIndex,
    advanceNextStart,
    getSchedule,
    getCalendar,
    getCalendars
  };
})();
