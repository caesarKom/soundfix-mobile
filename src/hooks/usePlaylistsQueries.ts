import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface TrackInPlaylist {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  duration: number;
  coverUrl: string | null;
  mimeType: string;
  isLiked: boolean;
}

export interface PlaylistData {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  isPrivate: boolean;
  userId: string;
  songs: TrackInPlaylist[];
  _count?: { songs: number };
}

export const usePlaylistQuery = (playlistId: string) => {
  return useQuery<PlaylistData>({
    queryKey: ['playlist-details', playlistId],
    queryFn: async () => {
      const res = await api.get(`/playlists/${playlistId}`);
      return res.data;
    },
    enabled: !!playlistId,
  });
};

export const useAllPlaylistsQuery = () => {
  return useQuery<PlaylistData[]>({
    queryKey: ['user-playlists'],
    queryFn: async () => {
      const res = await api.get('/playlists');
      return Array.isArray(res.data) ? res.data : [];
    },
  });
};

export const useCreatePlaylistMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/playlists', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-playlists'] });
    },
  });
};

export const useUpdatePlaylistMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const res = await api.patch(`/playlists/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-details', variables.id] });
    },
  });
};

export const useDeletePlaylistMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/playlists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-playlists'] });
    },
  });
};

export const useAddSongToPlaylistMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
      await api.post(`/playlists/${playlistId}/songs`, { songId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist-details', variables.playlistId] });
      queryClient.invalidateQueries({ queryKey: ['user-playlists'] });
    },
  });
};

export const useRemoveSongFromPlaylistMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
      await api.delete(`/playlists/${playlistId}/songs`, { data: { songId } });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist-details', variables.playlistId] });
      queryClient.invalidateQueries({ queryKey: ['user-playlists'] });
    },
  });
};
