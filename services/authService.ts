// services/authService.ts
import * as SecureStore from 'expo-secure-store';
import { API } from './apiService';

const TOKEN_ENDPOINT = process.env.EXPO_PUBLIC_TOKEN_ENDPOINT || "";

export async function loginUser(email: string, password: string) {
  try {
    const response = await API.post(TOKEN_ENDPOINT, { email, password });
    const { access, refresh } = response.data;

    await SecureStore.setItemAsync('access', access);
    await SecureStore.setItemAsync('refresh', refresh);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const REGISTER_ENDPOINT = process.env.EXPO_PUBLIC_REGISTER_ENDPOINT || "";

export async function registerUser(email: string, password: string, password2: string) {
  try {
    const response = await API.post(REGISTER_ENDPOINT, { email, password, password2 });
    return response.data; 
  } catch (error) {
    console.error(error);
    throw error;
  }
}