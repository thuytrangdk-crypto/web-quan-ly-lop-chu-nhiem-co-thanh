import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState } from '../types';

export interface SyncStatus {
  isConnected: boolean;
  isTableReady: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  errorMessage: string | null;
}

const URL_KEY = 'scn_supabase_url';
const ANON_KEY = 'scn_supabase_key';
const TABLE_NAME = 'so_chu_nhiem_data';
const ROW_ID = 'class_data_v1';

class SupabaseService {
  private client: SupabaseClient | null = null;
  private currentUrl: string = '';
  private currentKey: string = '';

  constructor() {
    this.initFromStorage();
  }

  private initFromStorage() {
    const url =
      localStorage.getItem(URL_KEY) ||
      (import.meta as any).env?.VITE_SUPABASE_URL ||
      '';
    const key =
      localStorage.getItem(ANON_KEY) ||
      (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
      '';

    if (url && key) {
      try {
        this.client = createClient(url, key);
        this.currentUrl = url;
        this.currentKey = key;
      } catch (e) {
        console.error('Failed to init Supabase client', e);
        this.client = null;
      }
    }
  }

  public getCredentials() {
    return {
      url: this.currentUrl || localStorage.getItem(URL_KEY) || '',
      key: this.currentKey || localStorage.getItem(ANON_KEY) || '',
    };
  }

  public setCredentials(url: string, key: string) {
    const trimmedUrl = url.trim();
    const trimmedKey = key.trim();

    if (trimmedUrl && trimmedKey) {
      localStorage.setItem(URL_KEY, trimmedUrl);
      localStorage.setItem(ANON_KEY, trimmedKey);
      try {
        this.client = createClient(trimmedUrl, trimmedKey);
        this.currentUrl = trimmedUrl;
        this.currentKey = trimmedKey;
      } catch (e) {
        this.client = null;
      }
    } else {
      localStorage.removeItem(URL_KEY);
      localStorage.removeItem(ANON_KEY);
      this.client = null;
      this.currentUrl = '';
      this.currentKey = '';
    }
  }

  public async checkConnection(): Promise<{
    isConnected: boolean;
    isTableReady: boolean;
    error?: string;
  }> {
    if (!this.client) {
      const creds = this.getCredentials();
      if (!creds.url || !creds.key) {
        return {
          isConnected: false,
          isTableReady: false,
          error: 'Chưa cấu hình Supabase URL và Anon Key.',
        };
      }
      try {
        this.client = createClient(creds.url, creds.key);
      } catch (err: any) {
        return {
          isConnected: false,
          isTableReady: false,
          error: `URL không hợp lệ: ${err?.message || ''}`,
        };
      }
    }

    try {
      // Test querying the table
      const { data, error } = await this.client
        .from(TABLE_NAME)
        .select('id')
        .limit(1);

      if (error) {
        if (
          error.code === '42P01' ||
          error.message?.toLowerCase().includes('does not exist') ||
          error.message?.toLowerCase().includes('relation')
        ) {
          return {
            isConnected: true,
            isTableReady: false,
            error: `Bảng "${TABLE_NAME}" chưa được tạo trên cơ sở dữ liệu Supabase.`,
          };
        }
        return {
          isConnected: false,
          isTableReady: false,
          error: `Lỗi kết nối Supabase: ${error.message}`,
        };
      }

      return {
        isConnected: true,
        isTableReady: true,
      };
    } catch (err: any) {
      return {
        isConnected: false,
        isTableReady: false,
        error: `Không thể kết nối đến máy chủ Supabase: ${err?.message || ''}`,
      };
    }
  }

  public async loadState(): Promise<{ state: AppState | null; error?: string }> {
    if (!this.client) {
      return { state: null, error: 'Chưa kết nối Supabase' };
    }

    try {
      const { data, error } = await this.client
        .from(TABLE_NAME)
        .select('payload')
        .eq('id', ROW_ID)
        .single();

      if (error) {
        return { state: null, error: error.message };
      }

      if (data && data.payload) {
        return { state: data.payload as AppState };
      }

      return { state: null, error: 'Chưa có dữ liệu nào trên đám mây' };
    } catch (err: any) {
      return { state: null, error: err?.message };
    }
  }

  public async saveState(
    state: AppState
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Chưa kết nối Supabase' };
    }

    try {
      const { error } = await this.client.from(TABLE_NAME).upsert({
        id: ROW_ID,
        payload: state,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  public subscribe(
    onRemoteChange: (updatedState: AppState) => void
  ): () => void {
    if (!this.client) {
      return () => {};
    }

    try {
      const channel = this.client
        .channel('so_chu_nhiem_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: TABLE_NAME,
            filter: `id=eq.${ROW_ID}`,
          },
          (payload: any) => {
            if (payload.new && payload.new.payload) {
              onRemoteChange(payload.new.payload as AppState);
            }
          }
        )
        .subscribe();

      return () => {
        this.client?.removeChannel(channel);
      };
    } catch {
      return () => {};
    }
  }
}

export const supabaseService = new SupabaseService();
