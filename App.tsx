import './global.css';

import { StatusBar, StatusBarProps, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import RootNavigator from './src/navigation/RootNavigator';
import { queryClient } from './queryClient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useEffect, useState } from 'react';
import TrackPlayer from '@rntp/player';
import { Colors } from './src/utils/constants';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const isDarkMode = useColorScheme() === 'light';

useEffect(() => {
    async function startPlayer() {
      try {
         TrackPlayer.setupPlayer({
          contentType: 'music',
          cache: {},
          android: { wakeMode: 'network' },
        });
        setIsReady(true);
      } catch (error) {
        if ((error as Error).message?.includes('already set up')) {
          setIsReady(true);
        } else {
          console.error('Failed to setup player:', error);
        }
      }
    }
    startPlayer();
  }, []);

  if (!isReady) return null;

  return (
    <SafeAreaProvider>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          {...({ backgroundColor: Colors.background } as StatusBarProps)}
        />
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootNavigator />
          <Toast visibilityTime={6000} position="top" topOffset={60} />
        </GestureHandlerRootView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
