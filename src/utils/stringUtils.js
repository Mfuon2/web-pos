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
 * Checks if two strings are "almost" matching based on a threshold or token overlap.
 * @param {string} s1
 * @param {string} s2
 * @param {number} threshold - Maximum distance allowed for fallback
 * @returns {boolean}
 */
export function isAlmostMatch(s1, s2, threshold = 2) {
  const str1 = s1
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "");
  const str2 = s2
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "");

  if (str1 === str2) return true;

  const tokens1 = str1.split(/\s+/);
  const tokens2 = str2.split(/\s+/);

  // 1. Check for significant token overlap (first 2 words match)
  // Common for "Brand Name Volume" patterns
  if (tokens1.length >= 2 && tokens2.length >= 2) {
    if (tokens1[0] === tokens2[0] && tokens1[1] === tokens2[1]) {
      return true;
    }
  }

  // 2. Check overlap percentage
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  const intersection = tokens1.filter((x) => set2.has(x));
  const overlapRatio =
    intersection.length / Math.max(tokens1.length, tokens2.length);

  if (overlapRatio >= 0.6) return true;

  // 3. Fallback to Levenshtein distance
  const distance = levenshteinDistance(str1, str2);
  const dynamicThreshold = Math.min(
    threshold,
    Math.floor(Math.min(str1.length, str2.length) / 3),
  );

  return distance <= Math.max(1, dynamicThreshold);
}

/**
 * Generates a unique barcode using timestamp and random number.
 * @returns {string}
 */
export function generateBarcode() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");
  return `10${timestamp}${random}`;
}
