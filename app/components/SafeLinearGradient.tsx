import React from 'react';
import { View, ViewProps, UIManager, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = ViewProps & {
  colors?: string[];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export default function SafeLinearGradient({ colors = ['#000'], style, children, ...rest }: Props) {
  let hasViewManager = false;
  try {
    // UIManager may not expose getViewManagerConfig on some platforms
    // or the view manager may not be registered in the native binary.
    if (UIManager && typeof (UIManager as any).getViewManagerConfig === 'function') {
      hasViewManager = !!(UIManager as any).getViewManagerConfig('ExpoLinearGradient');
    }
  } catch (e) {
    hasViewManager = false;
  }

  if (hasViewManager) {
    return (
      // Render the real native-backed gradient when available
      <LinearGradient colors={colors} style={style} {...rest}>
        {children}
      </LinearGradient>
    );
  }

  // Fallback: simple View using the first color as background to avoid runtime errors
  return (
    <View style={[{ backgroundColor: colors[0] || '#000' }, style]} {...rest}>
      {children}
    </View>
  );
}
