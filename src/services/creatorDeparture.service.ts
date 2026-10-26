/**
 * Creator default departure + temporary travel windows (local until backend is wired).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from './auth.service';
import { CreatorOnboardingLocalService } from './creatorOnboardingLocal.service';
import type { UserProfile } from '../types';

export interface CreatorDepartureWindow {
  id: string;
  startDate: string;
  endDate: string;
  city: string;
  iata: string;
  notes: string | null;
}

export interface CreatorDefaultDeparture {
  city: string;
  iata: string;
}

const windowsKey = (userId: string) => `@nomadiqe/creator-departure/windows/${userId}`;

export class CreatorDepartureService {
  static async loadDefault(
    userId: string,
    profile: UserProfile | null | undefined
  ): Promise<CreatorDefaultDeparture> {
    const local = await CreatorOnboardingLocalService.loadData(userId);
    return {
      city: profile?.location?.trim() || '',
      iata: (local?.nearestAirport || '').trim().toUpperCase(),
    };
  }

  static async saveDefault(userId: string, data: CreatorDefaultDeparture): Promise<void> {
    const city = data.city.trim();
    const iata = data.iata.trim().toUpperCase();
    await AuthService.updateProfile(userId, { location: city || null });
    await CreatorOnboardingLocalService.saveData(userId, { nearestAirport: iata });
  }

  static async loadWindows(userId: string): Promise<CreatorDepartureWindow[]> {
    const raw = await AsyncStorage.getItem(windowsKey(userId));
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as CreatorDepartureWindow[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  static async saveWindows(userId: string, windows: CreatorDepartureWindow[]): Promise<void> {
    await AsyncStorage.setItem(windowsKey(userId), JSON.stringify(windows));
  }

  static async addWindow(
    userId: string,
    window: Omit<CreatorDepartureWindow, 'id'>
  ): Promise<CreatorDepartureWindow[]> {
    const list = await this.loadWindows(userId);
    const next: CreatorDepartureWindow = {
      ...window,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      iata: window.iata.trim().toUpperCase(),
      city: window.city.trim(),
      notes: window.notes?.trim() || null,
    };
    const updated = [next, ...list];
    await this.saveWindows(userId, updated);
    return updated;
  }

  static async removeWindow(userId: string, windowId: string): Promise<CreatorDepartureWindow[]> {
    const updated = (await this.loadWindows(userId)).filter((w) => w.id !== windowId);
    await this.saveWindows(userId, updated);
    return updated;
  }
}
