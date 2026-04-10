/**
 * Livello Advanced per host: può pubblicare sulla Home come gli altri ruoli qualificati
 * (oltre a creator/jolly) dopo aver invitato almeno N host e raggiunto i punti minimi.
 */
export const HOST_ADVANCED_MIN_INVITED_HOSTS = 5;
export const HOST_ADVANCED_MIN_POINTS = 2500;

export function isHostAdvanced(invitedHostCount: number, points: number): boolean {
  return invitedHostCount >= HOST_ADVANCED_MIN_INVITED_HOSTS && points >= HOST_ADVANCED_MIN_POINTS;
}
