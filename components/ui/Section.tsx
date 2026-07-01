import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { layoutSpacing } from '../../theme';
import Heading from './Heading';
import Row from './Row';
import Squiggle from './Squiggle';
import Text from './Text';

export interface SectionProps {
  /** Kicker kecil uppercase di atas judul (mis. "BELAJAR"). */
  kicker?: string;
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

/** Header section ceria: kicker + judul Fredoka + squiggle gestural. */
export default function Section({ kicker, title, action, children, gap = layoutSpacing.stackGap, style }: SectionProps) {
  return (
    <View style={[{ gap }, style]}>
      {title ? (
        <Row justify="space-between" align="flex-end">
          <View style={styles.titleBlock}>
            {kicker ? (
              <Text variant="kicker" color="primary">
                {kicker}
              </Text>
            ) : null}
            <Heading variant="title">{title}</Heading>
            <Squiggle style={styles.squiggle} width={64} />
          </View>
          {action ? <View style={styles.action}>{action}</View> : null}
        </Row>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  squiggle: {
    marginTop: 2,
  },
  action: {
    paddingBottom: 6,
  },
});
