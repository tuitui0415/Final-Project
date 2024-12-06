<template>
    <div id="piechart-modal">
      <div class="modal-content">
        <h3>{{ title }}</h3>
        <svg ref="piechart"></svg>
        <button class="close-btn" @click="$emit('close')">Close</button>
      </div>
    </div>
  </template>
  
  <script>
  import * as d3 from "d3";
  
  export default {
    props: {
      data: {
        type: Array,
        required: true,
      },
      title: {
        type: String,
        default: "Pie Chart",
      },
    },
    mounted() {
      this.renderPieChart();
    },
    watch: {
      data: {
        deep: true,
        handler() {
          this.renderPieChart();
        },
      },
    },
    methods: {
        renderPieChart() {
  const data = this.data;

  d3.select(this.$refs.piechart).selectAll("*").remove();

  const radius = 150;
  const svgWidth = 400;
  const svgHeight = 400;

  const svg = d3
    .select(this.$refs.piechart)
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    
    .append("g")
    .attr("transform", `translate(${svgWidth / 2}, ${svgHeight / 2})`);

  const color = d3.scaleOrdinal()
    .domain(data.map((d) => d.category))
    .range(["#1f77b4", "#ff7f0e"]);

  const pie = d3.pie().value((d) => d.value);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  svg
    .selectAll("path")
    .data(pie(data))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", (d) => color(d.data.category))
    .attr("stroke", "#balck")
    .attr("stroke-width", 2);
    
  svg
    .selectAll("text")
    .data(pie(data))
    .enter()
    .append("text")
    .attr("transform", (d) => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#black")
    .text((d) => `${d.data.category}: ${d.data.value}`);
}
    },
  };
  </script>
  
  <style scoped>
  #piechart-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
}
.modal-content {
  background: #2a475e;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.7);
}
  .close-btn {
    margin-top: 10px;
    padding: 5px 10px;
    background: #ff7f0e;
    color: #fff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  .close-btn:hover {
    background: #ff5722;
  }
  </style>