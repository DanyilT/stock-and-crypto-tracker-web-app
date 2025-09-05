/**
 * Market Trading Hours
 * Provides comprehensive market hours information for US and EU markets
 * including regular hours, pre-market, after-hours, holidays, and early closes.
 * Also includes utility functions to check if the market is open for a given stock
 * based on its market (US/EU) and the current date/time.
 */

// Regular market hours
window.US_MARKET_HOURS = {
    REGULAR_OPEN: { hour: 9, minute: 30 },      // 9:30 AM ET
    REGULAR_CLOSE: { hour: 16, minute: 0 },     // 4:00 PM ET
    EARLY_CLOSE: { hour: 13, minute: 0 },       // 1:00 PM ET
    PRE_MARKET_OPEN: { hour: 4, minute: 0 },    // 4:00 AM ET
    AFTER_HOURS_CLOSE: { hour: 20, minute: 0 }  // 8:00 PM ET
};
window.EU_MARKET_HOURS = {
    REGULAR_OPEN: { hour: 8, minute: 0 },       // 8:00 AM GMT
    REGULAR_CLOSE: { hour: 16, minute: 30 },    // 4:30 PM GMT
    EARLY_CLOSE:  { hour: 13, minute: 0 }       // 1:00 PM GMT
};


// Helper for market open/close per stock
window.isMarketOpenForStock = function (market) {
    market = market.toUpperCase();
    if (market !== 'US' && market !== 'EU') return { isOpen: 'idk', timeToEvent: 0 };

    // NY time for US market, GMT for EU market
    const date = market === 'US' ? new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"})) : market === 'EU' ? new Date(new Date().toLocaleString("en-US", {timeZone: "GMT"})) : null;

    let i = 0;
    while (i < 30) { // Look ahead up to 30 days
        const marketInfo = window.getMarketInfoForDate(market, new Date(date.getFullYear(), date.getMonth(), date.getDate() + i));
        if (marketInfo.isOpen) {
            if (i === 0) {
                // Today - check current time against market hours
                const isNowBeforeOpen = (date.getHours() < marketInfo.openTime.hour || (date.getHours() === marketInfo.openTime.hour && date.getMinutes() < marketInfo.openTime.minute));
                const isNowAfterClose = (date.getHours() > marketInfo.closeTime.hour || (date.getHours() === marketInfo.closeTime.hour && date.getMinutes() >= marketInfo.closeTime.minute));

                if (isNowBeforeOpen) {
                    // Market opens today but hasn't opened yet
                    return { isOpen: false, timeToEvent: new Date(date.getFullYear(), date.getMonth(), date.getDate() + i, marketInfo.openTime.hour, marketInfo.openTime.minute, 0, 0) - date };
                } else if (isNowAfterClose) {
                    // Market is closed for today, check next day
                    i++;
                    continue;
                } else {
                    // Market is currently open
                    return { isOpen: true, timeToEvent: new Date(date.getFullYear(), date.getMonth(), date.getDate() + i, marketInfo.closeTime.hour, marketInfo.closeTime.minute, 0, 0) - date };
                }
            } else {
                // Future day - market will open at opening time
                return { isOpen: false, timeToEvent: new Date(date.getFullYear(), date.getMonth(), date.getDate() + i, marketInfo.openTime.hour, marketInfo.openTime.minute, 0, 0) - date };
            }
        }

        i++;
    }
    return { isOpen: false, timeToEvent: null }; // No open day found in next 30 days
};

// Utility function to check if the market (US/EU) is market holiday on that date
window.isMarketHoliday = function(market, date) {
    switch (market.toUpperCase()) {
        case 'US':
            // US Holiday checker
            if (window.CurrentYearUSMarketTradingHours.has(formatDateKey(date))) return window.CurrentYearUSMarketTradingHours.get(formatDateKey(date)).status === 'HOLIDAY';
            return getUSMarketHolidays(date.getFullYear()).some(holiday => holiday.date.getFullYear() === date.getFullYear() && holiday.date.getMonth() === date.getMonth() && holiday.date.getDate() === date.getDate());
        case 'EU':
            // EU Bank Holiday checker
            if (window.CurrentYearEUMarketTradingHours.has(formatDateKey(date))) return window.CurrentYearEUMarketTradingHours.get(formatDateKey(date)).status === 'HOLIDAY';
            return getEUMarketHolidays(date.getFullYear()).some(holiday => holiday.date.getFullYear() === date.getFullYear() && holiday.date.getMonth() === date.getMonth() && holiday.date.getDate() === date.getDate());
        default:
            return false;
    }
}

