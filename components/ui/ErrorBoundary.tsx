import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '../../theme';
import Button from './Button';
import Heading from './Heading';
import Text from './Text';

import { createSheet } from '../../theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Menangkap error render agar satu layar bermasalah tidak mematikan
 * seluruh aplikasi. Pengguna tetap bisa mencoba ulang tanpa menutup app.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) {
      console.error('[ErrorBoundary]', error);
    }
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.primary} name="alert-circle-outline" size={40} />
        </View>
        <Heading variant="h2" align="center" style={styles.title}>
          Terjadi kendala
        </Heading>
        <Text variant="body" color="secondary" align="center" style={styles.description}>
          Aplikasi mengalami gangguan sesaat. Silakan coba lagi — data Anda tetap aman.
        </Text>
        {__DEV__ ? (
          <Text variant="caption" color="secondary" align="center" style={styles.debug}>
            {error.message}
          </Text>
        ) : null}
        <View style={styles.action}>
          <Button onPress={this.handleRetry} title="Coba Lagi" />
        </View>
      </View>
    );
  }
}

const styles = createSheet((colors) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    borderRadius: radius.full,
    height: 88,
    justifyContent: 'center',
    marginBottom: spacing.base,
    width: 88,
  },
  title: {
    marginBottom: spacing.sm,
  },
  description: {
    maxWidth: 320,
  },
  debug: {
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  action: {
    marginTop: spacing.lg,
    minWidth: 200,
  },
}));
