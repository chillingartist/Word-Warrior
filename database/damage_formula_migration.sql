-- ============================================
-- Damage Formula Migration
-- ============================================
-- Implements the Power-Speed Model damage calculation:
-- 
-- Core Formula: Damage = (ATK² / (ATK + DEF × α)) × 2 × Multiplier
-- Time Multiplier: Multiplier = BaseMultiplier - (10 - timeLeft) / 5
--
-- Word Blitz (BLITZ): baseMultiplier = 2.2, defEfficiency (α) = 1.0
-- Grammar Siege (SIEGE): baseMultiplier = 1.8, defEfficiency (α) = 1.2
--
-- Correct Answer: FinalDamage = Damage (deal to enemy)
-- Wrong Answer: SelfDamage = Damage × 0.7 (self-damage)

-- ============================================
-- 1. PVP ROOMS TABLE UPDATES
-- ============================================
-- Add ATK and DEF columns to store player stats at match start

-- Word Blitz Rooms
ALTER TABLE pvp_word_blitz_rooms 
  ADD COLUMN IF NOT EXISTS player1_atk INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS player1_def INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS player2_atk INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS player2_def INTEGER DEFAULT 10;

-- Grammar Rooms
ALTER TABLE pvp_grammar_rooms 
  ADD COLUMN IF NOT EXISTS player1_atk INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS player1_def INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS player2_atk INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS player2_def INTEGER DEFAULT 10;


-- ============================================
-- 2. UPDATE JOIN QUEUE FUNCTION (WORD BLITZ)
-- ============================================
-- Now fetches ATK and DEF alongside HP

