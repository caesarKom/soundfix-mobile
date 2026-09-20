import { View, Text, TouchableOpacity, Image, ActivityIndicator, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MEDIA_URL } from '../config/env';
import { usePlayerStore } from '../store/usePlayerStore';
import { Heart, noSongImg } from '../utils/images';
import { usePlaylistsQuery, useInfiniteMusicQuery, useToggleFavoriteMutation } from '../hooks/useMusicQueries';
import HeaderWithAvatarDrawer from '../components/HeaderWithAvatarDrawer';
import { useEffect, useMemo } from 'react';
import { navigate } from '../navigation/NavigationUtils';
import { RenderTrackItem } from '../components/RenderTrackItem';
import DotLoading from '../components/DotLoading';

export const HomeScreen = () => {
 const { playTrackById, setAllTracks, appendTracks, currentTrack } = usePlayerStore()

  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteMusicQuery()
  const { data: playlistsData } = usePlaylistsQuery();

   const allTracks = useMemo(() => {
    if (!data || !data.pages) return [];
    return data.pages.flatMap((page) => page) || [];
  }, [data]);

   useEffect(() => {
    if (!data || !data.pages || data.pages.length === 0) return;

    const pageCount = data.pages.length;
    const latestPage = data.pages[pageCount - 1];

    if (pageCount === 1) {
      // First page: initialize the entire list and player from scratch
      setAllTracks(latestPage);
    } else {
      // Next pages: just add new elements at the end, without resetting the player!
      appendTracks(latestPage);
    }
  }, [data, setAllTracks, appendTracks]);

  const { mutate: toggleFavorite } = useToggleFavoriteMutation() 

  if (isLoading && allTracks.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-950 items-center justify-center">
        <ActivityIndicator size="large" color="#1DB954" />
        <Text className="text-white mt-4">Loading music...</Text>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-950 items-center justify-center">
        <Text className="text-red-500 mb-4">Failed to load music</Text>
        <TouchableOpacity onPress={() => refetch()} className="bg-neutral-800 px-4 py-2 rounded-lg">
          <Text className="text-white">Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const ListHeader =  (
    <View className="mt-4">
      <TouchableOpacity className="mr-4 w-36" activeOpacity={0.7} onPress={() => navigate('Favorite')}>
                <Image
                  source={{ uri: Heart }}
                  className="w-36 h-36 rounded-md mb-2 bg-neutral-900"
                  resizeMode="cover"
                />
                <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                  Favorite
                </Text>
                <Text className="text-neutral-400 text-xs" numberOfLines={1}>
                  Your favorite playlist
                </Text>
              </TouchableOpacity>
      
      {/* Featured Playlists */}
      {Array.isArray(playlistsData) && playlistsData.length > 0 && (
        <View className="mb-6">
          <Text className="text-white text-xl font-bold mb-3">Featured Playlists</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={playlistsData}
            keyExtractor={(item) => item.id}
            renderItem={({ item: playlist }) => (
              <TouchableOpacity className="mr-4 w-36" activeOpacity={0.7} onPress={() => navigate('Playlist',{playlistId: playlist.id})}>
                <Image
                  source={{
                    uri: playlist.coverUrl ? `${MEDIA_URL}/${playlist.coverUrl}` : noSongImg,
                  }}
                  className="w-36 h-36 rounded-md mb-2 bg-neutral-900"
                  resizeMode="cover"
                />
                <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                  {playlist.name}
                </Text>
                <Text className="text-neutral-400 text-xs" numberOfLines={1}>
                  {playlist.description || 'Playlist'}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Trending Section */}
      <View className="mb-6">
        <Text className="text-white text-xl font-bold mb-3">Trending Right Now</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={Array.isArray(allTracks) ? allTracks.slice(0, 10) : []} // Limit do top 10 na ekranie głównym
          keyExtractor={(item) => `trending-${item.id}`}
          renderItem={({ item: track }) => (
            <TouchableOpacity
              onPress={() => playTrackById(track.id)}
              className="mr-4 w-36"
              activeOpacity={0.7}
            >
              <View className="relative">
                <Image
                  source={{
                    uri: track.coverUrl ? `${MEDIA_URL}/${track.coverUrl}` : noSongImg,
                  }}
                  className="w-36 h-36 rounded-md mb-2 bg-neutral-900"
                  resizeMode="cover"
                />
                {track.mimeType?.startsWith('video/') && (
                  <View className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded flex-row items-center">
                    <Icon name="videocam" size={12} color="#1DB954" />
                  </View>
                )}
              </View>
              <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                {track.title}
              </Text>
              <Text className="text-neutral-400 text-xs" numberOfLines={1}>
                {track.artist}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

       <View className="mb-6 mt-4 flex items-center justify-center">
          <Text className="text-white text-xl font-bold mb-3">All Musics</Text>
          </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-neutral-950">
      <HeaderWithAvatarDrawer />
      
      <FlatList
        data={Array.isArray(allTracks) ? allTracks : []}
        renderItem={({item}) => <RenderTrackItem item={item} playTrackById={playTrackById} currentTrack={currentTrack} toggleFavorite={toggleFavorite} />}
        keyExtractor={(item) => item.id}

        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 }}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={
          isFetchingNextPage ? (
        <View className="py-4 justify-center items-center">
          <DotLoading />
        </View>
      ) : undefined
        }
        refreshing={isRefetching}
        onRefresh={refetch}
        // Triggering data reloading when the user scrolls the list to 80% of its height
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
        // Optimization parameters for large data sets (100+ tracks):
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
};