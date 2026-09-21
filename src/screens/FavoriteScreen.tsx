import { View, Text, TouchableOpacity, Image, FlatList } from 'react-native';
import React, { useEffect } from 'react';
import Icon from '../components/Icon';
import { goBack } from '../navigation/NavigationUtils';
import {
  useFavoritesMusicsQuery,
  useToggleFavoriteMutation,
} from '../hooks/useMusicQueries';
import { usePlayerStore } from '../store/usePlayerStore';
import { Heart } from '../utils/images';
import DotLoading from '../components/DotLoading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RenderTrackItem } from '../components/RenderTrackItem';

const FavoriteScreen = () => {
  const {
    data: favoriteMusics,
    isLoading: isDataMusicLoading,
    isRefetching,
    refetch,
    isError,
  } = useFavoritesMusicsQuery();
  const { mutate: toggleFavorite } = useToggleFavoriteMutation();
  const { setAllTracks, currentTrack, playTrackById } = usePlayerStore();

  useEffect(() => {
    if (!isDataMusicLoading) {
        setAllTracks(favoriteMusics)
    }
  }, [setAllTracks, isDataMusicLoading, favoriteMusics])

  if (isDataMusicLoading) {
    return (
      <View className="flex-1 bg-neutral-950 items-center justify-center">
        <DotLoading />
      </View>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-950 items-center justify-center">
        <Text className="text-red-500 mb-4">Failed to load music</Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="bg-neutral-800 px-4 py-2 rounded-lg"
        >
          <Text className="text-white">Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const ListHeader = (
    <View className="items-center pt-2 pb-6 px-4">
      <View className="w-44 h-44 rounded-2xl shadow-2xl bg-neutral-900 mb-5 overflow-hidden items-center justify-center border border-neutral-800/60">
        <View className="w-full h-full items-center justify-center bg-zinc-900">
          <Image
            source={{ uri: Heart }}
            className="w-full h-full animate-pulse"
            resizeMode="cover"
          />
        </View>
      </View>

      <View className="flex-row items-center mt-1 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800/50">
        <Icon
          iconFamily="Ionicons"
          name="heart-dislike-outline"
          size={14}
          color="#1DB954"
        />
        <Text className="text-neutral-400 text-xs font-bold ml-1.5">
          {favoriteMusics?._count?.songs || favoriteMusics?.length} Tracks
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-neutral-900">
      {/* Swipe Down Bar (UX Signal for Modal) */}
      <View className="items-center py-3">
        <View className="w-12 h-1 rounded-full bg-neutral-500/50" />
      </View>

      {/* Top navigation bar */}
      <View className="flex-row items-center justify-between px-5 py-2 border-b border-neutral-900/40">
        <Text className="text-white font-bold text-xl tracking-tight ml-10">
          Collection Favorite musics
        </Text>
        <TouchableOpacity
          onPress={() => goBack()}
          className="w-8 h-8 rounded-full bg-neutral-900 items-center justify-center border border-neutral-800"
          activeOpacity={0.7}
        >
          <Icon iconFamily="Ionicons" name="close" size={18} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={favoriteMusics}
        renderItem={({ item }) => (
          <RenderTrackItem
            item={item}
            toggleFavorite={toggleFavorite}
            playTrackById={playTrackById}
            currentTrack={currentTrack}
          />
        )}
        keyExtractor={item => `favorites-${item.id}`}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        onEndReachedThreshold={0.3}
      />
    </View>
  );
};

export default FavoriteScreen;
