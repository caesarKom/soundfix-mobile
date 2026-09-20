import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MEDIA_URL } from '../config/env';
import { usePlayerStore } from '../store/usePlayerStore';
import { noSongImg } from '../utils/images';
import { 
  usePlaylistMetadataQuery, 
  useInfinitePlaylistSongsQuery, 
  useToggleFavoriteMutation 
} from '../hooks/useMusicQueries';
import { goBack } from '../navigation/NavigationUtils';
import { RenderTrackItem } from '../components/RenderTrackItem';


export const PlaylistScreen = ({route}: any ) => {
    const playlistId = route.params.playlistId;
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const playTrackById = usePlayerStore((s) => s.playTrackById);
  const setAllTracks = usePlayerStore((s) => s.setAllTracks);
  const appendTracks = usePlayerStore((s) => s.appendTracks);

  const { data: metadata, isLoading: isMetaLoading } = usePlaylistMetadataQuery(playlistId);
  const {
    data: songsData,
    isLoading: isSongsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching
  } = useInfinitePlaylistSongsQuery(playlistId);

  const { mutate: toggleFavorite } = useToggleFavoriteMutation();

  // Flattening data from all subpages
  const playlistTracks = useMemo(() => {
    if (!songsData || !songsData.pages) return [];
    return songsData.pages.flatMap((page) => page) || [];
  }, [songsData]);

  // AUTO-PLAY: Starts playback immediately after loading the first track pack.
  useEffect(() => {
    if (songsData && songsData.pages && songsData.pages.length === 1) {
      const firstPageSongs = songsData.pages[0];
      if (firstPageSongs && firstPageSongs.length > 0) {
        // initialize the playlist queue in the player
        setAllTracks(firstPageSongs)
          // automatically play the first song on the list
         // playTrackById(firstPageSongs[0].id);
      
      }
    } else if (songsData && songsData.pages && songsData.pages.length > 1) {
      // For subsequent pages read by scrolling, we only add the data
      const latestPage = songsData.pages[songsData.pages.length - 1];
      appendTracks(latestPage);
    }
  }, [songsData, setAllTracks, appendTracks]);

  if (isMetaLoading || isSongsLoading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-950 items-center justify-center">
        <ActivityIndicator size="large" color="#1DB954" />
      </SafeAreaView>
    );
  }

  // The list header contains a large cover of the playlist and its description.
  const ListHeader = (
    <View className="items-center pt-6 pb-6 px-4">
      <Image
        source={{
          uri: `${MEDIA_URL}/${metadata.coverUrl}` || noSongImg,
        }}
        className="w-48 h-48 rounded-lg shadow-xl bg-neutral-900 mb-4"
        resizeMode="cover"
     
      />
      <Text className="text-white text-2xl font-bold text-center" numberOfLines={1}>
        {metadata?.name}
      </Text>
      <Text className="text-neutral-400 text-sm text-center mt-1" numberOfLines={2}>
        {metadata?.description || 'No playlist description'}
      </Text>
      <Text className="text-neutral-500 text-xs mt-2">
        Tracks: {metadata?._count?.songs || playlistTracks.length}
      </Text>
    </View>
  );


  return (
    <SafeAreaView className="flex-1 bg-neutral-950">
      {/* Back navigation bar */}
      <View className="flex-row items-center px-4 py-2 border-b border-neutral-900">
        <TouchableOpacity onPress={() => goBack()} className="p-1">
          <Icon name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-bold ml-4 text-lg">Playlista</Text>
      </View>

      <FlatList
        data={playlistTracks}
        renderItem={({ item }) => <RenderTrackItem item={item} playTrackById={playTrackById} toggleFavorite={toggleFavorite} currentTrack={currentTrack} />}
        keyExtractor={(item) => `playlist-track-${item.id}`}
        contentContainerStyle={{ paddingBottom: 150 }}
        ListHeaderComponent={ListHeader}
        refreshing={isRefetching}
        onRefresh={refetch}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.2}
        initialNumToRender={20}
        removeClippedSubviews={true}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4"><ActivityIndicator size="small" color="#1DB954" /></View>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
};