// Utility function to check if market (US/EU) is open on a specific date
window.isMarketOpenOnDate = function(market, date) {
    let tradingHours;
    switch (market.toUpperCase()) {
        case 'US':
            if (window.CurrentYearUSMarketTradingHours.has(formatDateKey(date))) tradingHours = window.CurrentYearUSMarketTradingHours;
            else tradingHours = window.getUSMarketTradingHours({ day: date });
            break;
        case 'EU':
            if (window.CurrentYearEUMarketTradingHours.has(formatDateKey(date))) tradingHours = window.CurrentYearEUMarketTradingHours;
            else tradingHours = window.getEUMarketTradingHours({ day: date });
            break;
        default:
            return false;
    }
    const dayInfo = tradingHours.get(formatDateKey(date));
    return dayInfo ? dayInfo.isOpen : false;
};

// Utility function to get market (US/EU) info for a specific date
window.getMarketInfoForDate = function(market, date) {
    let tradingHours;
    switch (market.toUpperCase()) {
        case 'US':
            if (window.CurrentYearUSMarketTradingHours.has(formatDateKey(date))) tradingHours = window.CurrentYearUSMarketTradingHours;
            else tradingHours = window.getUSMarketTradingHours({ day: date });
            break;
        case 'EU':
            if (window.CurrentYearEUMarketTradingHours.has(formatDateKey(date))) tradingHours = window.CurrentYearEUMarketTradingHours;
            else tradingHours = window.getEUMarketTradingHours({ day: date });
            break;
        default:
            return false;
    }
    return tradingHours.get(formatDateKey(date)) || null;
};

// Helper function to get US market trading hours for a given period
window.getUSMarketTradingHours = function(options = {}) {
    // Get all US market holidays for the year
    const year = options.year ? options.year : new Date().getFullYear();
    const holidays = getUSMarketHolidays(year);
    const earlyCloses = getUSMarketEarlyCloses(year);

    // Determine date range
    const [startDate, endDate] = determineDateRange(options);

    // Generate trading hours for each day in range
    return generateTradingHoursMap(startDate, endDate, holidays, earlyCloses, { REGULAR_OPEN: US_MARKET_HOURS.REGULAR_OPEN, REGULAR_CLOSE: US_MARKET_HOURS.REGULAR_CLOSE, EARLY_CLOSE: US_MARKET_HOURS.EARLY_CLOSE, PRE_MARKET_OPEN: US_MARKET_HOURS.PRE_MARKET_OPEN, AFTER_HOURS_CLOSE: US_MARKET_HOURS.AFTER_HOURS_CLOSE });
};

// Helper function to get EU market trading hours for a given period
window.getEUMarketTradingHours = function(options = {}) {
    // Get all EU market holidays for the year
    const year = options.year ? options.year : new Date().getFullYear();
    const holidays = getEUMarketHolidays(year);
    const earlyCloses = getEUMarketEarlyCloses(year);

    // Determine date range
    const [startDate, endDate] = determineDateRange(options);

    // Generate trading hours for each day in range
    return generateTradingHoursMap(startDate, endDate, holidays, earlyCloses, { REGULAR_OPEN: EU_MARKET_HOURS.REGULAR_OPEN, REGULAR_CLOSE: EU_MARKET_HOURS.REGULAR_CLOSE, EARLY_CLOSE: EU_MARKET_HOURS.EARLY_CLOSE, PRE_MARKET_OPEN: null, AFTER_HOURS_CLOSE: null });
};

// Preload current year
window.CurrentYearUSMarketTradingHours = window.getUSMarketTradingHours({ year: new Date().getFullYear() });
window.CurrentYearEUMarketTradingHours = window.getEUMarketTradingHours({ year: new Date().getFullYear() });


