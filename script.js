(() => {
  const elDays = document.getElementById('days');
  const elHours = document.getElementById('hours');
  const elMinutes = document.getElementById('minutes');
  const elSeconds = document.getElementById('seconds');
  const elBirthday = document.getElementById('birthday');
  const elLiveDate = document.getElementById('liveDate');

  // Target: June 22, 15:30 (3:30 PM) in Poland time.
  // Poland timezone: Europe/Warsaw
  const ZONE = 'Europe/Warsaw';
  const TARGET_MONTH_INDEX = 5; // June (0-based)
  const TARGET_DAY = 22;
  const TARGET_HOUR = 15;
  const TARGET_MINUTE = 30;
  const TARGET_SECOND = 0;

  const pad2 = (n) => String(n).padStart(2, '0');

  // Convert a date-time expressed in a specific IANA timezone into a UTC timestamp.
  // Approach: format the same instant in the target zone, then reconstruct UTC from those parts.
  function zonedTimeToUtcTimestamp({ year, monthIndex, day, hour, minute, second }, timeZone) {
    // Build a UTC timestamp from the provided *local* components as if they were UTC,
    // then adjust by the offset between UTC and the timezone at that instant.
    const utcGuess = Date.UTC(year, monthIndex, day, hour, minute, second);

    // Determine the timezone offset at that guessed instant.
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(new Date(utcGuess));

    const map = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));

    const asIfUtc = Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(map.hour),
      Number(map.minute),
      Number(map.second)
    );

    // If the timezone's wall time equals the provided wall time, then the correct utc is:
    // targetUtc = utcGuess - (asIfUtc - utcGuess) = 2*utcGuess - asIfUtc
    return utcGuess - (asIfUtc - utcGuess);
  }

  function getNowInZoneParts(timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      weekday: 'short',
    }).formatToParts(new Date());

    const map = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    return map;
  }

  function computeTargetTimestamp() {
    const nowParts = getNowInZoneParts(ZONE);
    const year = Number(nowParts.year);

    // Compute target for the current year.
    let targetUtc = zonedTimeToUtcTimestamp(
      {
        year,
        monthIndex: TARGET_MONTH_INDEX,
        day: TARGET_DAY,
        hour: TARGET_HOUR,
        minute: TARGET_MINUTE,
        second: TARGET_SECOND,
      },
      ZONE
    );

    const nowUtc = Date.now();

    // If we've already passed the target this year in Poland time,
    // use next year.
    if (nowUtc >= targetUtc) {
      targetUtc = zonedTimeToUtcTimestamp(
        {
          year: year + 1,
          monthIndex: TARGET_MONTH_INDEX,
          day: TARGET_DAY,
          hour: TARGET_HOUR,
          minute: TARGET_MINUTE,
          second: TARGET_SECOND,
        },
        ZONE
      );
    }

    return targetUtc;
  }

  let targetTimestamp = computeTargetTimestamp();

  function update() {
    // Update live date (Poland time)
    const p = getNowInZoneParts(ZONE);
    elLiveDate.textContent = `${p.weekday}, ${p.day}/${p.month}/${p.year} • ${p.hour}:${p.minute}:${p.second} (${ZONE})`;

    const now = Date.now();
    // Recompute target on/after switch window (e.g., user keeps page open across the year).
    // If now is more than a day past the current target in UTC, recompute.
    if (now > targetTimestamp + 24 * 60 * 60 * 1000) {
      targetTimestamp = computeTargetTimestamp();
    }

    const diff = targetTimestamp - now;

    if (diff <= 0) {
      // It is target moment or later: show birthday message.
      elBirthday.hidden = false;
      elDays.textContent = '00';
      elHours.textContent = '00';
      elMinutes.textContent = '00';
      elSeconds.textContent = '00';
      return;
    }

    elBirthday.hidden = true;

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    elDays.textContent = pad2(days);
    elHours.textContent = pad2(hours);
    elMinutes.textContent = pad2(minutes);
    elSeconds.textContent = pad2(seconds);
  }

  update();
  setInterval(update, 250);
})();

