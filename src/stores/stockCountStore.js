import { defineStore } from "pinia";
import { ref } from "vue";
import { apiGet, apiPost, apiPut } from "../utils/api";

export const useStockCountStore = defineStore("stockCount", () => {
  const stockCounts = ref([]);
  const currentStockCount = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  async function fetchStockCounts(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      let url = "/api/stock-counts";
      if (params.page) {
        url += `?page=${params.page}&limit=${params.limit || 20}`;
      }
      const response = await apiGet(url);
      if (!response.ok) throw new Error("Failed to fetch stock counts");
      const data = await response.json();
      if (Array.isArray(data)) {
        stockCounts.value = data;
      } else {
        stockCounts.value = data.data;
        pagination.value = data.meta;
      }
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStockCount(id) {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiGet(`/api/stock-counts/${id}`);
      if (!response.ok) throw new Error("Failed to fetch stock count details");
      const data = await response.json();
      currentStockCount.value = data;
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function startStockCount(data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiPost("/api/stock-counts", data);
      if (!response.ok) throw new Error("Failed to start stock count");
      const result = await response.json();
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateStockCount(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiPut(`/api/stock-counts/${id}`, data);
      if (!response.ok) throw new Error("Failed to update stock count");
      return await response.json();
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function reconcileStockCount(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiPost(`/api/stock-counts/${id}/reconcile`, data);
      if (!response.ok) throw new Error("Failed to reconcile stock count");
      return await response.json();
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    stockCounts,
    currentStockCount,
    loading,
    error,
    pagination,
    fetchStockCounts,
    fetchStockCount,
    startStockCount,
    updateStockCount,
    reconcileStockCount,
  };
});
