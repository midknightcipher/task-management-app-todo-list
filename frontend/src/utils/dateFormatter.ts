export const formatToIST = (dateString: string | Date): string => {
  const date = new Date(dateString);
  
  // Convert to IST (UTC+5:30)
  const istDate = new Date(date.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata'
  }));
  
  // Format: "08 Apr 2026, 02:30 PM IST"
  return istDate.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  }) + ' IST';
};