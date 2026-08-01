import { useContext } from 'react';
import { AuthContext } from '../app/providers/AuthProvider';

export const useAuth = () => {
  return useContext(AuthContext);
};
