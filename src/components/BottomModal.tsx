import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
} from 'react-native';
import { screenHeight } from '../utils/constants';
import { useEffect, useRef } from 'react';

interface CustomBottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
}
const MODAL_HEIGHT = screenHeight * 0.74;

export const BottomModal = ({ visible, onDismiss, children }: CustomBottomSheetProps) => {
    const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
   const openAnim = Animated.parallel([
    Animated.timing(translateY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }),
    Animated.timing(fadeAnim, {
      toValue: 0.6, // Maximum background darkening (rgba 0.6)
      duration: 250,
      useNativeDriver: true,
    })
  ]);

  const closeAnim = Animated.parallel([
    Animated.timing(translateY, {
      toValue: MODAL_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }),
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    })
  ]);

  useEffect(() => {
    if (visible) {
      openAnim.start();
    } else {
      closeAnim.start();
    }
  }, [closeAnim, openAnim, visible]);

  const handleDismiss = () => {
    closeAnim.start(() => onDismiss());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5, 
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          closeAnim.start(() => onDismiss());
        } else {
          openAnim.start();
        }
      },
    })
  ).current;

    if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* FadeAnim controlled background fade */}
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <Animated.View 
          style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: fadeAnim }]} 
        />
      </TouchableWithoutFeedback>

      {/* Modal container extended by transform: translateY */}
      <Animated.View 
        style={[
          styles.container, 
          { transform: [{ translateY }] }
        ]} 
        {...panResponder.panHandlers}
        className="bg-neutral-900 border-t border-neutral-800"
      >

        <View className="w-12 h-1.5 bg-neutral-700 rounded-full my-3 self-center" />
        
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: MODAL_HEIGHT,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    paddingBottom: 24,
    overflow: 'hidden',
  },
});