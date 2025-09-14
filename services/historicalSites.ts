import api, { endpoints } from './api';

export interface HistoricalSiteData {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  latitude: number;
  longitude: number;
  city: number;
  tags?: number[];
  categories?: number[];
}

export interface HistoricalSiteFilters {
  page?: number;
  city?: number;
  categories?: string; // comma-separated IDs
  tags?: string; // comma-separated IDs
  search?: string;
  ordering?: string;
}

export interface MediaUploadData {
  historical_site: number;
  file: File | any; // React Native file object
  title?: string;
  caption?: string;
  is_thumbnail?: boolean;
}

export const historicalSitesService = {
  async getSites(filters: HistoricalSiteFilters = {}) {
    const response = await api.get(endpoints.historicalSites.sites, { params: filters });
    return response.data.data;
  },

  async getSite(id: number) {
    const response = await api.get(endpoints.historicalSites.site(id));
    return response.data.data;
  },

  async createSite(data: HistoricalSiteData) {
    const response = await api.post(endpoints.historicalSites.sites, data);
    return response.data.data;
  },

  async updateSite(id: number, data: Partial<HistoricalSiteData>) {
    const response = await api.patch(endpoints.historicalSites.site(id), data);
    return response.data.data;
  },

  async deleteSite(id: number) {
    await api.delete(endpoints.historicalSites.site(id));
  },

  async uploadMedia(data: MediaUploadData) {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('historical_site', data.historical_site.toString());

    if (data.title) formData.append('title', data.title);
    if (data.caption) formData.append('caption', data.caption);
    if (data.is_thumbnail !== undefined) {
      formData.append('is_thumbnail', data.is_thumbnail.toString());
    }

    const response = await api.post(endpoints.historicalSites.media, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },

  async bulkUploadMedia(
    siteId: number,
    files: Array<{
      file: File | any;
      title?: string;
      caption?: string;
      is_thumbnail?: boolean;
    }>
  ) {
    const formData = new FormData();

    files.forEach((item, index) => {
      formData.append('files', item.file);
      if (item.title) formData.append('titles', item.title);
      if (item.caption) formData.append('captions', item.caption);
      if (item.is_thumbnail !== undefined) {
        formData.append('thumbnails', item.is_thumbnail.toString());
      }
    });

    const response = await api.post(endpoints.historicalSites.bulkMediaUpload(siteId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },

  async getMedia(id: number) {
    const response = await api.get(endpoints.historicalSites.mediaItem(id));
    return response.data.data;
  },

  async updateMedia(id: number, data: { title?: string; caption?: string; is_thumbnail?: boolean }) {
    const response = await api.patch(endpoints.historicalSites.mediaItem(id), data);
    return response.data.data;
  },

  async deleteMedia(id: number) {
    await api.delete(endpoints.historicalSites.mediaItem(id));
  },

  // Tags management
  async getTags() {
    const response = await api.get(endpoints.historicalSites.tags);
    return response.data.data;
  },

  async createTag(data: { slug_en: string; slug_ar: string }) {
    const response = await api.post(endpoints.historicalSites.tags, data);
    return response.data.data;
  },

  async updateTag(id: number, data: { slug_en?: string; slug_ar?: string }) {
    const response = await api.patch(endpoints.historicalSites.tag(id), data);
    return response.data.data;
  },

  async deleteTag(id: number) {
    await api.delete(endpoints.historicalSites.tag(id));
  },

  // Categories management
  async getCategories() {
    const response = await api.get(endpoints.historicalSites.categories);
    return response.data.data;
  },

  async createCategory(data: { slug_en: string; slug_ar: string }) {
    const response = await api.post(endpoints.historicalSites.categories, data);
    return response.data.data;
  },

  async updateCategory(id: number, data: { slug_en?: string; slug_ar?: string }) {
    const response = await api.patch(endpoints.historicalSites.category(id), data);
    return response.data.data;
  },

  async deleteCategory(id: number) {
    await api.delete(endpoints.historicalSites.category(id));
  },
};