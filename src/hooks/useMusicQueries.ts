import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useEffect } from 'react';
import { usePlayerStore, Track } from '../store/usePlayerStore';


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