import { InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Track } from '../store/usePlayerStore';

export const usePlaylistMetadataQuery = (playlistId: string) => {
  return useQuery({
    queryKey: ['playlist', 'metadata', playlistId],
    queryFn: async () => {
      const res = await api.get(`/playlists/${playlistId}`);
      return res.data;
    },
    enabled: !!playlistId,
  });
};

// Infinite pagination of songs within the selected playlist
export const useInfinitePlaylistSongsQuery = (playlistId: string) => {
  return useInfiniteQuery<Track[], Error, InfiniteData<Track[], number>, [string, string, string], number>({
    queryKey: ['playlist', 'songs', playlistId],
    queryFn: async ({ pageParam }) => {
      const res = await api.get(`/playlists/${playlistId}/songs`, {
        params: { page: pageParam, limit: 20 },
      });
      console.log("Query songs data : ", res.data)
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return allPages.length + 1;
    },
    enabled: !!playlistId,
    staleTime: 1000 * 60 * 2,
  });
};

// Add/Remove from Favorites Mutation
export const useToggleFavoriteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (musicId: string) => {
      const res = await api.post(`/music/like/${musicId}`);
      return res.data; // return { isFavorite: boolean }
    },
    onSuccess: () => {
      // Cache invalidation to refresh heart states on screens
      queryClient.invalidateQueries({ queryKey: ['music'] });
      queryClient.invalidateQueries({ queryKey: ['playlist'] });
    },
  });
};


export const useInfiniteMusicQuery = () => {

  return useInfiniteQuery<Track[]>({
    queryKey: ['music', 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get('/music', {
        params: {
          page: pageParam,
          limit: 20
        },
      });
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
    initialPageParam : 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) return undefined;
      return allPages.length + 1;
    },
    staleTime: 1000 * 60 * 5,
  });
  
};

export const usePlaylistsQuery = () => {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: async () => {
      const res = await api.get('/playlists');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
    staleTime: 1000 * 60 * 5,
  });
};