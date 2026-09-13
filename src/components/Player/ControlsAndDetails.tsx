import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { usePlayerStore, Track } from '../../store/usePlayerStore';
import { MEDIA_URL } from '../../config/env';
import { MovingText } from '../MovingText';
import LinearGradient from 'react-native-linear-gradient';
import { SeekBar } from './SeekBar';

interface ControllsAndDetailsProps {
  track: Track;
  isPlaying: boolean;
  position: number;
  duration: number;
  colors: any;
  cached: number;
}

/** Formats seconds as m:ss, e.g. 125 -> "2:05" */
const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * ControllsAndDetails
 */
export const ControllsAndDetails: React.FC<ControllsAndDetailsProps> = ({
  track,
  isPlaying,
  position,
  duration,
  colors,
  cached
}) => {
  const play = usePlayerStore(s => s.play);
  const pause = usePlayerStore(s => s.pause);
  const skipToNext = usePlayerStore(s => s.skipToNext);
  const skipToPrevious = usePlayerStore(s => s.skipToPrevious);
  const updatePosition = usePlayerStore(s => s.updatePosition);

  const togglePlayback = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors, 'rgba(0,0,0,0.9)']} />
      <View style={styles.titleRow}>
        <View style={styles.titleTextWrapper}>
          <MovingText text={track.title} style={styles.title} />
          <Text style={styles.artist} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>

        <TouchableOpacity hitSlop={12} style={styles.likeButton}>
          <Icon name="heart-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Slider */}
      <View className="mb-5">
            <SeekBar position={position} duration={duration} cached={cached} />
            <View className="flex-row justify-between mt-2">
              <Text className="text-xs text-teal-300">
                {formatTime(position)}
              </Text>
              <Text className="text-xs text-red-300">
                {duration > 0 ? `-${formatTime(duration - position)}` : '--:--'}
              </Text>
            </View>
          </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity hitSlop={12}>
          <Icon name="shuffle" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <TouchableOpacity hitSlop={16} onPress={skipToPrevious}>
          <Icon name="play-skip-back" size={30} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={togglePlayback}
          style={styles.playButton}
          hitSlop={8}
        >
          <Icon name={isPlaying ? 'pause' : 'play'} size={30} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity hitSlop={16} onPress={skipToNext}>
          <Icon name="play-skip-forward" size={30} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity hitSlop={12}>
          <Icon name="repeat" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      <View style={styles.artistSection}>
        <Text style={styles.sectionLabel}>About the artist</Text>

        <View style={styles.artistCard}>
          <Image
            source={{ uri: `${MEDIA_URL}/${track.coverUrl}` }}
            style={styles.artistImage}
          />
          <View style={styles.artistInfoOverlay}>
            <Text style={styles.artistName}>{track.artist}</Text>
          </View>
        </View>

        <Text style={styles.artistDescription}>
          {/* TODO: replace with real artist bio / monthly listeners from your API */}
          No bio available yet for this artist.
        </Text>

        <TouchableOpacity style={styles.followButton}>
          <Text style={styles.followButtonText}>Follow</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    marginTop: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleTextWrapper: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  artist: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    marginTop: 4,
  },
  likeButton: {
    padding: 4,
  },

  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    paddingHorizontal: 4,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 66,
    marginBottom: 48,
  },
  artistSection: {
    paddingBottom: 40,
  },
  sectionLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  artistCard: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
  },
  artistImage: {
    width: '100%',
    height: '100%',
  },
  artistInfoOverlay: {
    position: 'absolute',
    left: 12,
    bottom: 12,
  },
  artistName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  artistDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
  followButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
