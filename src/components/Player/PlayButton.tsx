import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useIsPlaying } from '@rntp/player';

type Props = { size?: number };

export const PlayButton = ({ size = 32 }: Props) => {
  const { pause, play } = usePlayerStore();
  const isPlaying = useIsPlaying();

  const togglePlayback = async () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <Pressable onPress={togglePlayback} style={styles.btn}>
      <Icon
        name={isPlaying ? 'pause' : 'play-arrow'}
        size={size}
        color="#fff"
      />
    </Pressable>
  );
};
const styles = StyleSheet.create({ btn: { padding: 8 } });