CREATE OR REPLACE FUNCTION join_pvp_word_blitz_queue(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_opponent_id UUID;
    v_room_id UUID;
    v_questions JSONB;
    v_p1_hp INTEGER;
    v_p2_hp INTEGER;
    v_p1_atk INTEGER;
    v_p1_def INTEGER;
    v_p2_atk INTEGER;
    v_p2_def INTEGER;
BEGIN
    -- CRITICAL: Prevent race conditions
    PERFORM pg_advisory_xact_lock(hashtext('pvp_word_blitz_queue_lock'));

    -- Clean up: Remove user from queue if they were already there (restart search)
    DELETE FROM pvp_word_blitz_queue WHERE user_id = p_user_id;

    -- Look for a waiting opponent
    SELECT user_id INTO v_opponent_id
    FROM pvp_word_blitz_queue
    WHERE user_id != p_user_id
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_opponent_id IS NOT NULL THEN
        -- Match Found!
        
        -- 1. Generate Questions
        v_questions := generate_pvp_word_blitz_questions(10);

        -- 2. Fetch Player Stats (HP, ATK, DEF)
        -- Player 1 (Opponent)
        SELECT max_hp, atk, def INTO v_p1_hp, v_p1_atk, v_p1_def 
        FROM user_stats WHERE user_id = v_opponent_id;
        IF v_p1_hp IS NULL THEN v_p1_hp := 100; END IF;
        IF v_p1_atk IS NULL THEN v_p1_atk := 10; END IF;
        IF v_p1_def IS NULL THEN v_p1_def := 10; END IF;

        -- Player 2 (Current User)
        SELECT max_hp, atk, def INTO v_p2_hp, v_p2_atk, v_p2_def 
        FROM user_stats WHERE user_id = p_user_id;
        IF v_p2_hp IS NULL THEN v_p2_hp := 100; END IF;
        IF v_p2_atk IS NULL THEN v_p2_atk := 10; END IF;
        IF v_p2_def IS NULL THEN v_p2_def := 10; END IF;

        -- 3. Create Room with Stats
        INSERT INTO pvp_word_blitz_rooms (
            player1_id, 
            player2_id, 
            player1_hp, 
            player2_hp, 
            player1_atk,
            player1_def,
            player2_atk,
            player2_def,
            questions
        )
        VALUES (
            v_opponent_id, 
            p_user_id, 
            v_p1_hp, 
            v_p2_hp, 
            v_p1_atk,
            v_p1_def,
            v_p2_atk,
            v_p2_def,
            v_questions
        )
        RETURNING id INTO v_room_id;

        -- 4. Remove opponent from queue
        DELETE FROM pvp_word_blitz_queue WHERE user_id = v_opponent_id;
        
        -- Return match info
        RETURN jsonb_build_object(
            'status', 'matched',
            'roomId', v_room_id,
            'role', 'player2'
        );
    ELSE
        -- No match, add to queue
        INSERT INTO pvp_word_blitz_queue (user_id) VALUES (p_user_id);
        RETURN jsonb_build_object(
            'status', 'waiting'
        );
    END IF;
END;
$$;


-- ============================================
-- 3. UPDATE JOIN QUEUE FUNCTION (GRAMMAR)
-- ============================================

CREATE OR REPLACE FUNCTION join_pvp_grammar_queue(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_opponent_id UUID;
    v_room_id UUID;
    v_questions JSONB;
    v_p1_hp INTEGER;
    v_p2_hp INTEGER;
    v_p1_atk INTEGER;
    v_p1_def INTEGER;
    v_p2_atk INTEGER;
    v_p2_def INTEGER;
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

        -- Fetch Player Stats (HP, ATK, DEF)
        -- Player 1 (Opponent)
        SELECT max_hp, atk, def INTO v_p1_hp, v_p1_atk, v_p1_def 
        FROM user_stats WHERE user_id = v_opponent_id;
        IF v_p1_hp IS NULL THEN v_p1_hp := 100; END IF;
        IF v_p1_atk IS NULL THEN v_p1_atk := 10; END IF;
        IF v_p1_def IS NULL THEN v_p1_def := 10; END IF;

        -- Player 2 (Current User)
        SELECT max_hp, atk, def INTO v_p2_hp, v_p2_atk, v_p2_def 
        FROM user_stats WHERE user_id = p_user_id;
        IF v_p2_hp IS NULL THEN v_p2_hp := 100; END IF;
        IF v_p2_atk IS NULL THEN v_p2_atk := 10; END IF;
        IF v_p2_def IS NULL THEN v_p2_def := 10; END IF;

        INSERT INTO pvp_grammar_rooms (
            player1_id, 
            player2_id, 
            player1_hp,
            player2_hp,
            player1_atk,
            player1_def,
            player2_atk,
            player2_def,
            questions
        )
        VALUES (
            v_opponent_id, 
            p_user_id, 
            v_p1_hp,
            v_p2_hp,
            v_p1_atk,
            v_p1_def,
            v_p2_atk,
            v_p2_def,
            v_questions
        )
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


-- ============================================
-- 4. DAMAGE CALCULATION HELPER FUNCTION
-- ============================================
-- Centralized damage calculation logic

CREATE OR REPLACE FUNCTION calculate_battle_damage(
    p_attacker_atk INTEGER,
    p_defender_def INTEGER,
    p_time_left INTEGER,
    p_is_correct BOOLEAN,
    p_mode TEXT -- 'BLITZ' or 'SIEGE'
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_base_time_factor NUMERIC;
    v_def_efficiency NUMERIC;
    v_time_taken NUMERIC;
    v_time_multiplier NUMERIC;
    v_base_damage NUMERIC;
    v_final_damage INTEGER;
BEGIN
    -- Mode-specific parameters
    IF p_mode = 'BLITZ' THEN
        v_base_time_factor := 2.2;
        v_def_efficiency := 1.0;
    ELSE -- 'SIEGE'
        v_base_time_factor := 1.8;
        v_def_efficiency := 1.2;
    END IF;

    -- Time taken calculation: time_taken = 10 - time_left (0 to 10)
    v_time_taken := 10 - p_time_left;
    
    -- Time multiplier: max(0, baseTimeFactor - (timeTaken / 5))
    v_time_multiplier := GREATEST(0, v_base_time_factor - (v_time_taken / 5.0));

    IF p_is_correct THEN
        -- Deal damage to enemy: (ATK² / (ATK + DEF × α)) × 2 × Multiplier × 0.5
        v_base_damage := (POWER(p_attacker_atk::NUMERIC, 2) / 
                         (p_attacker_atk::NUMERIC + p_defender_def::NUMERIC * v_def_efficiency)) * 2.0;
        v_final_damage := FLOOR(v_base_damage * v_time_multiplier * 0.5); -- ×0.5 damage reduction
    ELSE
        -- Self damage (反噬): Use attacker's own DEF to mitigate
        -- (ATK² / (ATK + ATK_DEF)) × 2 × Multiplier × 0.7 × 0.5
        v_base_damage := (POWER(p_attacker_atk::NUMERIC, 2) / 
                         (p_attacker_atk::NUMERIC + p_attacker_atk::NUMERIC)) * 2.0;
        -- Note: Formula simplifies to ATK since ATK²/(2*ATK) = ATK/2, then ×2 = ATK
        -- But we use the formula as given
        v_final_damage := FLOOR(v_base_damage * v_time_multiplier * 0.7 * 0.5); -- ×0.5 damage reduction
    END IF;

    -- Ensure minimum damage of 1 to prevent stalemates
    RETURN GREATEST(1, v_final_damage);
END;
$$;


-- ============================================
-- 5. UPDATE SUBMIT ANSWER FUNCTION (WORD BLITZ)
-- ============================================

CREATE OR REPLACE FUNCTION submit_pvp_word_blitz_answer(
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
    v_attacker_atk INTEGER;
    v_defender_def INTEGER;
BEGIN
    -- Lock room for update
    SELECT * INTO v_room FROM pvp_word_blitz_rooms WHERE id = p_room_id FOR UPDATE;
    
    -- Sync check: if question already moved on, ignore
    IF v_room.current_question_index != p_question_index THEN
        RETURN;
    END IF;

    v_p1_hp := v_room.player1_hp;
    v_p2_hp := v_room.player2_hp;

    -- Calculate and Apply Damage using the new formula
    IF p_user_id = v_room.player1_id THEN
        -- Player 1 is attacking
        v_attacker_atk := COALESCE(v_room.player1_atk, 10);
        v_defender_def := COALESCE(v_room.player2_def, 10);
        
        v_damage := calculate_battle_damage(
            v_attacker_atk, 
            v_defender_def, 
            p_time_left, 
            p_is_correct, 
            'BLITZ'
        );
        
        IF p_is_correct THEN
            v_p2_hp := GREATEST(0, v_p2_hp - v_damage);
        ELSE
            v_p1_hp := GREATEST(0, v_p1_hp - v_damage);
        END IF;
        
    ELSIF p_user_id = v_room.player2_id THEN
        -- Player 2 is attacking
        v_attacker_atk := COALESCE(v_room.player2_atk, 10);
        v_defender_def := COALESCE(v_room.player1_def, 10);
        
        v_damage := calculate_battle_damage(
            v_attacker_atk, 
            v_defender_def, 
            p_time_left, 
            p_is_correct, 
            'BLITZ'
        );
        
        IF p_is_correct THEN
            v_p1_hp := GREATEST(0, v_p1_hp - v_damage);
        ELSE
            v_p2_hp := GREATEST(0, v_p2_hp - v_damage);
        END IF;
    END IF;

    -- Check Game Over (HP based)
    IF v_p1_hp <= 0 THEN
        v_new_status := 'finished';
        v_winner_id := v_room.player2_id;
    ELSIF v_p2_hp <= 0 THEN
        v_new_status := 'finished';
        v_winner_id := v_room.player1_id;
    END IF;
    
    -- Check if we need more questions (Endless Mode)
    v_total_questions := jsonb_array_length(v_room.questions);
    
    IF v_new_status = 'active' AND p_question_index >= (v_total_questions - 1) THEN
        -- Generate 10 more!
        v_new_questions := generate_pvp_word_blitz_questions(10);
        
        -- Update Room with appended questions
        UPDATE pvp_word_blitz_rooms 
        SET 
            player1_hp = v_p1_hp,
            player2_hp = v_p2_hp,
            current_question_index = current_question_index + 1,
            questions = questions || v_new_questions, -- Append
            updated_at = NOW()
        WHERE id = p_room_id;
    ELSE
        -- Normal update
        UPDATE pvp_word_blitz_rooms 
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


-- ============================================
-- 6. UPDATE SUBMIT ANSWER FUNCTION (GRAMMAR)
-- ============================================

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
    v_attacker_atk INTEGER;
    v_defender_def INTEGER;
BEGIN
    SELECT * INTO v_room FROM pvp_grammar_rooms WHERE id = p_room_id FOR UPDATE;
    
    IF v_room.current_question_index != p_question_index THEN
        RETURN;
    END IF;

    v_p1_hp := v_room.player1_hp;
    v_p2_hp := v_room.player2_hp;

    -- Calculate and Apply Damage using the new formula (SIEGE mode)
    IF p_user_id = v_room.player1_id THEN
        v_attacker_atk := COALESCE(v_room.player1_atk, 10);
        v_defender_def := COALESCE(v_room.player2_def, 10);
        
        v_damage := calculate_battle_damage(
            v_attacker_atk, 
            v_defender_def, 
            p_time_left, 
            p_is_correct, 
            'SIEGE'
        );
        
        IF p_is_correct THEN
            v_p2_hp := GREATEST(0, v_p2_hp - v_damage);
        ELSE
            v_p1_hp := GREATEST(0, v_p1_hp - v_damage);
        END IF;
        
    ELSIF p_user_id = v_room.player2_id THEN
        v_attacker_atk := COALESCE(v_room.player2_atk, 10);
        v_defender_def := COALESCE(v_room.player1_def, 10);
        
        v_damage := calculate_battle_damage(
            v_attacker_atk, 
            v_defender_def, 
            p_time_left, 
            p_is_correct, 
            'SIEGE'
        );
        
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


-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION calculate_battle_damage(INTEGER, INTEGER, INTEGER, BOOLEAN, TEXT) TO authenticated, anon;
