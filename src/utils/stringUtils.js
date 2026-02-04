/**
 * Computes the Levenshtein distance between two strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Checks if two strings are "almost" matching based on a threshold.
 * @param {string} s1
 * @param {string} s2
 * @param {number} threshold - Maximum distance allowed (default is 2)
 * @returns {boolean}
 */
export function isAlmostMatch(s1, s2, threshold = 2) {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();

  if (str1 === str2) return true;

  const distance = levenshteinDistance(str1, str2);
  // Adjust threshold based on string length to avoid false positives on short strings
  const dynamicThreshold = Math.min(
    threshold,
    Math.floor(Math.min(str1.length, str2.length) / 3),
  );

  return distance <= Math.max(1, dynamicThreshold);
}
