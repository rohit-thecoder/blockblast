import { REMINDERS } from '../src/constants/reminders';
describe('reminder schedule', () => {
  it('has exactly two daily reminders at 10:00 and 20:00 with unique ids', () => {
    expect(REMINDERS.map((r) => [r.hour, r.minute])).toEqual([[10, 0], [20, 0]]);
    expect(new Set(REMINDERS.map((r) => r.id)).size).toBe(2);
    expect(REMINDERS[0].body).toBe('Ready to beat your high score? 🧠 Come clear some blocks!');
    expect(REMINDERS[1].body).toBe('Time to relax! ✨ Your 8x8 board is waiting for a new combo.');
  });
});
