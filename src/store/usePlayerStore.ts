import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStorage } from './storage';
import TrackPlayer, { MediaItem } from '@rntp/player';
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

const getBaseStreamUrl = (trackId: string): string => {
  const baseUrl = api.defaults.baseURL;
  return `${baseUrl}/music/stream/${trackId}`;
};

const convertTrackToCleanMedia = (track: Track): MediaItem => ({
  mediaId: track.id,
  title: track.title,
  artist: track.artist,
  albumTitle: track.album,
  duration: track.duration,
  url: getBaseStreamUrl(track.id),
  artworkUrl: track.coverUrl,
  mimeType: track.mimeType,
});

interface PlayerState {
  currentTrack: Track | null;
  allTracks: Track[];

  getSecuredUrl: (trackId: string) => Promise<string>;
  getCurrentTrackUrl: () => Promise<string>;
  prepareNextTrackToken: (currentIndex: number) => Promise<void>;

  // Actions
  setAllTracks: (tracks: Track[]) => void;
  appendTracks: (newTracks: Track[]) => Promise<void>;
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

      prepareNextTrackToken: async (currentIndex: number) => {
        const { allTracks, getSecuredUrl } = get();
        const nextIndex = currentIndex + 1;
        if (nextIndex < allTracks.length) {
          try {
            const nextTrack = allTracks[nextIndex];
            const signedUrl = await getSecuredUrl(nextTrack.id);
            const mediaItem = convertTrackToCleanMedia(nextTrack);
            mediaItem.url = signedUrl;
            
            TrackPlayer.replaceMediaItem(nextIndex, mediaItem);
            console.log(`[Player] Prefetched token for next track: ${nextTrack.title}`);
          } catch (err) {
            console.error('[Player] Failed to prefetch next track token', err);
          }
        }
      },

      setAllTracks: async (tracks: Track[]) => {
        if (!tracks || tracks.length === 0) return;
        set({ allTracks: tracks });
        TrackPlayer.clear();
        
        const mediaItems = tracks.map(track => convertTrackToCleanMedia(track));
        
        try {
          const firstTrackToken = await get().getSecuredUrl(tracks[0].id);
          mediaItems[0].url = firstTrackToken;
        } catch (e) {
          console.error('[Player] Could not sign initial track token', e);
        }

        TrackPlayer.setMediaItems(mediaItems);
          set({ currentTrack: tracks[0] });
          // Prefetch for the second song on the list
          await get().prepareNextTrackToken(0);
        
      },

      appendTracks: async (newTracks: Track[]) => {
        const { allTracks } = get();
        
        // Filtrujemy utwory, aby upewnić się, że nie dodajemy duplikatów do stanu
        const uniqueNewTracks = newTracks.filter(
          nt => !allTracks.some(at => at.id === nt.id)
        );
        
        if (uniqueNewTracks.length === 0) return;

        // Łączymy tablice w Zustandzie
        const updatedTracks = [...allTracks, ...uniqueNewTracks];
        set({ allTracks: updatedTracks });

        // Konwertujemy i bez czyszczenia kolejki (bez .clear()) dołączamy na koniec natywnego playera
        const newMediaItems = uniqueNewTracks.map(track => convertTrackToCleanMedia(track));
        TrackPlayer.addMediaItems(newMediaItems);
        console.log(`[Player] Dynamically appended ${uniqueNewTracks.length} tracks to native queue.`);
      },

       playTrackById: async (trackId: string) => {
        const { allTracks, getSecuredUrl, prepareNextTrackToken } = get();
        const trackIndex = allTracks.findIndex(t => t.id === trackId);
        if (trackIndex < 0) return;

        const track = allTracks[trackIndex];

        try {
          const signedUrl = await getSecuredUrl(track.id);
          const updatedItem = convertTrackToCleanMedia(track);
          updatedItem.url = signedUrl;

     
          TrackPlayer.replaceMediaItem(trackIndex, updatedItem);
          TrackPlayer.skipToIndex(trackIndex);
          
          set({ currentTrack: track });
          TrackPlayer.play();

    
          await prepareNextTrackToken(trackIndex);
        } catch (error) {
          console.error(`Failed to start track ${trackId}:`, error);
        }
      },

       play: async () => {
        const { currentTrack, getSecuredUrl, allTracks, prepareNextTrackToken } = get();
        if (!currentTrack) return;
          
        const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
        if (currentIndex < 0) return;

        const activeIndex = TrackPlayer.getActiveMediaItemIndex();
        if (activeIndex === currentIndex) {
          TrackPlayer.play()
          return
        }

        try {
          const signedUrl = await getSecuredUrl(currentTrack.id);
          const mediaItem = convertTrackToCleanMedia(currentTrack);
          mediaItem.url = signedUrl;

          TrackPlayer.replaceMediaItem(currentIndex, mediaItem);
          TrackPlayer.skipToIndex(currentIndex);
          TrackPlayer.play();

          await prepareNextTrackToken(currentIndex);
        } catch (error) {
          console.error(`Failed to start current track:`, error);
        }
      },

      pause: async () => {
        TrackPlayer.pause();
      },

     skipToNext: async () => {
        const { allTracks, getSecuredUrl, prepareNextTrackToken } = get();
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
            TrackPlayer.skipToIndex(nextIndex);
            TrackPlayer.play();

    
            await prepareNextTrackToken(nextIndex);
          } catch (error) {
            console.error('Error shifting to next track:', error);
          }
        }
      },

      skipToPrevious: async () => {
        const { allTracks, getSecuredUrl, prepareNextTrackToken } = get();
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
            TrackPlayer.skipToIndex(prevIndex);
            TrackPlayer.play();

            await prepareNextTrackToken(prevIndex);
          } catch (error) {
            console.error('Error shifting to previous track:', error);
          }
        }
      },

      syncCurrentTrackWithNative: async () => {
        const activeIndex = TrackPlayer.getActiveMediaItemIndex();
        const { allTracks, getSecuredUrl, prepareNextTrackToken } = get();
        if (activeIndex !== null && allTracks[activeIndex]) {
          const nextTrack = allTracks[activeIndex];
          set({ currentTrack: nextTrack });
          
          // Fuse: If the system jumped itself and the track does not yet have a token assigned in the URL
          const nativeQueue = TrackPlayer.getQueue();
          const activeNativeItem = nativeQueue[activeIndex];
          const currentUrl = activeNativeItem && typeof activeNativeItem.url === 'string' ? activeNativeItem.url : '';
          
          if (!currentUrl || !currentUrl.includes('token=')) {
            try {
              const signedUrl = await getSecuredUrl(nextTrack.id);
              const mediaItem = convertTrackToCleanMedia(nextTrack);
              mediaItem.url = signedUrl;
              TrackPlayer.replaceMediaItem(activeIndex, mediaItem);
            } catch (e) {
              console.error('[Player Sync] Dynamic emergency sign failed', e);
            }
          }
          
          // Preparing a token for the next song (X+1)
          await prepareNextTrackToken(activeIndex);
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
