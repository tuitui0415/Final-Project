<template>
  <div class="container">
    <h2>Details for {{ genre }}</h2>
    <!-- Insert your second visualization or charts here -->
    <div id="detail-plot"></div>
    <button @click="$router.push({ name: 'Home' })">Back</button>
  </div>
</template>

<script>
import * as d3 from "d3";

export default {
  data() {
    return {
      genre: null,
      startDate: null,
      endDate: null,
    };
  },
  mounted() {
    // Retrieve parameters from the route
    this.genre = this.$route.params.genre;
    this.startDate = this.$route.params.startDate;
    this.endDate = this.$route.params.endDate;

    console.log("Genre:", this.genre);
    console.log("Start Date:", this.startDate);
    console.log("End Date:", this.endDate);

    // Use the parameters to fetch or filter the data
    this.createVisualization();
  },
  methods: {
    createVisualization() {
      // Example D3 visualization setup
      const data = this.getFilteredData(); // Replace with your actual data retrieval/filtering logic

      const svg = d3
        .select("#detail-plot")
        .append("svg")
        .attr("width", 600)
        .attr("height", 400);

      // Example visualization
      svg
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d, i) => i * 50 + 50)
        .attr("cy", 200)
        .attr("r", 20)
        .style("fill", "steelblue");
    },
    getFilteredData() {
      // Replace this with your actual data filtering logic
      // Use this.genre, this.startDate, this.endDate to filter data
      return [
        { name: "Example1", value: 10 },
        { name: "Example2", value: 20 },
        { name: "Example3", value: 30 },
      ];
    },
  },
};
</script>

<style scoped>
.container {
  text-align: center;
}
</style>
