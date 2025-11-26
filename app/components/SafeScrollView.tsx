import React from 'react';
import { ScrollView, ScrollViewProps, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = ScrollViewProps & {
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export default function SafeScrollView({ contentContainerStyle, children, ...rest }: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 20);

  const mergedContentStyle = [
    { paddingBottom: bottomPad + 24 },
    contentContainerStyle,
  ];

  return (
    <ScrollView contentContainerStyle={mergedContentStyle} {...rest}>
      {children}
    </ScrollView>
  );
}
