const BASE_URL = 'https://api.esv.org/v3';

function getApiKey(): string {
  return import.meta.env.VITE_ESV_API_KEY || '';
}

async function apiFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Token ${getApiKey()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`ESV API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ─── ESV API Response Types ─────────────────────────────────

interface EsvPassageResponse {
  query: string;
  canonical: string;
  parsed: number[][];
  passage_meta: {
    canonical: string;
    chapter_start: number[];
    chapter_end: number[];
    prev_verse: number;
    next_verse: number;
    prev_chapter: number[];
    next_chapter: number[];
  }[];
  passages: string[];
}

interface EsvSearchResponse {
  page: number;
  total_results: number;
  results: {
    reference: string;
    content: string;
  }[];
  total_pages: number;
}

// ─── API Functions ──────────────────────────────────────────

/**
 * Fetch a passage from the ESV API.
 * Accepts natural-language references: "John 3:16", "Genesis 1-3", "Psalm 23:1-6", etc.
 * Returns the canonical reference and clean verse text.
 */
export async function getPassage(query: string): Promise<{
  canonical: string;
  text: string;
}> {
  const data = await apiFetch<EsvPassageResponse>('/passage/text/', {
    q: query,
    'include-passage-references': 'false',
    'include-verse-numbers': 'false',
    'include-first-verse-numbers': 'false',
    'include-footnotes': 'false',
    'include-footnote-body': 'false',
    'include-headings': 'false',
    'include-short-copyright': 'false',
    'indent-paragraphs': '0',
    'indent-poetry': 'false',
    'line-length': '0',
  });

  if (!data.passages || data.passages.length === 0 || !data.passages[0].trim()) {
    throw new Error('Passage not found');
  }

  return {
    canonical: data.canonical,
    text: data.passages[0].trim(),
  };
}

/**
 * Fetch a passage range and split it into individual verses.
 * Returns an array of { reference, text } objects -- one per verse.
 * Useful for ranges like "Genesis 1:3-5" which become 3 individual verse docs.
 */
export async function getPassageVerses(passageQuery: string): Promise<{
  canonical: string;
  verses: { reference: string; text: string }[];
}> {
  const data = await apiFetch<EsvPassageResponse>('/passage/text/', {
    q: passageQuery,
    'include-passage-references': 'false',
    'include-verse-numbers': 'true',
    'include-first-verse-numbers': 'true',
    'include-footnotes': 'false',
    'include-footnote-body': 'false',
    'include-headings': 'false',
    'include-short-copyright': 'false',
    'indent-paragraphs': '0',
    'indent-poetry': 'false',
    'line-length': '0',
  });

  if (!data.passages || data.passages.length === 0 || !data.passages[0].trim()) {
    throw new Error('Passage not found');
  }

  const rawText = data.passages[0].trim();
  const canonical = data.canonical;

  // Parse verse numbers out of the text. ESV returns them as "[1]", "[2]", etc.
  // Pattern: [number] followed by verse text until the next [number] or end
  const verseRegex = /\[(\d+)\]\s*/g;
  const splits: { verseNum: number; startIndex: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = verseRegex.exec(rawText)) !== null) {
    splits.push({ verseNum: parseInt(match[1], 10), startIndex: match.index + match[0].length });
  }

  if (splits.length === 0) {
    // No verse numbers found -- treat as a single verse
    return {
      canonical,
      verses: [{ reference: canonical, text: rawText }],
    };
  }

  // Extract the book name and starting chapter from the canonical reference.
  // Examples:
  //   "Genesis 1:3-5"   -> book="Genesis", startChapter=1
  //   "Psalm 23"        -> book="Psalm",   startChapter=23
  //   "Genesis 1:1-2:3" -> book="Genesis", startChapter=1
  //   "1 John 2:3-5"    -> book="1 John",  startChapter=2
  const bookName = getBookName(canonical);
  const afterBook = canonical.slice(bookName.length).trim();
  const startChapter = parseInt(afterBook, 10) || 1;

  // Build references, detecting chapter boundaries when verse numbers reset.
  // When verseNum <= previous verseNum, a new chapter has started.
  let currentChapter = startChapter;
  const verses = splits.map((split, i) => {
    if (i > 0 && split.verseNum <= splits[i - 1].verseNum) {
      currentChapter++;
    }
    const endIndex = i + 1 < splits.length
      ? rawText.lastIndexOf('[', splits[i + 1].startIndex)
      : rawText.length;
    const text = rawText.slice(split.startIndex, endIndex).trim();
    const reference = `${bookName} ${currentChapter}:${split.verseNum}`;
    return { reference, text };
  });

  return { canonical, verses };
}

/**
 * Detect whether a query is likely a multi-verse range (e.g. "John 3:16-18")
 */
export function isPassageRange(query: string): boolean {
  // Match patterns like "John 3:16-18", "Genesis 1:1-3", "Psalm 119:1-8"
  return /\d+:\d+\s*-\s*\d+/.test(query) || /\d+\s*-\s*\d+:\d+/.test(query);
}

/**
 * Search the ESV text by keyword or phrase.
 * Wrap query in double quotes for exact phrase matching.
 */
export async function searchVerses(query: string): Promise<{
  results: { reference: string; content: string }[];
  total: number;
}> {
  const data = await apiFetch<EsvSearchResponse>('/passage/search/', {
    q: query,
    'page-size': '20',
  });

  return {
    results: data.results || [],
    total: data.total_results || 0,
  };
}

// ─── Reference Helpers ──────────────────────────────────────

/**
 * Extract the book name from a canonical reference.
 * e.g. "John 3:16" -> "John", "1 Corinthians 13:4-7" -> "1 Corinthians"
 */
export function getBookName(canonical: string): string {
  // Match everything before the first digit that follows a space
  const match = canonical.match(/^(.+?)\s+\d/);
  return match ? match[1].trim() : canonical;
}

/**
 * Parse a reference into its components for sorting.
 * e.g. "Psalm 34:1" -> { book: "Psalm", chapter: 34, verse: 1 }
 */
function parseReference(ref: string): { book: string; chapter: number; verse: number } {
  const book = getBookName(ref);
  const afterBook = ref.slice(book.length).trim();
  const parts = afterBook.match(/^(\d+)(?::(\d+))?/);
  return {
    book,
    chapter: parts ? parseInt(parts[1], 10) : 0,
    verse: parts && parts[2] ? parseInt(parts[2], 10) : 0,
  };
}

// Canonical Bible book order for proper sorting across books
const BOOK_ORDER: Record<string, number> = {
  'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
  'Joshua': 6, 'Judges': 7, 'Ruth': 8, '1 Samuel': 9, '2 Samuel': 10,
  '1 Kings': 11, '2 Kings': 12, '1 Chronicles': 13, '2 Chronicles': 14,
  'Ezra': 15, 'Nehemiah': 16, 'Esther': 17, 'Job': 18, 'Psalm': 19, 'Psalms': 19,
  'Proverbs': 20, 'Ecclesiastes': 21, 'Song of Solomon': 22,
  'Isaiah': 23, 'Jeremiah': 24, 'Lamentations': 25, 'Ezekiel': 26, 'Daniel': 27,
  'Hosea': 28, 'Joel': 29, 'Amos': 30, 'Obadiah': 31, 'Jonah': 32, 'Micah': 33,
  'Nahum': 34, 'Habakkuk': 35, 'Zephaniah': 36, 'Haggai': 37, 'Zechariah': 38, 'Malachi': 39,
  'Matthew': 40, 'Mark': 41, 'Luke': 42, 'John': 43, 'Acts': 44,
  'Romans': 45, '1 Corinthians': 46, '2 Corinthians': 47, 'Galatians': 48,
  'Ephesians': 49, 'Philippians': 50, 'Colossians': 51,
  '1 Thessalonians': 52, '2 Thessalonians': 53, '1 Timothy': 54, '2 Timothy': 55,
  'Titus': 56, 'Philemon': 57, 'Hebrews': 58, 'James': 59,
  '1 Peter': 60, '2 Peter': 61, '1 John': 62, '2 John': 63, '3 John': 64,
  'Jude': 65, 'Revelation': 66,
};

/**
 * Compare two verse references in biblical order.
 * Sorts by book (canonical Bible order), then chapter, then verse number.
 */
export function compareReferences(refA: string, refB: string): number {
  const a = parseReference(refA);
  const b = parseReference(refB);

  const bookOrderA = BOOK_ORDER[a.book] ?? 999;
  const bookOrderB = BOOK_ORDER[b.book] ?? 999;
  if (bookOrderA !== bookOrderB) return bookOrderA - bookOrderB;

  if (a.chapter !== b.chapter) return a.chapter - b.chapter;
  return a.verse - b.verse;
}
