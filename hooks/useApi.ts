import { useState, useEffect } from 'react';
import api from '../services/api';

interface UseApiOptions {
  immediate?: boolean;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export const useApi = <T = any>(
  apiCall: (...args: any[]) => Promise<any>,
  options: UseApiOptions = {}
): UseApiReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (...args: any[]): Promise<T> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(...args);
      const result = response.data.success ? response.data.data : response.data;

      setData(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        err.message ||
        'An error occurred';

      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};