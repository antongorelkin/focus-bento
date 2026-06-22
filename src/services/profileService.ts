import { supabase } from "../utils/supabaseClient";

export interface UserProfile {
  id: string;
  xp: number;
  level: number;
}


export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('Ошибка загрузки профиля геймификации:', error);
    return null;
  }
  return data;
}

export const addXpToUser = async (userId: string, currentXp: number, _currentLevel: number, xpToAdd: number): Promise<UserProfile> => {
  const totalXp = Math.max(0, currentXp + xpToAdd);
  const newLevel = Math.max(1, Math.floor(totalXp / 100) + 1);


  const { data, error } = await supabase
    .from('user_profiles')
    .update({ xp: totalXp, level: newLevel })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error("Ошибка при обновлении XP", error.message)
    throw error
  };

  return data as UserProfile
}