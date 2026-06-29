export class SemanticSearchEngine {
  static stopwords = new Set([
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours",
    "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers",
    "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves",
    "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are",
    "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does",
    "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until",
    "while", "of", "at", "by", "for", "with", "about", "against", "between", "into",
    "through", "during", "before", "after", "above", "below", "to", "from", "up", "down",
    "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here",
    "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
    "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now",
    "want", "need", "learn", "later", "get", "find", "looking"
  ]);

  static synonyms: Record<string, string[]> = {
    "certificate": ["course", "training", "program", "certification"],
    "course": ["certificate", "training", "program", "class"],
    "internship": ["job simulation", "virtual internship", "experience"],
    "ai": ["artificial intelligence"],
    "artificial intelligence": ["ai"],
    "ml": ["machine learning"],
    "machine learning": ["ml"],
    "excel": ["spreadsheet", "spreadsheets"],
    "marketing": ["digital marketing", "seo", "meta ads", "google ads", "email marketing"],
    "resume": ["cv", "curriculum vitae"]
  };

  static tokenize(text: string): string[] {
    if (!text) return [];
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);
  }

  static extractIntent(query: string): string[] {
    const tokens = this.tokenize(query);
    const keywords: string[] = [];
    
    for (const token of tokens) {
      if (!this.stopwords.has(token)) {
        keywords.push(token);
        // Expand synonyms
        for (const [key, syns] of Object.entries(this.synonyms)) {
          if (key === token) {
            keywords.push(...syns);
          } else if (syns.includes(token)) {
            keywords.push(key);
            keywords.push(...syns.filter(s => s !== token));
          }
        }
      }
    }
    
    // Also check for multi-word synonyms like "machine learning"
    const lowerQuery = query.toLowerCase();
    for (const [key, syns] of Object.entries(this.synonyms)) {
      if (key.includes(" ") && lowerQuery.includes(key)) {
        keywords.push(...key.split(" "));
        keywords.push(...syns.flatMap(s => s.split(" ")));
      }
      for (const syn of syns) {
        if (syn.includes(" ") && lowerQuery.includes(syn)) {
          keywords.push(...key.split(" "));
          keywords.push(...syns.flatMap(s => s.split(" ")));
        }
      }
    }

    return Array.from(new Set(keywords));
  }

  // Jaro-Winkler distance for typo tolerance
  static jaroWinkler(s1: string, s2: string): number {
    let m = 0;
    if (s1.length === 0 || s2.length === 0) return 0;
    if (s1 === s2) return 1;

    const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);

    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, s2.length);
      for (let j = start; j < end; j++) {
        if (s2Matches[j]) continue;
        if (s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        m++;
        break;
      }
    }
    if (m === 0) return 0;

    let k = 0;
    let numTransposes = 0;
    for (let i = 0; i < s1.length; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) numTransposes++;
      k++;
    }

    const weight = (m / s1.length + m / s2.length + (m - numTransposes / 2) / m) / 3;
    let l = 0;
    const p = 0.1;
    if (weight > 0.7) {
      while (s1[l] === s2[l] && l < 4) l++;
      return weight + l * p * (1 - weight);
    }
    return weight;
  }

  static scoreItem(item: any, query: string, keywords: string[]): number {
    if (!query) return 0;
    let score = 0;
    
    const queryLower = query.toLowerCase().trim();
    const titleLower = (item.title || item.name || "").toLowerCase().trim();
    const descLower = (item.description || "").toLowerCase();
    const tagsLower = (item.tags || []).join(" ").toLowerCase();
    const catLower = (item.category || "").toLowerCase();
    
    // 1. EXACT TITLE MATCH (Highest Priority)
    if (titleLower === queryLower) {
      score += 1000;
    }
    
    // 2. TITLE STARTS WITH QUERY
    if (titleLower.startsWith(queryLower)) {
      score += 800;
    }
    
    // 3. ALL QUERY WORDS EXIST IN TITLE
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
    if (queryWords.length > 0 && queryWords.every(word => titleLower.includes(word))) {
      score += 700;
    }
    
    // 4-7. Keyword based matching (Title, Category, Tags, Description)
    for (const kw of keywords) {
      if (titleLower.includes(kw)) score += 500;
      if (catLower.includes(kw)) score += 300;
      if (tagsLower.includes(kw)) score += 250;
      if (descLower.includes(kw)) score += 100;
      
      // 8. AI keyword similarity (Jaro-Winkler for typo tolerance)
      const titleTokens = this.tokenize(titleLower);
      let bestTitleMatch = 0;
      for (const t of titleTokens) {
        bestTitleMatch = Math.max(bestTitleMatch, this.jaroWinkler(kw, t));
      }
      if (bestTitleMatch > 0.85 && bestTitleMatch < 1) {
        score += 50 * bestTitleMatch;
      }
    }
    
    return score;
  }
}
