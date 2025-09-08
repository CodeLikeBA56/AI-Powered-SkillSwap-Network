/**
 * Formats a date according to various modes.
 *
 * @param {string|Date} date - The input date.
 * @param {Object} options - Formatting options.
 *   @property {string} [mode] - One of: "time", "relative", "session", "custom", or defaults to "full".
 *   @property {string} [format] - If mode is "custom", use this format string.
 *
 * @returns {string} - The formatted date string.
 */
export const getFormattedDate = (date, options = {}) => {
    const d = new Date(date);
    const now = new Date();
    const mode = options.mode || "full";
  
    // Mode: "time" - return time in HH:MM AM/PM format
    if (mode === "time") {
      const hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      return `${formattedHours}:${minutes} ${ampm}`;
    }
  
    // Mode: "relative" - return relative time (or time if same day)
    if (mode === "relative") {
      const diffMs = now - d;
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffMonths / 12);
  
      // If same day, show time
      if (now.toDateString() === d.toDateString()) {
        const hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        return `${formattedHours}:${minutes} ${ampm}`;
      }
      if (diffYears > 0) return `${diffYears}y`;
      if (diffMonths > 0) return `${diffMonths}m`;
      if (diffDays > 0) return `${diffDays}d`;
      if (diffHours > 0) return `${diffHours}h`;
      if (diffMinutes > 0) return `${diffMinutes}m`;
      return "Just now";
    }
  
    // Mode: "session" - returns a session message (today, tomorrow, or specific date)
    if (mode === "session") {
      const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };
      const timeString = d.toLocaleTimeString('en-US', optionsTime);
  
      if (d.toDateString() === now.toDateString()) {
        return `The session is scheduled today at ${timeString}.`;
      }
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      if (d.toDateString() === tomorrow.toDateString()) {
        return `The session is scheduled tomorrow at ${timeString}.`;
      }
      const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `The session is scheduled on ${dateString} at ${timeString}.`;
    }
  
    // Mode: "custom" - use a provided format string (tokens: DD, MM, YYYY, HH, mm, SS)
    if (mode === "custom") {
      const format = options.format || "DD/MM/YYYY - HH:mm:SS";
      const DD = String(d.getDate()).padStart(2, '0');
      const MM = String(d.getMonth() + 1).padStart(2, '0');
      const YYYY = d.getFullYear();
      const HH = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const SS = String(d.getSeconds()).padStart(2, '0');
  
      return format
        .replace('DD', DD)
        .replace('MM', MM)
        .replace('YYYY', YYYY)
        .replace('HH', HH)
        .replace('mm', mm)
        .replace('SS', SS);
    }
  
    // Default ("full") mode: "DD/MM/YYYY - HH:mm:SS"
    const DD = String(d.getDate()).padStart(2, '0');
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const YYYY = d.getFullYear();
    const HH = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const SS = String(d.getSeconds()).padStart(2, '0');
    return `${DD}/${MM}/${YYYY} - ${HH}:${mm}:${SS}`;
  };
  
  // Example usage:
  console.log(getFormattedDate(new Date(), { mode: "full" }));       // "DD/MM/YYYY - HH:mm:SS"
  console.log(getFormattedDate(new Date(), { mode: "time" }));       // e.g., "2:05 PM"
  console.log(getFormattedDate(new Date(Date.now() - 3600 * 1000), { mode: "relative" })); // e.g., "1h"
  console.log(getFormattedDate(new Date(), { mode: "session" }));    // "The session is scheduled today at 2:05 PM."
  console.log(getFormattedDate(new Date(), { mode: "custom", format: "YYYY-MM-DD" })); // e.g., "2025-04-07"
  

export const sortByDate = (a, b) => {
  const parseDate = (str) => {
    const [day, month, year] = str.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  return parseDate(a) - parseDate(b);
}

export const formatDateForInput = (isoDateString) => {
  if (!isoDateString) return '';

  const date = new Date(isoDateString);
  const pad = (n) => String(n).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};