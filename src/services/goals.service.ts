import type { Goal, GoalProgress, GoalType } from '../types/models';
import { notificationService } from './notification.service';
import { requireSupabaseClient } from './supabase/client';

export interface CreateGoalPayload {
  title: string;
  type: GoalType;
  target_minutes: number;
  target_days: number;
}

export interface MarkGoalProgressPayload {
  goal_id: string;
  date: string;
  completed: boolean;
  minutes_done?: number;
}

export const goalsService = {
  async createGoal(payload: CreateGoalPayload): Promise<Goal> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: payload.title,
        type: payload.type,
        target_minutes: payload.target_minutes,
        target_days: payload.target_days,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as Goal;
  },

  async fetchUserGoals(): Promise<Goal[]> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return [];

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Goal[];
  },

  async markGoalProgress(payload: MarkGoalProgressPayload): Promise<GoalProgress> {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from('goal_progress')
      .upsert(
        {
          goal_id: payload.goal_id,
          date: payload.date,
          completed: payload.completed,
          minutes_done: payload.minutes_done ?? 0,
        },
        { onConflict: 'goal_id,date' },
      )
      .select('*')
      .single();

    if (error) throw error;

    if (payload.completed) {
      void notificationService.notifyEvent({
        type: 'goal_completed',
        goalId: payload.goal_id,
        date: payload.date,
      });
    }

    return data as GoalProgress;
  },

  async deleteGoal(goalId: string): Promise<void> {
    const supabase = requireSupabaseClient();
    const { error } = await supabase.from('goals').delete().eq('id', goalId);
    if (error) throw error;
  },

  async fetchGoalProgress(goalId: string): Promise<GoalProgress[]> {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from('goal_progress')
      .select('*')
      .eq('goal_id', goalId)
      .order('date', { ascending: false });
    if (error) throw error;
    return (data ?? []) as GoalProgress[];
  },
};
