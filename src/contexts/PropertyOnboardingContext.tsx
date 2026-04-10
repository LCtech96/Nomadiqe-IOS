/**
 * Property Onboarding Context
 * Stato del wizard per nuova struttura host (8 step)
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { StructureTypeKey } from '../constants/propertyOnboarding';
import type { AmenityKey } from '../constants/propertyOnboarding';

export type CollaborationMode = 'approve_first_5' | 'instant';
export type FirstGuestType = 'any_creator' | 'verified_creator';
export type KolbedProgram = 'kolbed_100' | 'gigo_50' | 'paid_collab';

export interface PropertyOnboardingState {
  step: number;
  propertyId: string | null;
  structureType: StructureTypeKey | null;
  propertyTitle: string;
  city: string;
  country: string;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: AmenityKey[];
  images: string[];
  coverIndex: number;
  collaborationMode: CollaborationMode | null;
  whoToHost: FirstGuestType | null;
  basePriceWeekday: number;
  weekendSupplementPercent: number;
  kolbedProgram: KolbedProgram | null;
  paidCollabMin: number | null;
  paidCollabMax: number | null;
}

const initialState: PropertyOnboardingState = {
  step: 1,
  propertyId: null,
  structureType: null,
  propertyTitle: '',
  city: '',
  country: 'IT',
  guests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  amenities: [],
  images: [],
  coverIndex: 0,
  collaborationMode: null,
  whoToHost: null,
  basePriceWeekday: 0,
  weekendSupplementPercent: 0,
  kolbedProgram: null,
  paidCollabMin: null,
  paidCollabMax: null,
};

type PropertyOnboardingContextType = {
  state: PropertyOnboardingState;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStructureType: (type: StructureTypeKey | null) => void;
  setPropertyTitle: (title: string) => void;
  setLocation: (city: string, country: string) => void;
  setBasicInfo: (data: { guests?: number; bedrooms?: number; beds?: number; bathrooms?: number }) => void;
  setWeekendSupplementPercent: (percent: number) => void;
  toggleAmenity: (key: AmenityKey) => void;
  setImages: (urls: string[]) => void;
  setCoverIndex: (index: number) => void;
  setCollaborationMode: (mode: CollaborationMode | null) => void;
  setWhoToHost: (type: FirstGuestType | null) => void;
  setBasePriceWeekday: (value: number) => void;
  setKolbedProgram: (program: KolbedProgram | null) => void;
  setPaidCollabBudget: (min: number | null, max: number | null) => void;
  setPropertyId: (id: string | null) => void;
  reset: () => void;
};

const PropertyOnboardingContext = createContext<PropertyOnboardingContextType | undefined>(undefined);

export function PropertyOnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PropertyOnboardingState>(initialState);

  const setStep = useCallback((step: number) => {
    setState((s) => ({ ...s, step: Math.max(1, Math.min(8, step)) }));
  }, []);

  const nextStep = useCallback(() => {
    setState((s) => ({ ...s, step: Math.min(8, s.step + 1) }));
  }, []);

  const prevStep = useCallback(() => {
    setState((s) => ({ ...s, step: Math.max(1, s.step - 1) }));
  }, []);

  const setStructureType = useCallback((structureType: StructureTypeKey | null) => {
    setState((s) => ({ ...s, structureType }));
  }, []);

  const setPropertyTitle = useCallback((propertyTitle: string) => {
    setState((s) => ({ ...s, propertyTitle }));
  }, []);

  const setLocation = useCallback((city: string, country: string) => {
    setState((s) => ({ ...s, city, country }));
  }, []);

  const setWeekendSupplementPercent = useCallback((weekendSupplementPercent: number) => {
    setState((s) => ({ ...s, weekendSupplementPercent }));
  }, []);

  const setBasicInfo = useCallback(
    (data: { guests?: number; bedrooms?: number; beds?: number; bathrooms?: number }) => {
      setState((s) => ({
        ...s,
        ...(data.guests !== undefined && { guests: Math.max(1, data.guests) }),
        ...(data.bedrooms !== undefined && { bedrooms: Math.max(0, data.bedrooms) }),
        ...(data.beds !== undefined && { beds: Math.max(1, data.beds) }),
        ...(data.bathrooms !== undefined && { bathrooms: Math.max(1, data.bathrooms) }),
      }));
    },
    []
  );

  const toggleAmenity = useCallback((key: AmenityKey) => {
    setState((s) => ({
      ...s,
      amenities: s.amenities.includes(key) ? s.amenities.filter((a) => a !== key) : [...s.amenities, key],
    }));
  }, []);

  const setImages = useCallback((images: string[]) => {
    setState((s) => ({ ...s, images, coverIndex: Math.min(s.coverIndex, Math.max(0, images.length - 1)) }));
  }, []);

  const setCoverIndex = useCallback((coverIndex: number) => {
    setState((s) => ({ ...s, coverIndex }));
  }, []);

  const setCollaborationMode = useCallback((collaborationMode: CollaborationMode | null) => {
    setState((s) => ({ ...s, collaborationMode }));
  }, []);

  const setWhoToHost = useCallback((whoToHost: FirstGuestType | null) => {
    setState((s) => ({ ...s, whoToHost }));
  }, []);

  const setBasePriceWeekday = useCallback((basePriceWeekday: number) => {
    setState((s) => ({ ...s, basePriceWeekday }));
  }, []);

  const setKolbedProgram = useCallback((kolbedProgram: KolbedProgram | null) => {
    setState((s) => ({ ...s, kolbedProgram }));
  }, []);

  const setPaidCollabBudget = useCallback((paidCollabMin: number | null, paidCollabMax: number | null) => {
    setState((s) => ({ ...s, paidCollabMin, paidCollabMax }));
  }, []);

  const setPropertyId = useCallback((propertyId: string | null) => {
    setState((s) => ({ ...s, propertyId }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const value: PropertyOnboardingContextType = {
    state,
    setStep,
    nextStep,
    prevStep,
    setStructureType,
    setPropertyTitle,
    setLocation,
    setBasicInfo,
    setWeekendSupplementPercent,
    toggleAmenity,
    setImages,
    setCoverIndex,
    setCollaborationMode,
    setWhoToHost,
    setBasePriceWeekday,
    setKolbedProgram,
    setPaidCollabBudget,
    setPropertyId,
    reset,
  };

  return (
    <PropertyOnboardingContext.Provider value={value}>
      {children}
    </PropertyOnboardingContext.Provider>
  );
}

export function usePropertyOnboarding() {
  const ctx = useContext(PropertyOnboardingContext);
  if (ctx === undefined) throw new Error('usePropertyOnboarding must be used within PropertyOnboardingProvider');
  return ctx;
}
