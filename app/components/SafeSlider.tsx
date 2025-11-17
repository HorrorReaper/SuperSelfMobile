import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, UIManager, Platform } from 'react-native';
import NativeSlider from '@react-native-community/slider';

type Props = React.ComponentProps<typeof NativeSlider> & {
  style?: any;
};

export default function SafeSlider(props: Props) {
  const { value: propValue, minimumValue = 0, maximumValue = 1, step = 0.01, onValueChange } = props;
  const [hasNative, setHasNative] = useState<boolean>(false);
  const [value, setValue] = useState<number>(typeof propValue === 'number' ? propValue : minimumValue);

  useEffect(() => {
    let present = false;
    try {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        if (UIManager && typeof (UIManager as any).getViewManagerConfig === 'function') {
          present = !!(UIManager as any).getViewManagerConfig('RNCSlider');
        }
      }
    } catch (e) {
      present = false;
    }
    setHasNative(present);
  }, []);

  useEffect(() => {
    if (typeof propValue === 'number') setValue(propValue);
  }, [propValue]);

  const changeValue = (v: number) => {
    setValue(v);
    onValueChange && onValueChange(v);
  };

  if (hasNative) {
    return <NativeSlider {...props} />;
  }

  // Lightweight JS fallback slider
  const pct = ((value - (minimumValue as number)) / ((maximumValue as number) - (minimumValue as number))) * 100;

  return (
    <View style={[styles.container, props.style]}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: props.minimumTrackTintColor || '#4CAF50' }]} />
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => changeValue(Math.max(minimumValue as number, +(value - (step as number)).toFixed(2)))} style={styles.controlButton}>
          <Text style={styles.controlText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.valueText}>{value}</Text>
        <TouchableOpacity onPress={() => changeValue(Math.min(maximumValue as number, +(value + (step as number)).toFixed(2)))} style={styles.controlButton}>
          <Text style={styles.controlText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  track: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    marginHorizontal: 12,
  },
  controlText: { color: '#fff', fontSize: 18 },
  valueText: { color: '#fff', fontSize: 16, minWidth: 40, textAlign: 'center' },
});
