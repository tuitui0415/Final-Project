<template>
  <div id="app">
    <!-- <ScatterPlot /> -->
    <router-view></router-view>
  </div>
</template>

<script>
import ScatterPlot from "./components/ScatterPlot.vue";

export default {
  components: {
    ScatterPlot,
  },
};
</script>

<style>
#app {
  text-align: center;
  margin: 20px;
}
</style>
