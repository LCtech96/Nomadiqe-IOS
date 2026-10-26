/**
 * Navigation ref for deep link routing from outside the component tree
 */

import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToPropertyGuide(propertyId: string, token?: string): void {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Main',
      params: {
        screen: 'ProfileTab',
        params: {
          screen: 'PropertyGuide',
          params: { propertyId, token, readOnly: true },
        },
      },
    })
  );
}
