import TrackPlayer from "@rntp/player";
import { useState } from "react";
import { Pressable, View } from "react-native";

export function SeekBar({
  position,
  duration,
  cached,
}: {
  position: number;
  duration: number;
  cached: number;
}) {
  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;
  const cachedProgress = duration > 0 ? Math.min(cached / duration, 1) : 0;
  const [barWidth, setBarWidth] = useState(0);

  return (
    <Pressable
      className="h-6 justify-center"
      onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
      onPress={e => {
        if (barWidth > 0 && duration > 0) {
          const seekTo = (e.nativeEvent.locationX / barWidth) * duration;
          TrackPlayer.seekTo(seekTo);
        }
      }}
    >
      <View style={{ height: 2, backgroundColor: '#999999', overflow: 'hidden'}}>
        {cachedProgress > 0 && (
          <View
            style={{ width: `${cachedProgress * 100}%`, position:'absolute', height: '100%', backgroundColor: 'green' }}
          />
        )}
        <View
          style={{ width: `${progress * 100}%`, height: '100%', backgroundColor:'rgba(134, 239, 172, 0.4)' }}
        />
      </View>
      <View
        className="absolute w-3 h-3 rounded-full bg-green-500 -ml-[7px]"
        style={{ left: `${progress * 100}%`, borderRadius: '50%' }}
      />
    </Pressable>
  );
}