-- ============================================
-- Word Warrior - Batch Learning Functions
-- ============================================

-- Function to get a batch of next words for a user
-- Respects frq order and excludes already mastered words
CREATE OR REPLACE FUNCTION get_next_words_batch(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  word TEXT,
  phonetic TEXT,
  definition TEXT,
  translation TEXT,
  pos TEXT,
  collins INTEGER,
  oxford BOOLEAN,
  tag TEXT,
  bnc INTEGER,
  frq INTEGER,
  exchange TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.word,
    w.phonetic,
    w.definition,
    w.translation,
    w.pos,
    w.collins,
    w.oxford,
    w.tag,
    w.bnc,
    w.frq,
    w.exchange
  FROM words w
  WHERE NOT EXISTS (
    -- Exclude words already mastered OR learned recently (SRS-lite)
    SELECT 1 FROM user_word_progress uwp
    WHERE uwp.user_id = p_user_id
      AND uwp.word_id = w.id
      AND (
        uwp.status = 'mastered'
        OR 
        (uwp.status = 'learning' AND uwp.last_reviewed_at > NOW() - INTERVAL '12 hours')
      )
  )
  ORDER BY 
    -- Words with frq=0 go to the end
    CASE WHEN w.frq = 0 THEN 999999 ELSE w.frq END ASC,
    w.id ASC -- Secondary sort
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Helper to get random words for distractors (excluding correct word)
-- Used for quiz generation
CREATE OR REPLACE FUNCTION get_distractors(
  p_exclude_word_id UUID,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  word TEXT,
  translation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.word,
    w.translation
  FROM words w
  WHERE w.id != p_exclude_word_id
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
