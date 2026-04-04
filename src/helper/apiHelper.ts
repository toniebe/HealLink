import api from './api';

interface ApiResponse<T> {
  data: T | null;
  error: { message: string; status?: number } | null;
}

export const get = async <T>(endpoint: string, params: Record<string, any> = {}): Promise<ApiResponse<T>> => {
  try {
    const response = await api.get<T>(endpoint, { params });
    return { data: response as T, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};

export const post = async <T>(endpoint: string, body: Record<string, any> = {}): Promise<ApiResponse<T>> => {
  try {
    const response = await api.post<T>(endpoint, body);
    return { data: response as T, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};

export const put = async <T>(endpoint: string, body: Record<string, any> = {}): Promise<ApiResponse<T>> => {
  try {
    const response = await api.put<T>(endpoint, body);
    return { data: response as T, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};

export const del = async <T>(endpoint: string): Promise<ApiResponse<T>> => {
  try {
    const response = await api.delete<T>(endpoint);
    return { data: response as T, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};

export const postFormData = async <T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> => {
  try {
    const response = await api.post<T>(endpoint, formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });
    return { data: response as T, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};