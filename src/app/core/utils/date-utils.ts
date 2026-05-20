/**
 * Returns a Date object whose local calendar fields (year, month, day, hour, etc.)
 * match the corresponding time in the Egypt (Cairo) timezone.
 * 
 * This ensures that when we call methods like getFullYear() or getMonth() on the
 * returned Date, we get the values as they are in Egypt, regardless of the user's
 * browser/system timezone.
 */
export function getCairoDate(input?: string | number | Date): Date {
  const d = input ? new Date(input) : new Date();
  
  // Format the input date into Cairo timezone components
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(d);
  const getVal = (type: string) => parts.find(p => p.type === type)!.value;
  
  const year = parseInt(getVal('year'), 10);
  const month = parseInt(getVal('month'), 10) - 1; // Months are 0-based in JS Date
  const day = parseInt(getVal('day'), 10);
  const hour = parseInt(getVal('hour'), 10);
  const minute = parseInt(getVal('minute'), 10);
  const second = parseInt(getVal('second'), 10);
  
  return new Date(year, month, day, hour, minute, second);
}
