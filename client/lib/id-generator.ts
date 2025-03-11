/**
 * Generates a memorable, human-readable ID in the format "xxx-xxxx"
 * Where the first part is 3 lowercase letters and second part is 4 numbers
 */
export function generateMemorableId(): string {
  // Generate 3 random lowercase letters
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let alpha = '';

  for (let i = 0; i < 3; i++) {
    alpha += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Generate 4 random digits
  const numeric = Math.floor(1000 + Math.random() * 9000).toString();

  return `${alpha}-${numeric}`;
}
