import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, TextInput, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { MEDIA_URL } from '../config/env';
import { noSongImg } from '../utils/images';
import { navigate } from '../navigation/NavigationUtils';
import { BottomModal } from '../components/BottomModal';
import { 
  useAllPlaylistsQuery, 
  useCreatePlaylistMutation, 
  useUpdatePlaylistMutation, 
  useDeletePlaylistMutation,
  useAddSongToPlaylistMutation,
  useRemoveSongFromPlaylistMutation,
  PlaylistData
} from '../hooks/usePlaylistsQueries';

interface SelectedImage {
  uri: string;
  name: string;
  type: string;
}

export const LibraryScreen = () => {
  const { data: playlists = [], isLoading, refetch } = useAllPlaylistsQuery();
  const createMutation = useCreatePlaylistMutation();
  const updateMutation = useUpdatePlaylistMutation();
  const deleteMutation = useDeletePlaylistMutation();
  const addSongMutation = useAddSongToPlaylistMutation();
  const removeSongMutation = useRemoveSongFromPlaylistMutation();

  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isTrackManagerOpen, setIsTrackManagerOpen] = useState(false);
  const [activePlaylistForTracks, setActivePlaylistForTracks] = useState<PlaylistData | null>(null);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');

  // Form state
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDesc, setPlaylistDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);

  // Get musics
  const { data: globalTracks = [] } = useQuery<any[]>({
    queryKey: ['global-music-list-manager'],
    queryFn: async () => {
      const res = await api.get('/music', { params: { page: 1, limit: 100 } });
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
    enabled: isTrackManagerOpen,
  });

  const handleSelectImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.7 });
    if (result.assets && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri || '',
        name: asset.fileName || `cover-${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      });
    }
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setPlaylistName('');
    setPlaylistDesc('');
    setIsPrivate(false);
    setSelectedImage(null);
    setIsFormOpen(true);
  };

  const openEditModal = (playlist: PlaylistData) => {
    setIsEditMode(true);
    setEditingId(playlist.id);
    setPlaylistName(playlist.name);
    setPlaylistDesc(playlist.description || '');
    setIsPrivate(playlist.isPrivate);
    setSelectedImage(null);
    setIsFormOpen(true);
  };

  const openTrackManagerModal = async (playlist: PlaylistData) => {
    try {
      const res = await api.get(`/playlists/${playlist.id}`);
      setActivePlaylistForTracks(res.data);
      setMusicSearchQuery('');
      setIsTrackManagerOpen(true);
    } catch {
      Alert.alert('Error', 'Failed to download current track list.');
    }
  };

  const handleSavePlaylist = async () => {
    if (!playlistName.trim()) return;
    const formData = new FormData();
    formData.append('name', playlistName);
    formData.append('description', playlistDesc);
    formData.append('isPrivate', String(isPrivate));

    if (selectedImage) {
      formData.append('cover', {
        uri: selectedImage.uri,
        name: selectedImage.name,
        type: selectedImage.type,
      } as any);
    }

    try {
      if (isEditMode && editingId) {
        await updateMutation.mutateAsync({ id: editingId, formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsFormOpen(false);
    } catch {
      Alert.alert('Error', 'There was a problem saving.');
    }
  };

  const filteredPlaylists = useMemo(() => {
    let result = playlists.filter(p => p.name !== 'Favorite');
    if (searchQuery.trim()) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [playlists, searchQuery]);

  const filteredGlobalTracks = useMemo(() => {
    if (!musicSearchQuery.trim()) return globalTracks;
    return globalTracks.filter((t: any) =>
      t.title.toLowerCase().includes(musicSearchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(musicSearchQuery.toLowerCase())
    );
  }, [globalTracks, musicSearchQuery]);


return (
    <SafeAreaView className="flex-1 bg-neutral-950 px-4 pt-2">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-full bg-emerald-500 items-center justify-center">
            <Text className="text-slate-950 font-black text-sm">Y</Text>
          </View>
          <Text className="text-white font-black text-2xl tracking-tight">Twoja biblioteka</Text>
        </View>
        <TouchableOpacity onPress={openCreateModal} className="p-1">
          <Icon name="add" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* Library search engine */}
      <View className="flex-row items-center bg-neutral-900 rounded-lg px-3 py-2 mb-4 border border-neutral-800/40">
        <Icon name="search" size={18} color="#a3a3a3" />
        <TextInput
          placeholder="Szukaj playlist..."
          placeholderTextColor="#6b7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="flex-1 text-white text-sm ml-2 p-0 focus:outline-none"
        />
      </View>

      {/* List of regular user playlists */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      ) : (
        <FlatList
          data={filteredPlaylists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 140 }}
          refreshing={isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <View className="flex-row items-center justify-between p-3 mb-2 bg-neutral-900/40 rounded-xl border border-neutral-900">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigate('PlaylistScreen', { playlistId: item.id })}
                className="flex-row items-center flex-1 mr-2"
              >
                <Image
                  source={{ uri: item.coverUrl ? `${MEDIA_URL}/${item.coverUrl}` : noSongImg }}
                  className="w-16 h-16 rounded-lg bg-neutral-800"
                  resizeMode="cover"
                />
                <View className="ml-4 flex-1">
                  <Text className="text-white font-bold text-base" numberOfLines={1}>{item.name}</Text>
                  <Text className="text-neutral-400 text-xs mt-1" numberOfLines={1}>{item.description || 'No description'}</Text>
                  <Text className="text-neutral-500 text-xs mt-1 font-semibold">Playlist • {item._count?.songs || 0} songs</Text>
                </View>
              </TouchableOpacity>

              <View className="flex-row items-center gap-1">
                <TouchableOpacity onPress={() => openTrackManagerModal(item)} className="p-2">
                  <Icon name="musical-notes-outline" size={20} color="#38bdf8" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openEditModal(item)} className="p-2">
                  <Icon name="create-outline" size={20} color="#1DB954" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert('Delete', 'Delete playlist?', [{ text: 'No' }, { text: 'Yes', onPress: () => deleteMutation.mutate(item.id) }])} className="p-2">
                  <Icon name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* MODAL METADATA */}
      <BottomModal visible={isFormOpen} onClose={() => setIsFormOpen(false)} H={480}>
        <View className="px-5 pb-8 flex-1">
          <Text className="text-white font-black text-xl mb-4">{isEditMode ? 'Modify playlist' : 'Create a new playlist'}</Text>
          <View className="items-center mb-4">
            <TouchableOpacity onPress={handleSelectImage} activeOpacity={0.8}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage.uri }} className="w-24 h-24 rounded-xl border border-neutral-700" />
              ) : (
                <View className="w-24 h-24 rounded-xl bg-neutral-950 border border-dashed border-neutral-700 items-center justify-center">
                  <Icon name="image-outline" size={28} color="#a3a3a3" />
                  <Text className="text-[9px] text-neutral-500 mt-1 font-bold">Select a cover</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <TextInput placeholder="Nazwa playlisty" placeholderTextColor="#525252" value={playlistName} onChangeText={setPlaylistName} className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-2.5 text-sm mb-3" />
          <TextInput placeholder="Opis kolekcji" placeholderTextColor="#525252" value={playlistDesc} onChangeText={setPlaylistDesc} className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-2.5 text-sm mb-4" />
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity onPress={() => setIsFormOpen(false)} className="flex-1 py-3 bg-neutral-800 rounded-xl items-center"><Text className="text-white font-bold text-sm">Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSavePlaylist} className="flex-1 py-3 bg-emerald-500 rounded-xl items-center"><Text className="text-neutral-950 font-black text-sm">Save</Text></TouchableOpacity>
          </View>
        </View>
      </BottomModal>

      {/* MODAL SONG MANAGEMENT */}
      <BottomModal visible={isTrackManagerOpen} onClose={() => { setIsTrackManagerOpen(false); refetch(); }}>
        <View className="px-5 flex-1 pb-10">
          <Text className="text-white font-black text-lg mb-1">Add or remove songs</Text>
          <Text className="text-emerald-400 text-xs mb-3 font-semibold">Playlist: {activePlaylistForTracks?.name}</Text>
          <View className="flex-row items-center bg-neutral-950 rounded-lg px-3 py-2 mb-4 border border-neutral-800">
            <Icon name="search" size={16} color="#a3a3a3" /><TextInput placeholder="Search for a song..." placeholderTextColor="#6b7280" value={musicSearchQuery} onChangeText={setMusicSearchQuery} className="flex-1 text-white text-xs ml-2 p-0" />
          </View>
          <FlatList
            data={filteredGlobalTracks}
            keyExtractor={(track) => track.id}
            renderItem={({ item: track }) => {
              const isAlreadyLinked = activePlaylistForTracks?.songs?.some((s) => s.id === track.id) || false;
              const toggleRelation = async () => {
                if (!activePlaylistForTracks) return;
                if (isAlreadyLinked) {
                  await removeSongMutation.mutateAsync({ playlistId: activePlaylistForTracks.id, songId: track.id });
                  setActivePlaylistForTracks({ ...activePlaylistForTracks, songs: activePlaylistForTracks.songs.filter((s) => s.id !== track.id) });
                } else {
                  await addSongMutation.mutateAsync({ playlistId: activePlaylistForTracks.id, songId: track.id });
                  setActivePlaylistForTracks({ ...activePlaylistForTracks, songs: [...(activePlaylistForTracks.songs || []), track] });
                }
              };
              return (
                <View className="flex-row items-center justify-between p-2.5 mb-2 bg-neutral-950/60 rounded-xl border border-neutral-900">
                  <View className="flex-row items-center flex-1 mr-2">
                    <Image source={{ uri: track.coverUrl ? `${MEDIA_URL}/${track.coverUrl}` : noSongImg }} className="w-10 h-10 rounded-md bg-neutral-800 mr-3" />
                    <View className="flex-1">
                      <Text className="text-white font-bold text-sm" numberOfLines={1}>{track.title}</Text>
                      <Text className="text-neutral-400 text-xs" numberOfLines={1}>{track.artist}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={toggleRelation} className={`px-3 py-1.5 rounded-lg border ${isAlreadyLinked ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                    <Text className={`text-xs font-black uppercase ${isAlreadyLinked ? 'text-red-400' : 'text-emerald-400'}`}>{isAlreadyLinked ? '✕' : '＋'}</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </View>
      </BottomModal>
    </SafeAreaView>
  );
};