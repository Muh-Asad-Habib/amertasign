import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Heading from '../ui/Heading';
import Row from '../ui/Row';
import Squiggle from '../ui/Squiggle';
import Text from '../ui/Text';

export interface DailyWordProps {
  word: string;
  description: string;
  category: string;
}

export default function DailyWord({ word, description, category }: DailyWordProps) {
  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.stripe} />
      <Row justify="space-between" align="center">
        <Text variant="kicker" color="primary">
          Kata Hari Ini
        </Text>
        <Badge size="sm" text={category} variant="accent" />
      </Row>
      <Heading variant="hero" numberOfLines={2} style={styles.word}>
        {word}
      </Heading>
      <Squiggle width={92} />
      <Text variant="body" color="secondary" style={styles.description}>
        {description}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    overflow: 'hidden',
    paddingLeft: spacing.lg,
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 7,
    backgroundColor: colors.accent,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  word: {
    marginTop: spacing.xs,
  },
  description: {
    marginTop: spacing.xs,
  },
});
