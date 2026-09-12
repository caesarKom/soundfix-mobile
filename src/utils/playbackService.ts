import TrackPlayer, { Event } from '@rntp/player';
import { usePlayerStore } from '../store/usePlayerStore';

export const playbackSession = () => {

  // Reaction to transition to a new song (Best time to sign the URL)
  TrackPlayer.addEventListener(Event.MediaItemTransition, async ({ item }) => {
    if (!item) return;

    try {
      const store = usePlayerStore.getState();
      const currentIndex = await TrackPlayer.getActiveMediaItemIndex();
      if (currentIndex === null) return;

      const currentTrack = store.allTracks[currentIndex];

      // download a fresh token from the backend exactly when the song starts
      const freshSignedUrl = await store.getSecuredUrl(currentTrack.id);

      // clone the song object so as not to mutate the Zustand state directly
      const updatedItem = {
        ...item,
        url: freshSignedUrl
      };

      // replace the currently loaded item in the native queue with a fresh address
      TrackPlayer.replaceMediaItem(currentIndex, updatedItem);
      
      // synchronize the UI state
      store.syncCurrentTrackWithNative();
      
      // force a replay with a fresh URL
      TrackPlayer.play();

    } catch (error) {
      console.error('Session error during live media signing:', error);
    }
  });

  // Song Progress Update
  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, ({ position, duration }) => {
    usePlayerStore.getState().updatePosition(position, duration);
  });


  TrackPlayer.addEventListener(Event.PlaybackError, async ({ code, message }) => {
    const queue = TrackPlayer.getQueue();
    const currentIndex = TrackPlayer.getActiveMediaItemIndex();
    const currentItem = currentIndex !== null ? queue[currentIndex] : null;

    if (!currentItem || !currentItem.url || currentItem.url === 'file:///dev/null') {
      console.log('[V5 Session] Blocked retry loop for unloaded or unsigned track.');
      return;
    }

    // If the token has expired or the network has lost the connection
    if (code === 'network' || message.toLowerCase().includes('source') || message.toLowerCase().includes('401') || message.toLowerCase().includes('403')) {
      console.log('[V5 Session] Triggering fresh token refresh due to error...');
      
      try {
        const store = usePlayerStore.getState();
        const currentTrack = store.allTracks[currentIndex!];
        
        // download an absolutely new token
        const newUrl = await store.getSecuredUrl(currentTrack.id);
        currentItem.url = newUrl;
        
        TrackPlayer.replaceMediaItem(currentIndex!, currentItem);
        
        setTimeout(async () => {
         TrackPlayer.retry();
         TrackPlayer.play();
        }, 1500);
      } catch (e) {
        console.error('[V5 Session] Failed to recover from network playback error:', e);
      }
    }
  });
};
