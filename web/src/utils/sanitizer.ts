// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, (char) => ({ '<': '&lt;', '>': '&gt;' }[char] || char))
    .replace(/&(?!(lt|gt|amp|quot|#39);)/g, '&amp;');
}

// Only allow plain text
export function isValidInput(input: string): boolean {
  // Remove any potentially harmful characters
  const sanitized = input.replace(/[<>&]/g, '');
  return sanitized === input;
}