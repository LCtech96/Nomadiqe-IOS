/**
 * BioText
 * Mostra la bio: link cliccabili solo se approvati dall'admin (bio_links_approved)
 */

import React from 'react';
import { Text, StyleSheet, Linking } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { theme } from '../../theme';
import { containsLink, parseBioWithLinks } from '../../utils/bio';

interface BioTextProps {
  bio: string | null | undefined;
  bioLinksApproved?: boolean | null;
  style?: any;
  numberOfLines?: number;
}

export function BioText({ bio, bioLinksApproved, style, numberOfLines }: BioTextProps) {
  const { isDark } = useTheme();
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;

  if (!bio || !bio.trim()) return null;

  const showLinks = bioLinksApproved === true && containsLink(bio);
  const segments = showLinks ? parseBioWithLinks(bio) : [{ type: 'text' as const, value: bio }];

  if (segments.length === 1 && segments[0].type === 'text') {
    return (
      <Text style={[styles.text, { color: textColor }, style]} numberOfLines={numberOfLines}>
        {segments[0].value}
      </Text>
    );
  }

  return (
    <Text style={[styles.text, { color: textColor }, style]} numberOfLines={numberOfLines}>
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <Text key={i}>{seg.value}</Text>
        ) : (
          <Text
            key={i}
            style={[styles.link, { color: theme.colors.primary.blue }]}
            onPress={() => Linking.openURL(seg.value)}
          >
            {seg.value}
          </Text>
        )
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { ...theme.typography.body },
  link: { ...theme.typography.body, textDecorationLine: 'underline' },
});
