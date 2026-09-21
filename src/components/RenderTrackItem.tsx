import { Image, Text, TouchableOpacity, View } from "react-native";
import Icon from 'react-native-vector-icons/Ionicons';
import { Track } from "../store/usePlayerStore";
import { MEDIA_URL } from "../config/env";
import { noSongImg } from "../utils/images";

interface Props {
    item: Track;
    playTrackById: (trackId: string) => void;
    currentTrack: Track | null;
    toggleFavorite: (trackId: string) => void;
}

export const RenderTrackItem = ({ item, currentTrack, playTrackById, toggleFavorite }: Props) => {
    const isSelected = currentTrack?.id === item.id;
    const isHeartActive = !!item.isLiked;
    return (
       <View className="flex-row items-center justify-between px-4 py-2 mb-1 bg-neutral-700/10 rounded-lg border border-neutral-600/20">
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.8}
        onPress={() => playTrackById(item.id)}
        className="flex-row items-center flex-1 mr-4"
      >
        <Image
          source={{
            uri: item.coverUrl ? `${MEDIA_URL}/${item.coverUrl}` : noSongImg,
          }}
          className="w-14 h-14 rounded-md bg-neutral-800 mr-3"
          resizeMode="cover"
        />
        <View className='flex-1'>
        <Text
          className={`text-sm font-semibold px-2 ${isSelected ? 'text-emerald-500' : 'text-white'}`}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text className="text-neutral-400 text-xs px-2" numberOfLines={1}>
                      {item.artist}
                    </Text>
                    </View>
      </TouchableOpacity>

      {/* Liked */}
      <TouchableOpacity 
        onPress={() => toggleFavorite(item.id)} 
        className="p-2" 
        activeOpacity={0.6}
      >
        <Icon 
          name={isHeartActive ? "heart" : "heart-outline"}
          size={22} 
          color={isHeartActive ? "#1DB954" : "#a3a3a3"} // green or grey
        />
      </TouchableOpacity>
      </View>
    );
  };