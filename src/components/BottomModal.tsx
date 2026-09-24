// apps/soundfix/components/CustomBottomSheet.tsx
import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  Animated, 
  Dimensions, 
  PanResponder, 
  TouchableWithoutFeedback,
  StatusBar,
  Platform,
  NativeModules
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CustomBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  H?: number; // Optional height (default full screen)
}

export const BottomModal = ({ visible, onClose, children, H }: CustomBottomSheetProps) => {
  const insets = useSafeAreaInsets();
  
  const MODAL_HEIGHT = H || SCREEN_HEIGHT;
  
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const openAnim = Animated.parallel([
    Animated.timing(translateY, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }),
    Animated.timing(opacity, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    })
  ]);

  const closeAnim = Animated.parallel([
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }),
    Animated.timing(opacity, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    })
  ]);

  useEffect(() => {
    if (visible) {
      openAnim.start();

      if (Platform.OS === 'android') {
        const UIManager = NativeModules.UIManager;
        // Za pomocą natywnego wywołania usuwamy wymuszenie koloru tła (translucent overlay fix)
        if (NativeModules.StatusBarManager && NativeModules.StatusBarManager.setColor) {
          // Upewniamy się, że okno traktuje dolny pasek jako overlay (pod spodem)
          NativeModules.StatusBarManager.setStyle('light-content');
        }
      }
    }
    
  }, [openAnim, visible]);

  const handleClose = () => {
    closeAnim.start(() => onClose());
  };


  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10, 
      onPanResponderMove: Animated.event([null, { dy: translateY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        // If pulled down by more than 150px or at high vertical speed (vy)
        if (gestureState.dy > 150 || gestureState.vy > 0.5) {
          closeAnim.start(() => onClose());
        } else {
          openAnim.start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
      navigationBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
  
      <Animated.View style={[styles.overlay, { opacity }]}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Modal container extended by transform: translateY rigid from bottom: 0 */}
      <Animated.View
        style={[
          styles.container,
          {
            height: MODAL_HEIGHT,
            transform: [{ translateY }],

            paddingTop: H ? 12 : insets.top,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
          },
        ]}
        className="bg-neutral-900 border-t border-neutral-800"
      >
        {/* Separated area of ​​the stroke gesture bar */}
        <View {...panResponder.panHandlers} style={styles.grabberArea}>
          <View style={styles.grabber} />
        </View>

        <View style={{ flex: 1 }}>
          {children}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  grabberArea: {
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
  },
});
