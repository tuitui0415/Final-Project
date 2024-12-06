import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDetailDataStore = defineStore('detailData', {
  state: () => ({
    detailData: []
  }),
  actions: {
    setDetailData(newData: never[]) {
      this.detailData = newData;
    }
  }
});