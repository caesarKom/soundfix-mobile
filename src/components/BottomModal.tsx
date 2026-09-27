import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

interface Props {
  children: React.ReactNode;
  visible: boolean;
  onClose: () => void;
  H: number;
}

export const BottomModal = ({ children, visible, onClose, H }: Props) => {
  const insets = useSafeAreaInsets();

  const [mounted, setMounted] = useState(visible);

  const translateY = useSharedValue(H);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withTiming(0, { duration: 260 });
    } else {
      translateY.value = withTiming(H, { duration: 220 }, finished => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible, H, translateY]);

  const pan = Gesture.Pan()
    .onUpdate(event => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd(event => {
      if (event.translationY > 100 || event.velocityY > 800) {
        translateY.value = withTiming(H, { duration: 220 }, finished => {
          if (finished) runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      transparent
      animationType="none"
      visible={mounted}
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.overlay} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.modal,
              animatedStyle,
              {
                height: H,
                paddingBottom: insets.bottom > 0 ? insets.bottom : 0,
              },
            ]}
          >
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <LinearGradient
                style={StyleSheet.absoluteFill}
                colors={['#222', 'rgba(0,0,0,0.9)']}
              />
            </View>
            <GestureDetector gesture={pan}>
              <View style={styles.dragBar}>
                <View style={styles.bar} />
              </View>
            </GestureDetector>
            <View style={{ flex: 1 }}>{children}</View>
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    overflow: 'hidden',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#222',
  },
  dragBar: {
    paddingTop: 18,
    paddingBottom: 18,
    alignItems: 'center',
  },
  bar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444',
  },
});
