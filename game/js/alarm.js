// alarm.js — the alarm meter: the room's temper, 0 to 100.
// Being watched raises it; hiding lets it fall. At 100 the room locks down:
// every guard runs for the thief for eight seconds, then the meter drops
// back to 60 and the room breathes again.

export function makeAlarm() {
  return {
    value: 0,
    lockdown: 0, // seconds of lockdown left
    lockdowns: 0,
  };
}

export function updateAlarm(alarm, seenByGuard, seenByCamera, sneaking, dt) {
  if (alarm.lockdown > 0) {
    alarm.lockdown -= dt;
    alarm.value = 100;
    if (alarm.lockdown <= 0) alarm.value = 60;
    return;
  }
  let rise = 0;
  if (seenByGuard) rise += 26;
  if (seenByCamera) rise += 34;
  if (rise > 0 && sneaking) rise *= 0.5;
  if (rise > 0) {
    alarm.value += rise * dt;
  } else {
    alarm.value -= 9 * dt;
  }
  if (alarm.value >= 100) {
    alarm.value = 100;
    alarm.lockdown = 8;
    alarm.lockdowns += 1;
  }
  if (alarm.value < 0) alarm.value = 0;
}

export function alarmLevel(alarm) {
  if (alarm.lockdown > 0) return 'LOCKDOWN';
  if (alarm.value >= 70) return 'HOT';
  if (alarm.value >= 35) return 'WARM';
  return 'QUIET';
}
