<template>
  <div class="container">
    <h2>Scatter Plot: Reviews vs Positive Percentage</h2>
    <div class="controls">
      <label for="time-slider" class="slider-label">Time:</label>
      <div class="slider-container">
        <input
          id="time-slider"
          class="custom-slider"
          type="range"
          :min="0"
          :max="timeSteps.length - 1"
          step="1"
          v-model="currentStep"
          @input="updateData"
        />
        <span class="slider-value">{{ timeSteps[currentStep] }}</span>
      </div>
    </div>
    <svg ref="chart"></svg>
  </div>
</template>

<script>
import * as d3 from "d3";

export default {
  data() {
    return {
      data: [],
      filteredData: [],
      svg: null,
      width: 0,
      height: 0,
      margin: { top: 80, right: 100, bottom: 80, left: 100 },
      timeSteps: [],
      currentStep: 0,
      colorScale: null,
    };
  },
  mounted() {
    this.setChartSize();
    this.generateData();
    this.createColorScale();
    this.initChart();
    this.updateData();

    window.addEventListener("resize", this.resizeChart);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resizeChart);
  },
  methods: {
    setChartSize() {
      this.width = window.innerWidth; // 动态设置宽度
      this.height = window.innerHeight - 100; // 动态设置高度
      this.margin = { top: 80, right: 100, bottom: 80, left: 100 }; // 边距调整
    },
    resizeChart() {
      this.setChartSize();
      d3.select(this.$refs.chart)
        .attr("width", this.width)
        .attr("height", this.height);
      this.updateChart();
    },
    generateData() {
      const startDate = new Date(2014, 0, 1);
      const endDate = new Date(2019, 11, 31);
      const timeStep = 15;

      this.timeSteps = [];
      let currentDate = startDate;
      while (currentDate <= endDate) {
        this.timeSteps.push(currentDate.toISOString().slice(0, 10));
        currentDate = new Date(currentDate.getTime() + timeStep * 24 * 60 * 60 * 1000);
      }

      this.data = this.timeSteps
        .map((date) => {
          const categories = Array.from({ length: 5 }, (_, i) => ({
            time: date,
            category: `Genre ${i + 1}`,
            positivePercentage: Math.random() * 100,
            totalReviews: Math.random() * 10000,
            numberOfGames: Math.floor(Math.random() * 50 + 1),
          }));
          return categories;
        })
        .flat();
    },
    createColorScale() {
      const genres = Array.from(new Set(this.data.map((d) => d.category)));
      this.colorScale = d3
        .scaleOrdinal()
        .domain(genres)
        .range(["#FFA726", "#FF7043", "#FF5722", "#F4511E", "#BF360C"]);
    },
    initChart() {
      const { width, height, margin } = this;

      this.svg = d3
        .select(this.$refs.chart)
        .attr("width", width)
        .attr("height", height);

      this.svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`);
      this.svg.append("g").attr("class", "y-axis").attr("transform", `translate(${margin.left}, 0)`);

      this.tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    },
    updateData() {
      const currentDate = this.timeSteps[this.currentStep];
      this.filteredData = this.data.filter((d) => d.time === currentDate);
      this.updateChart();
    },
    updateChart() {
      const { svg, filteredData, width, height, margin, colorScale } = this;

      const xScale = d3
        .scaleLinear()
        .domain([0, 110]) // 增加 X 轴冗余
        .range([margin.left, width - margin.right]);

      const yScale = d3
        .scaleLinear()
        .domain([0, 11000]) // 增加 Y 轴冗余
        .range([height - margin.bottom, margin.top]);

      const sizeScale = d3
        .scaleSqrt()
        .domain([1, 50])
        .range([5, 30]);

      // Update axes
      svg
        .select(".x-axis")
        .call(d3.axisBottom(xScale).ticks(10).tickFormat((d) => `${d}%`))
        .selectAll("text")
        .style("fill", "#c7d5e0")
        .style("font-size", "14px");

      svg
        .select(".y-axis")
        .call(d3.axisLeft(yScale).ticks(5))
        .selectAll("text")
        .style("fill", "#c7d5e0")
        .style("font-size", "14px");

      // Update circles
      const circles = svg.selectAll("circle").data(filteredData, (d) => d.category);

      circles
        .exit()
        .transition()
        .duration(500)
        .attr("r", 0)
        .remove();

      const circlesEnter = circles
        .enter()
        .append("circle")
        .attr("r", 0)
        .attr("cx", (d) => xScale(d.positivePercentage))
        .attr("cy", (d) => yScale(d.totalReviews))
        .attr("fill", (d) => colorScale(d.category))
        .attr("opacity", 0.7);

      const circlesMerged = circlesEnter.merge(circles);

      circlesMerged
        .on("mouseover", (event, d) => {
          this.tooltip
            .style("opacity", 1)
            .html(`
              <strong>${d.category}</strong><br/>
              Positive Percentage: ${d.positivePercentage.toFixed(2)}%<br/>
              Total Reviews: ${d.totalReviews.toFixed(0)}<br/>
              Number of Games: ${d.numberOfGames}
            `)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", () => {
          this.tooltip.style("opacity", 0);
        });

      circlesMerged
        .transition()
        .duration(500)
        .attr("cx", (d) => xScale(d.positivePercentage))
        .attr("cy", (d) => yScale(d.totalReviews))
        .attr("r", (d) => sizeScale(d.numberOfGames))
        .attr("fill", (d) => colorScale(d.category))
        .attr("opacity", 0.7);
    },
  },
};
</script>
