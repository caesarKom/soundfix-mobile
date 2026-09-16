import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStorage } from './storage';
import TrackPlayer from '@rntp/player';
import { api } from '../services/api';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  url: string;
  coverUrl?: string;
  mimeType?: string;
}

interface MediaItem {
  mediaId: string;
  url: string;
  title?: string;
  artist?: string;
  albumTitle?: string;
  artworkUrl?: string;
  duration?: number;
  mimeType?: string;
}

const convertTrackToCleanMedia = (track: Track): MediaItem => ({
  mediaId: track.id,
  title: track.title,
  artist: track.artist,
  albumTitle: track.album,
  duration: track.duration,
  url: track.url || 'file:///dev/null',
  artworkUrl: track.coverUrl,
  mimeType: track.mimeType,
});

interface PlayerState {
  currentTrack: Track | null;
  allTracks: Track[];

  getSecuredUrl: (trackId: string) => Promise<string>;
  getCurrentTrackUrl: () => Promise<string>;

  // Actions
  setAllTracks: (tracks: Track[]) => void;
  playTrackById: (trackId: string) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;

  syncCurrentTrackWithNative: () => void;
  resetPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      allTracks: [],

      getSecuredUrl: async (trackId: string): Promise<string> => {
        try {
          const response = await api.get(`/auth/media-token`, {
            params: { mediaId: trackId },
          });
          const mediaToken = response.data.token;
          const baseUrl = api.defaults.baseURL || '';
          return `${baseUrl}/music/stream/${trackId}?token=${mediaToken}`;
        } catch (error) {
          console.error(
            `Failed to retrieve secure token for track ${trackId}:`,
            error,
          );
          throw error;
        }
      },

      getCurrentTrackUrl: async (): Promise<string> => {
        const { currentTrack, getSecuredUrl } = get();
        if (!currentTrack) return '';
        try {
          return await getSecuredUrl(currentTrack.id);
        } catch {
          return '';
        }
      },

      setAllTracks: (tracks: Track[]) => {
        TrackPlayer.clear();
        set({ allTracks: tracks });
        TrackPlayer.setMediaItems(
          tracks.map(track => convertTrackToCleanMedia(track)),
        );
        set({ currentTrack: tracks[0] });
      },

      // CLICK ON A SONG FROM THE LIST -> DOWNLOAD ON THE FLY AND START
      playTrackById: async (trackId: string) => {
        const { allTracks, getSecuredUrl } = get();
        const trackIndex = allTracks.findIndex(t => t.id === trackId);
        if (trackIndex < 0) return;

        const track = allTracks[trackIndex];

        TrackPlayer.skipToIndex(trackIndex);

        try {
          const signedUrl = await getSecuredUrl(track.id);
          const updatedItem = convertTrackToCleanMedia(track);
          updatedItem.url = signedUrl;

          // Without this, the native queue keeps whatever placeholder URL was set
          // in setAllTracks, and playback would fail or use a stale token.
          TrackPlayer.replaceMediaItem(trackIndex, updatedItem);

          set({ currentTrack: track });
          TrackPlayer.play();
        } catch (error) {
          console.error(`Failed to start track ${trackId}:`, error);
        }
      },

      play: async () => {
        const { currentTrack, getSecuredUrl, allTracks } = get();
        if (!currentTrack) return;
          
          const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
          if (currentIndex < 0) return;

          try {
            const signedUrl = await getSecuredUrl(currentTrack.id);
            
            const cleanMediaItems = allTracks.map((track, index) => {
              const mediaItem = convertTrackToCleanMedia(track);
              if (index === currentIndex) {
                mediaItem.url = signedUrl;
              }
              return mediaItem;
            });
            TrackPlayer.setMediaItems(cleanMediaItems);
            // jump to the appropriate index and run it
            TrackPlayer.skipToIndex(currentIndex);

            TrackPlayer.play();
            
          } catch (error) {
            console.error(`Failed to start current track:`, error);
          }
        
      },

      pause: async () => {
        TrackPlayer.pause();
      },

      // (NEXT TRACK)
      skipToNext: async () => {
        const { allTracks, getSecuredUrl } = get();
        const currentIndex = TrackPlayer.getActiveMediaItemIndex();

        if (currentIndex !== null && currentIndex < allTracks.length - 1) {
          const nextIndex = currentIndex + 1;
          const nextTrack = allTracks[nextIndex];

          try {
            const signedUrl = await getSecuredUrl(nextTrack.id);
            const mediaItem = convertTrackToCleanMedia(nextTrack);
            mediaItem.url = signedUrl;

            set({ currentTrack: nextTrack });

            TrackPlayer.replaceMediaItem(nextIndex, mediaItem);
            TrackPlayer.setMediaItems(TrackPlayer.getQueue(), nextIndex);

            TrackPlayer.play();
          } catch (error) {
            console.error('Błąd przejścia do następnego utworu:', error);
          }
        }
      },

      // (PREVIOUS TRACK)
      skipToPrevious: async () => {
        const { allTracks, getSecuredUrl } = get();
        const currentIndex = TrackPlayer.getActiveMediaItemIndex();

        if (currentIndex !== null && currentIndex > 0) {
          const prevIndex = currentIndex - 1;
          const prevTrack = allTracks[prevIndex];

          try {
            const signedUrl = await getSecuredUrl(prevTrack.id);
            const mediaItem = convertTrackToCleanMedia(prevTrack);
            mediaItem.url = signedUrl;

            set({ currentTrack: prevTrack });

            TrackPlayer.replaceMediaItem(prevIndex, mediaItem);
            TrackPlayer.setMediaItems(TrackPlayer.getQueue(), prevIndex);

            TrackPlayer.play();

          } catch (error) {
            console.error(error);
          }
        }
      },

      syncCurrentTrackWithNative: () => {
        const activeIndex = TrackPlayer.getActiveMediaItemIndex();
        const { allTracks } = get();
        if (activeIndex !== null && allTracks[activeIndex]) {
          set({ currentTrack: allTracks[activeIndex] });
        }
      },

      resetPlayer: () => {
        TrackPlayer.clear();
        set({
          currentTrack: null,
          allTracks: [],
        });
      },
    }),
    {
      name: 'player-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