// Helper function to get all US market holidays for a given year
function getUSMarketHolidays(year) {
    const holidays = [];

    // New Year's Day (January 1st, with weekend adjustment)
    let newYears = new Date(year, 0, 1);
    if (newYears.getDay() === 0) newYears = new Date(year, 0, 2);  // Sunday -> Monday
    else if (newYears.getDay() === 6) newYears = new Date(year - 1, 11, 31);  // Saturday -> Friday (previous year)
    holidays.push({ date: newYears, name: "New Year's Day" });

    // National Mourning Day - Only for specific years (2025: January 9)
    // This is typically declared ad-hoc for former presidents' deaths
    if (year === 2025) holidays.push({ date: new Date(2025, 0, 9), name: "National Mourning Day" });

    // Martin Luther King Jr. Day (3rd Monday in January)
    holidays.push({ date: new Date(year, 0, getNthWeekday(year, 1, 1, 3)), name: "Martin Luther King Jr. Day" });

    // Washington's Birthday (3rd Monday in February)
    holidays.push({ date: new Date(year, 1, getNthWeekday(year, 2, 1, 3)), name: "Washington's Day" });

    // Good Friday (Friday before Easter)
    const easter = calculateEaster(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    holidays.push({ date: goodFriday, name: "Good Friday" });

    // Memorial Day (Last Monday in May)
    holidays.push({ date: new Date(year, 4, getLastWeekday(year, 5, 1)), name: "Memorial Day" });

    // Juneteenth (June 19th, with weekend adjustment)
    let juneteenth = new Date(year, 5, 19);
    if (juneteenth.getDay() === 0) juneteenth = new Date(year, 5, 20);  // Sunday -> Monday
    else if (juneteenth.getDay() === 6) juneteenth = new Date(year, 5, 18);  // Saturday -> Friday
    holidays.push({ date: juneteenth, name: "Juneteenth" });

    // Independence Day (July 4th, with weekend adjustment)
    let independence = new Date(year, 6, 4);
    if (independence.getDay() === 0) independence = new Date(year, 6, 5);  // Sunday -> Monday
    else if (independence.getDay() === 6) independence = new Date(year, 6, 3);  // Saturday -> Friday
    holidays.push({ date: independence, name: "Independence Day" });

    // Labor Day (1st Monday in September)
    holidays.push({ date: new Date(year, 8, getNthWeekday(year, 9, 1, 1)), name: "Labor Day" });

    // Thanksgiving Day (4th Thursday in November)
    holidays.push({ date: new Date(year, 10, getNthWeekday(year, 11, 4, 4)), name: "Thanksgiving Day" });

    // Christmas (December 25th, with weekend adjustment)
    let christmas = new Date(year, 11, 25);
    if (christmas.getDay() === 0) christmas = new Date(year, 11, 26);  // Sunday -> Monday
    else if (christmas.getDay() === 6) christmas = new Date(year, 11, 24);  // Saturday -> Friday
    holidays.push({ date: christmas, name: "Christmas" });

    return holidays;
}

// Helper function to get early close days
function getUSMarketEarlyCloses(year) {
    const earlyCloses = [];

    // Day before Independence Day (if July 4th falls on Friday)
    const july4th = new Date(year, 6, 4);
    if (july4th.getDay() === 5) earlyCloses.push({ date: new Date(year, 6, 3), reason: "Day before Independence Day" });  // Friday

    // Day after Thanksgiving (Black Friday) - always the Friday after Thanksgiving
    const thanksgiving = new Date(year, 10, getNthWeekday(year, 11, 4, 4));
    const blackFriday = new Date(thanksgiving);
    blackFriday.setDate(thanksgiving.getDate() + 1);
    earlyCloses.push({ date: blackFriday, reason: "Day after Thanksgiving (Black Friday)" });

    // Christmas Eve (December 24th, if it's a weekday)
    const christmasEve = new Date(year, 11, 24);
    if (christmasEve.getDay() >= 1 && christmasEve.getDay() <= 5) earlyCloses.push({ date: christmasEve, reason: "Christmas Eve" });  // Monday-Friday

    // New Year's Eve (December 31st, if it's a weekday)
    const newYearsEve = new Date(year, 11, 31);
    if (newYearsEve.getDay() >= 1 && newYearsEve.getDay() <= 5) earlyCloses.push({ date: newYearsEve, reason: "New Year's Eve" });  // Monday-Friday

    return earlyCloses;
}

// Helper function to get all EU market holidays for a given year
function getEUMarketHolidays(year) {
    const holidays = [];

    // New Year's Day (January 1st, with weekend adjustment)
    let newYears = new Date(year, 0, 1);
    if (newYears.getDay() === 0) newYears = new Date(year, 0, 2);  // Sunday -> Monday
    else if (newYears.getDay() === 6) newYears = new Date(year - 1, 11, 31);  // Saturday -> Friday (previous year)
    holidays.push({ date: newYears, name: "New Year's Day" });

    // Easter-based holidays
    const easter = calculateEaster(year);

    // Good Friday (Friday before Easter)
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    holidays.push({ date: goodFriday, name: "Good Friday" });

    // Easter Monday (Monday after Easter)
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    holidays.push({ date: easterMonday, name: "Easter Monday" });

    // May Day / Labour Day (May 1st)
    let labourDay = new Date(year, 4, 1);
    if (labourDay.getDay() === 0) labourDay = new Date(year, 4, 2);  // Sunday -> Monday
    else if (labourDay.getDay() === 6) labourDay = new Date(year, 3, 30);  // Saturday -> Friday
    holidays.push({ date: labourDay, name: "Labour Day" });

    // Christmas Eve (December 24th, with weekend adjustment) - Early close or closed
    let christmasEve = new Date(year, 11, 24);
    if (christmasEve.getDay() === 0) christmasEve = new Date(year, 11, 25);  // Sunday -> Monday
    else if (christmasEve.getDay() === 6) christmasEve = new Date(year, 11, 23);  // Saturday -> Friday
    holidays.push({ date: christmasEve, name: "Christmas Eve" });

    // Christmas Day (December 25th, with weekend adjustment)
    let christmas = new Date(year, 11, 25);
    if (christmas.getDay() === 0) christmas = new Date(year, 11, 26);  // Sunday -> Monday
    else if (christmas.getDay() === 6) christmas = new Date(year, 11, 24);  // Saturday -> Friday
    holidays.push({ date: christmas, name: "Christmas Day" });

    // Boxing Day (December 26th, with weekend adjustment)
    let boxingDay = new Date(year, 11, 26);
    if (boxingDay.getDay() === 0) boxingDay = new Date(year, 11, 27);  // Sunday -> Monday
    else if (boxingDay.getDay() === 6) boxingDay = new Date(year, 11, 25);  // Saturday -> Friday
    holidays.push({ date: boxingDay, name: "Boxing Day" });

    // New Year's Eve (December 31st) - Early close or closed
    const newYearsEve = new Date(year, 11, 31);
    if (newYearsEve.getDay() >= 1 && newYearsEve.getDay() <= 5) holidays.push({ date: newYearsEve, name: "New Year's Eve" });  // Weekday

    return holidays;
}

// Helper function to get EU early close days
function getEUMarketEarlyCloses(year) {
    const earlyCloses = [];

    // Christmas Eve (December 24th, if it's a weekday and not a full holiday)
    const christmasEve = new Date(year, 11, 24);
    if (christmasEve.getDay() >= 1 && christmasEve.getDay() <= 5) { // Monday-Friday
        // Check if it's not already a full holiday
        const holidays = getEUMarketHolidays(year);
        const isFullHoliday = holidays.some(h => h.date.getMonth() === 11 && h.date.getDate() === 24);
        if (!isFullHoliday) earlyCloses.push({ date: christmasEve, reason: "Christmas Eve" });
    }

    // New Year's Eve (December 31st, if it's a weekday and not a full holiday)
    const newYearsEve = new Date(year, 11, 31);
    if (newYearsEve.getDay() >= 1 && newYearsEve.getDay() <= 5) { // Monday-Friday
        // Check if it's not already a full holiday
        const holidays = getEUMarketHolidays(year);
        const isFullHoliday = holidays.some(h => h.date.getMonth() === 11 && h.date.getDate() === 31);
        if (!isFullHoliday) earlyCloses.push({ date: newYearsEve, reason: "New Year's Eve" });
    }

    // Day before major holidays (if they fall on Tuesday-Friday)
    const majorHolidays = [
        { month: 4, day: 1, name: "Labour Day" },
        { month: 11, day: 25, name: "Christmas Day" }
    ];

    majorHolidays.forEach(holiday => {
        const holidayDate = new Date(year, holiday.month - 1, holiday.day);
        if (holidayDate.getDay() >= 2 && holidayDate.getDay() <= 5) { // Tuesday-Friday
            const dayBefore = new Date(holidayDate);
            dayBefore.setDate(holidayDate.getDate() - 1);
            earlyCloses.push({ date: dayBefore, reason: `Day before ${holiday.name}` });
        }
    });

    return earlyCloses;
}


// Helper functions
function determineDateRange(options) {
    const {
        year = new Date().getFullYear(),
        month = null, // 1-12, null for entire year
        week = null,  // week number, null for entire month/year
        day = null    // specific date object, null for entire week/month/year
    } = options;

    // Determine date range
    let startDate, endDate;
    if (day) {
        // Single day
        startDate = new Date(day);
        endDate = new Date(day);
    } else if (week && month) {
        // Specific week in month
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const startOfWeek = new Date(firstDayOfMonth);
        startOfWeek.setDate(1 + (week - 1) * 7);
        startDate = new Date(startOfWeek);
        endDate = new Date(startOfWeek);
        endDate.setDate(startDate.getDate() + 6);
    } else if (month) {
        // Entire month
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0); // Last day of month
    } else {
        // Entire year
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
    }

    return [startDate, endDate];
}

