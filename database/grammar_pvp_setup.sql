-- PVP Tables Setup (Grammar Stronghold Mode)
-- "Grammar Stronghold" - Localized as 语法阵地战

-- 1. Grammar Questions Table
CREATE TABLE IF NOT EXISTS grammar_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings
    correct_answer TEXT NOT NULL,
    type TEXT DEFAULT 'grammar',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed with data from MOCK_GRAMMAR_QUESTIONS
INSERT INTO grammar_questions (prompt, options, correct_answer) VALUES
('If I ______ you, I would take the job immediately.', '["am", "was", "were", "be"]'::jsonb, 'were'),
('She is one of the students who ______ always on time.', '["is", "are", "was", "be"]'::jsonb, 'are'),
('By this time next year, I ______ my master''s degree.', '["will finish", "will have finished", "finish", "finished"]'::jsonb, 'will have finished'),
('I wish I ______ to the party last night.', '["go", "went", "had gone", "would go"]'::jsonb, 'had gone');

-- 2. Queue Table for Matchmaking (Grammar)
CREATE TABLE IF NOT EXISTS pvp_grammar_queue (
    user_id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'waiting'
);

-- 3. Game Rooms Table (Grammar)
CREATE TABLE IF NOT EXISTS pvp_grammar_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player1_id UUID NOT NULL,
    player2_id UUID NOT NULL,
    player1_hp INTEGER DEFAULT 100,
    player2_hp INTEGER DEFAULT 100,
    current_question_index INTEGER DEFAULT 0,
    questions JSONB DEFAULT '[]'::JSONB,
    status TEXT DEFAULT 'active', -- 'active', 'finished'
    winner_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Helper: Generate Questions
CREATE OR REPLACE FUNCTION generate_pvp_grammar_questions(p_limit INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_questions JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'prompt', q.prompt,
            'options', q.options,
            'correctAnswer', q.correct_answer,
            'type', q.type
        )
    ) INTO v_questions
    FROM (
        SELECT * FROM grammar_questions
        ORDER BY random() 
        LIMIT p_limit
    ) q;

    RETURN v_questions;
END;
$$;

-- 5. Matchmaking Function
CREATE OR REPLACE FUNCTION join_pvp_grammar_queue(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_opponent_id UUID;
    v_room_id UUID;
    v_questions JSONB;
BEGIN
    -- Advisory lock to prevent race conditions
    PERFORM pg_advisory_xact_lock(hashtext('pvp_grammar_queue_lock'));

    -- Cleanup existing
    DELETE FROM pvp_grammar_queue WHERE user_id = p_user_id;

    -- Look for opponent
    SELECT user_id INTO v_opponent_id
    FROM pvp_grammar_queue
    WHERE user_id != p_user_id
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_opponent_id IS NOT NULL THEN
        -- Match Found!
        v_questions := generate_pvp_grammar_questions(10);

        INSERT INTO pvp_grammar_rooms (player1_id, player2_id, questions)
        VALUES (v_opponent_id, p_user_id, v_questions)
        RETURNING id INTO v_room_id;

        DELETE FROM pvp_grammar_queue WHERE user_id = v_opponent_id;
        
        RETURN jsonb_build_object(
            'status', 'matched',
            'roomId', v_room_id,
            'role', 'player2'
        );
    ELSE
        -- Add to queue
        INSERT INTO pvp_grammar_queue (user_id) VALUES (p_user_id);
        RETURN jsonb_build_object(
            'status', 'waiting'
        );
    END IF;
END;
$$;

-- 6. Submit Answer Function
CREATE OR REPLACE FUNCTION submit_pvp_grammar_answer(
    p_room_id UUID,
    p_user_id UUID,
    p_question_index INTEGER,
    p_is_correct BOOLEAN,
    p_time_left INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_room RECORD;
    v_damage INTEGER;
    v_p1_hp INTEGER;
    v_p2_hp INTEGER;
    v_new_status TEXT := 'active';
    v_winner_id UUID := NULL;
    v_new_questions JSONB;
    v_total_questions INTEGER;
BEGIN
    SELECT * INTO v_room FROM pvp_grammar_rooms WHERE id = p_room_id FOR UPDATE;
    
    IF v_room.current_question_index != p_question_index THEN
        RETURN;
    END IF;

    v_damage := p_time_left;
    v_p1_hp := v_room.player1_hp;
    v_p2_hp := v_room.player2_hp;

    -- Same damage logic as Word Blitz
    IF p_user_id = v_room.player1_id THEN
        IF p_is_correct THEN
            v_p2_hp := GREATEST(0, v_p2_hp - v_damage);
        ELSE
            v_p1_hp := GREATEST(0, v_p1_hp - v_damage);
        END IF;
    ELSIF p_user_id = v_room.player2_id THEN
        IF p_is_correct THEN
            v_p1_hp := GREATEST(0, v_p1_hp - v_damage);
        ELSE
            v_p2_hp := GREATEST(0, v_p2_hp - v_damage);
        END IF;
    END IF;

    IF v_p1_hp <= 0 THEN
        v_new_status := 'finished';
        v_winner_id := v_room.player2_id;
    ELSIF v_p2_hp <= 0 THEN
        v_new_status := 'finished';
        v_winner_id := v_room.player1_id;
    END IF;
    
    -- Endless check
    v_total_questions := jsonb_array_length(v_room.questions);
    
    IF v_new_status = 'active' AND p_question_index >= (v_total_questions - 1) THEN
        v_new_questions := generate_pvp_grammar_questions(10);
        
        UPDATE pvp_grammar_rooms 
        SET 
            player1_hp = v_p1_hp,
            player2_hp = v_p2_hp,
            current_question_index = current_question_index + 1,
            questions = questions || v_new_questions,
            updated_at = NOW()
        WHERE id = p_room_id;
    ELSE
        UPDATE pvp_grammar_rooms 
        SET 
            player1_hp = v_p1_hp,
            player2_hp = v_p2_hp,
            current_question_index = CASE WHEN v_new_status = 'active' THEN current_question_index + 1 ELSE current_question_index END,
            status = v_new_status,
            winner_id = v_winner_id,
            updated_at = NOW()
        WHERE id = p_room_id;
    END IF;
END;
$$;

-- 7. Leave Queue Function
CREATE OR REPLACE FUNCTION leave_pvp_grammar_queue(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM pvp_grammar_queue WHERE user_id = p_user_id;
END;
$$;

-- 8. Realtime & Security
ALTER TABLE pvp_grammar_queue REPLICA IDENTITY FULL;
ALTER TABLE pvp_grammar_rooms REPLICA IDENTITY FULL;

BEGIN;
  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'pvp_grammar_queue') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE pvp_grammar_queue;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'pvp_grammar_rooms') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE pvp_grammar_rooms;
        END IF;
    END IF;
  END
  $$;
COMMIT;

ALTER TABLE grammar_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_grammar_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_grammar_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for grammar_questions" ON grammar_questions;
DROP POLICY IF EXISTS "Enable all for pvp_grammar_queue" ON pvp_grammar_queue;
DROP POLICY IF EXISTS "Enable all for pvp_grammar_rooms" ON pvp_grammar_rooms;

CREATE POLICY "Enable all for grammar_questions" ON grammar_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for pvp_grammar_queue" ON pvp_grammar_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for pvp_grammar_rooms" ON pvp_grammar_rooms FOR ALL USING (true) WITH CHECK (true);
