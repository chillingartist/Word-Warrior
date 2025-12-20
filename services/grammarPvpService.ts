import { supabase } from './supabaseClient';
import { JoinStatus, getOpponentProfile } from './pvpService';

// Re-export types if needed or define specific ones
export type { JoinStatus };

/**
 * Attempts to join a Grammar PvP match.
 * Returns match status and room data if matched.
 */
export const findGrammarMatch = async (userId: string): Promise<{ status: JoinStatus; roomId?: string; role?: 'player1' | 'player2' }> => {
    try {
        const { data, error } = await supabase.rpc('join_pvp_grammar_queue', { p_user_id: userId });

        if (error) {
            console.error('Error joining PvP queue:', error);
            return { status: 'error' };
        }

        return data as { status: JoinStatus; roomId?: string; role?: 'player1' | 'player2' };
    } catch (err) {
        console.error('Exception in findMatch:', err);
        return { status: 'error' };
    }
};

/**
 * Cancels matchmaking for Grammar PvP
 */
export const cancelGrammarMatchmaking = async (userId: string) => {
    const { error } = await supabase.rpc('leave_pvp_grammar_queue', { p_user_id: userId });
    if (error) console.error('Error leaving queue:', error);
};

/**
 * Submit an answer to the current grammar question
 */
export const submitGrammarAnswer = async (
    roomId: string,
    userId: string,
    questionIndex: number,
    isCorrect: boolean,
    timeLeft: number
) => {
    const { error } = await supabase.rpc('submit_pvp_grammar_answer', {
        p_room_id: roomId,
        p_user_id: userId,
        p_question_index: questionIndex,
        p_is_correct: isCorrect,
        p_time_left: timeLeft
    });

    if (error) console.error('Error submitting answer:', error);
};

export { getOpponentProfile };