function generateTradingHoursMap(startDate, endDate, holidays, earlyCloses, marketHours = {REGULAR_OPEN: null, REGULAR_CLOSE: null, EARLY_CLOSE: null, PRE_MARKET_OPEN: null, AFTER_HOURS_CLOSE: null}) {
    const tradingHours = new Map();
    const currentDate = new Date(startDate);

    // Generate trading hours for each day in range
    while (currentDate <= endDate) {
        const dateKey = formatDateKey(currentDate);
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6

        // Check if it's a holiday
        const holiday = holidays.find(h =>
            h.date.getFullYear() === currentDate.getFullYear() &&
            h.date.getMonth() === currentDate.getMonth() &&
            h.date.getDate() === currentDate.getDate()
        );

        // Check if it's an early close day
        const earlyClose = earlyCloses.find(e =>
            e.date.getFullYear() === currentDate.getFullYear() &&
            e.date.getMonth() === currentDate.getMonth() &&
            e.date.getDate() === currentDate.getDate()
        );

        let marketInfo = {
            date: new Date(currentDate),
            isOpen: !(holiday || isWeekend),
            openTime: !(holiday || isWeekend) ? { ...marketHours.REGULAR_OPEN } : null,
            closeTime: !(holiday || isWeekend) ? (earlyClose ? { ...marketHours.EARLY_CLOSE } : { ...marketHours.REGULAR_CLOSE }) : null,
            status: holiday ? 'HOLIDAY' : isWeekend ? 'WEEKEND' : earlyClose ? 'EARLY_CLOSE' : 'REGULAR',
            holidayName: holiday ? holiday.name : null,
            reason: holiday ? `Market closed for ${holiday.name}` : isWeekend ? 'Market closed on weekends' : earlyClose ? `Early close: ${earlyClose.reason}` : 'Regular trading hours',
            isWeekend: isWeekend,
            dayOfWeek: getDayName(dayOfWeek)
        }

        // Add additional market session information
        if (marketInfo.isOpen) {
            if (marketHours.PRE_MARKET_OPEN) {
                marketInfo.preMarket = {
                    openTime: { ...marketHours.PRE_MARKET_OPEN },
                    closeTime: { ...marketInfo.openTime }
                };
            }
            if (marketHours.AFTER_HOURS_CLOSE) {
                marketInfo.afterHours = {
                    openTime: { ...marketInfo.closeTime },
                    closeTime: { ...marketHours.AFTER_HOURS_CLOSE }
                };
            }
            marketInfo.totalTradingMinutes = calculateTradingMinutes(marketInfo.openTime, marketInfo.closeTime);
        }

        tradingHours.set(dateKey, marketInfo);

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return tradingHours;
}

function getNthWeekday(year, month, weekday, n) {
    const firstDay = new Date(year, month - 1, 1);
    const firstWeekday = firstDay.getDay();
    const offset = (weekday - firstWeekday + 7) % 7;
    return 1 + offset + (n - 1) * 7;
}

function getLastWeekday(year, month, weekday) {
    const lastDay = new Date(year, month, 0).getDate();
    const lastDate = new Date(year, month - 1, lastDay);
    const lastWeekday = lastDate.getDay();
    const daysBack = (lastWeekday - weekday + 7) % 7;
    return lastDay - daysBack;
}

function calculateEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
}

// Helper-helper functions for the trading hours system
function formatDateKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

// Helper-helper function to get day name from day index
function getDayName(dayOfWeek) {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
}

// Helper-helper function to calculate total trading minutes between open and close times
function calculateTradingMinutes(openTime, closeTime) {
    return (closeTime.hour - openTime.hour) * 60 + (closeTime.minute - openTime.minute);
}
