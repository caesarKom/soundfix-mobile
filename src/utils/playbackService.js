import TrackPlayer, { Event } from '@rntp/player';
import { usePlayerStore } from '../store/usePlayerStore';

export const playbackSession = () => {

  TrackPlayer.addEventListener(Event.MediaItemTransition, ({ item }) => {
    if (!item) return;
    //console.log('[V5 Session] Transition detected to item:', item.mediaId);
    usePlayerStore.getState().syncCurrentTrackWithNative();
  });


TrackPlayer.addEventListener(Event.PlaybackError, async ({ code, message }) => {
    const queue = TrackPlayer.getQueue();
    const currentIndex = TrackPlayer.getActiveMediaItemIndex();
    const currentItem = currentIndex !== null ? queue[currentIndex] : null;

    console.log("[V5 Session] Error Code:", code);
    console.log("[V5 Session] Error Message:", message);

    if (!currentItem) return;

    const currentUrl = typeof currentItem.url === 'string' ? currentItem.url : '';
    if (!currentUrl || !currentUrl.includes('token=')) {
      console.log('[V5 Session] Detected track without active token. Refreshing signed URL on-the-fly...');
      try {
        const store = usePlayerStore.getState();
        const signedUrl = await store.getSecuredUrl(currentItem.mediaId);
        
        // clone the object, inject a new URL and replace it in the native player
        const updatedItem = { ...currentItem, url: signedUrl };
        
        if (currentIndex !== null) {
          TrackPlayer.replaceMediaItem(currentIndex, updatedItem);
          TrackPlayer.play();
        }
      } catch (e) {
        console.error('[V5 Session] Failed to dynamically hot-fix token:', e);
      }
      return;
    }

    if (code === 'network' || message.toLowerCase().includes('source') || message.toLowerCase().includes('timeout')) {
      console.log('[V5 Session] Genuine network error on signed track. Retrying in 2 seconds...');
      setTimeout(() => {
        TrackPlayer.retry();
      }, 2000);
    }
  });
  
};

