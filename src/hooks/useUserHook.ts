import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { User, UpdateUserProfile} from '../types/auth';
import { useAuthStore } from '../store/useAuthStore';

export const USER_QUERY_KEY = ['me', 'profile'];

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (input: UpdateUserProfile) => {
      const response = await api.patch<UpdateUserProfile>('/users/me', input);
      return response.data;
    },
    onSuccess: (updatedUser) => {

      queryClient.setQueryData(USER_QUERY_KEY, updatedUser);

      setUser(updatedUser);

      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    },
  });
};