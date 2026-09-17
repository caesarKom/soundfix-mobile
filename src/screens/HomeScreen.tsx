import { View, Text, TouchableOpacity, Image, ActivityIndicator, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MEDIA_URL } from '../config/env';
import { Track, usePlayerStore } from '../store/usePlayerStore';
import { noSongImg } from '../utils/images';
import { usePlaylistsQuery, useInfiniteMusicQuery } from '../hooks/useMusicQueries';
import HeaderWithAvatarDrawer from '../components/HeaderWithAvatarDrawer';
import { useEffect, useMemo } from 'react';

export const HomeScreen = () => {
 const {currentTrack, playTrackById, setAllTracks, appendTracks} = usePlayerStore()

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

  console.log("HOME DATA : ", allTracks.length)

  if (isLoading) {
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

   // Komponent renderujący pojedynczy kafelek utworu (zoptymalizowany pod FlatList)
  const renderTrackItem = ({ item }: { item: Track }) => {
    const isSelected = currentTrack?.id === item.id;
    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.8}
        onPress={() => playTrackById(item.id)}
        className="w-[49%] h-14 bg-neutral-900/80 rounded-md flex-row items-center mb-2 overflow-hidden border border-neutral-800/50"
      >
        <Image
          source={{
            uri: item.coverUrl ? `${MEDIA_URL}/${item.coverUrl}` : noSongImg,
          }}
          className="w-14 h-14"
          resizeMode="cover"
        />
        <Text
          className={`flex-1 text-xs font-semibold px-2 ${isSelected ? 'text-emerald-500' : 'text-white'}`}
          numberOfLines={2}
        >
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  // Sekcje dodatkowe przeniesione na dół siatki, aby zachować jeden spójny kontekst przewijania
  const ListFooter =  (
    <View className="mt-4">
      
      {isFetchingNextPage && (
        <View className="py-4 justify-center items-center">
          <ActivityIndicator size="small" color="#1DB954" />
        </View>
      )}
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
              <TouchableOpacity className="mr-4 w-36" activeOpacity={0.7}>
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
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-neutral-950">
      <HeaderWithAvatarDrawer />
      
      <FlatList
        data={Array.isArray(allTracks) ? allTracks : []}
        renderItem={renderTrackItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 }}
        ListFooterComponent={ListFooter}
        refreshing={isRefetching}
        onRefresh={refetch}
        // Triggering data reloading when the user scrolls the list to 80% of its height
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.2}
        // Optimization parameters for large data sets (100+ tracks):
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
};