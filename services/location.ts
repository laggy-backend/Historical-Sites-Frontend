import api, { endpoints } from './api';

export interface Governorate {
  id: number;
  name_en: string;
  name_ar: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface City {
  id: number;
  name_en: string;
  name_ar: string;
  governorate: number;
  governorate_details: Governorate;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export const locationService = {
  async getGovernorates(): Promise<Governorate[]> {
    const response = await api.get(endpoints.common.governorates);
    return response.data.data;
  },

  async getGovernorate(id: number): Promise<Governorate> {
    const response = await api.get(endpoints.common.governorate(id));
    return response.data.data;
  },

  async createGovernorate(data: { name_en: string; name_ar: string }): Promise<Governorate> {
    const response = await api.post(endpoints.common.governorates, data);
    return response.data.data;
  },

  async updateGovernorate(
    id: number,
    data: { name_en?: string; name_ar?: string }
  ): Promise<Governorate> {
    const response = await api.patch(endpoints.common.governorate(id), data);
    return response.data.data;
  },

  async deleteGovernorate(id: number): Promise<void> {
    await api.delete(endpoints.common.governorate(id));
  },

  async getCities(): Promise<City[]> {
    const response = await api.get(endpoints.common.cities);
    return response.data.data;
  },

  async getCity(id: number): Promise<City> {
    const response = await api.get(endpoints.common.city(id));
    return response.data.data;
  },

  async createCity(data: {
    name_en: string;
    name_ar: string;
    governorate: number;
  }): Promise<City> {
    const response = await api.post(endpoints.common.cities, data);
    return response.data.data;
  },

  async updateCity(
    id: number,
    data: { name_en?: string; name_ar?: string; governorate?: number }
  ): Promise<City> {
    const response = await api.patch(endpoints.common.city(id), data);
    return response.data.data;
  },

  async deleteCity(id: number): Promise<void> {
    await api.delete(endpoints.common.city(id));
  },

  async getCitiesByGovernorate(governorateId: number): Promise<City[]> {
    const cities = await this.getCities();
    return cities.filter(city => city.governorate === governorateId);
  },
};