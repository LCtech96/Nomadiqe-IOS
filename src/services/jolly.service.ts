/**
 * Jolly: info ristorante (menu, posizione, orari) e rating thumbs up/down (solo host con collaborazione)
 */

import { supabase } from './supabase';

export interface JollyRestaurantInfo {
  user_id: string;
  menu_url: string | null;
  menu_text: string | null;
  address: string | null;
  place_url: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Record<string, unknown> | null;
  opening_days: string[] | null;
  updated_at: string;
}

export interface JollyRatingSummary {
  thumbs_up: number;
  thumbs_down: number;
  my_vote: 'up' | 'down' | null;
}

export interface JollyProduct {
  id: string;
  jolly_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface JollyProductInput {
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  image_url?: string | null;
  sort_order?: number;
}

export class JollyService {
  /** Info ristorante per Jolly con jolly_subcategory = 'restaurant' */
  static async getRestaurantInfo(userId: string): Promise<JollyRestaurantInfo | null> {
    const { data, error } = await supabase
      .from('jolly_restaurant_info')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data as JollyRestaurantInfo | null;
  }

  /** Conteggi thumbs up/down e voto dell'utente corrente (se host che ha collaborato) */
  static async getJollyRating(jollyId: string, currentUserId: string): Promise<JollyRatingSummary> {
    const { data: rows, error } = await supabase
      .from('jolly_host_ratings')
      .select('host_id, vote')
      .eq('jolly_id', jollyId);
    if (error) throw error;
    const list = (rows || []) as { host_id: string; vote: string }[];
    const thumbs_up = list.filter((r) => r.vote === 'up').length;
    const thumbs_down = list.filter((r) => r.vote === 'down').length;
    const my = list.find((r) => r.host_id === currentUserId);
    return {
      thumbs_up,
      thumbs_down,
      my_vote: my ? (my.vote as 'up' | 'down') : null,
    };
  }

  /** Verifica se l'host ha già una richiesta di collaborazione con questo jolly (può votare) */
  static async hasHostCollaboratedWithJolly(hostId: string, jollyId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('host_creator_collaboration_requests')
      .select('id')
      .eq('host_id', hostId)
      .eq('creator_id', jollyId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  }

  /** Imposta o aggiorna il voto (solo host; lato server RLS verifica collaborazione) */
  static async setRating(hostId: string, jollyId: string, vote: 'up' | 'down'): Promise<void> {
    const { error } = await supabase
      .from('jolly_host_ratings')
      .upsert(
        { host_id: hostId, jolly_id: jollyId, vote, updated_at: new Date().toISOString() },
        { onConflict: 'host_id,jolly_id' }
      );
    if (error) throw error;
  }

  /** Prodotti e-commerce (Jolly home_products) */
  static async getProductsByJolly(jollyId: string): Promise<JollyProduct[]> {
    const { data, error } = await supabase
      .from('jolly_products')
      .select('*')
      .eq('jolly_id', jollyId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as JollyProduct[];
  }

  static async getProductCountByJolly(jollyId: string): Promise<number> {
    const { count, error } = await supabase
      .from('jolly_products')
      .select('*', { count: 'exact', head: true })
      .eq('jolly_id', jollyId);
    if (error) throw error;
    return count ?? 0;
  }

  static async createProduct(jollyId: string, input: JollyProductInput): Promise<JollyProduct> {
    const { data, error } = await supabase
      .from('jolly_products')
      .insert({
        jolly_id: jollyId,
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        quantity: input.quantity ?? 0,
        image_url: input.image_url ?? null,
        sort_order: input.sort_order ?? 0,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as JollyProduct;
  }

  static async updateProduct(productId: string, jollyId: string, input: Partial<JollyProductInput>): Promise<JollyProduct> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) payload.name = input.name;
    if (input.description !== undefined) payload.description = input.description;
    if (input.price !== undefined) payload.price = input.price;
    if (input.quantity !== undefined) payload.quantity = input.quantity;
    if (input.image_url !== undefined) payload.image_url = input.image_url;
    if (input.sort_order !== undefined) payload.sort_order = input.sort_order;
    const { data, error } = await supabase
      .from('jolly_products')
      .update(payload)
      .eq('id', productId)
      .eq('jolly_id', jollyId)
      .select()
      .single();
    if (error) throw error;
    return data as JollyProduct;
  }

  static async deleteProduct(productId: string, jollyId: string): Promise<void> {
    const { error } = await supabase
      .from('jolly_products')
      .delete()
      .eq('id', productId)
      .eq('jolly_id', jollyId);
    if (error) throw error;
  }
}
