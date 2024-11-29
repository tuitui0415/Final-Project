<template>
  <div>
    <h2>Scatter Plot: Reviews vs Positive Percentage</h2>
    <div>
      <label for="time-slider">Time:</label>
      <input
        id="time-slider"
        type="range"
        :min="0"
        :max="timeSteps.length - 1"
        step="1"
        v-model="currentStep"
        @input="updateData"
      />
      <span>{{ timeSteps[currentStep] }}</span>
    </div>
    <svg ref="chart"></svg>
  </div>
</template>

<script>
import * as d3 from "d3";

export default {
  data() {
    return {
      data: [], // 全部数据
      filteredData: [], // 过滤后的数据（当前时间段）
      svg: null,
      width: 600,
      height: 400,
      margin: { top: 20, right: 100, bottom: 40, left: 50 },
      timeSteps: [], // 时间轴步长
      currentStep: 0, // 当前时间步长
    };
  },
  mounted() {
    this.generateData();
    this.createColorScale();
    this.initChart();
    this.updateData();
  },
  methods: {
    // 初始化图表
    initChart() {
      const { width, height, margin } = this;

      this.svg = d3
        .select(this.$refs.chart)
        .attr("width", width)
        .attr("height", height);

      // 添加 X 轴和 Y 轴
      this.svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`);

      this.svg
        .append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left}, 0)`);

      // **创建 tooltip div**
      this.tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background-color", "white")
        .style("padding", "5px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("opacity", 0);

      this.legend = this.svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);
    },

    // 生成模拟数据
    generateData() {
      // 时间范围 (2014-2019), 每月为一个时间步长
      const startDate = new Date(2014, 0, 1);
      const endDate = new Date(2019, 11, 31);
      const timeStep = 15; // 天为步长

      this.timeSteps = [];
      let currentDate = startDate;
      while (currentDate <= endDate) {
        this.timeSteps.push(currentDate.toISOString().slice(0, 10));
        currentDate = new Date(currentDate.getTime() + timeStep * 24 * 60 * 60 * 1000);
      }

      // 模拟每个时间段的类别数据
      this.data = this.timeSteps.map((date) => {
        const categories = Array.from({ length: 5 }, (_, i) => ({
          time: date,
          category: `Genre ${i + 1}`,
          positivePercentage: Math.random() * 100, // 0%-100%
          totalReviews: Math.random() * 10000, // 0-10000
          numberOfGames: Math.floor(Math.random() * 50 + 1), // 1-50 游戏数量
        }));
        return categories;
      }).flat();
    },
    // 更新数据（基于当前时间步长）
    updateData() {
      const currentDate = this.timeSteps[this.currentStep];

      // 筛选当前时间的数据
      this.filteredData = this.data.filter((d) => d.time === currentDate);
      this.updateChart();
    },
  
  // Create color scale based on unique genres
  createColorScale() {
    // Extract unique genres from data
    const genres = Array.from(new Set(this.data.map(d => d.category)));

    // Define the color scale
    this.colorScale = d3.scaleOrdinal()
      .domain(genres)
      .range(d3.schemeCategory10); // Or any color scheme you prefer
  },

  // 更新图表
  updateChart() {
    const { svg, filteredData, width, height, margin, colorScale } = this;

    // Define scales
    const xScale = d3
      .scaleLinear()
      .domain([0, 100]) // Positive Percentage: 0%-100%
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 10000]) // Total Reviews: 0-10000
      .range([height - margin.bottom, margin.top]);

    // Define size scale
    const sizeScale = d3
      .scaleSqrt()
      .domain([1, 50]) // Number of games: 1-50
      .range([5, 20]); // Radius: 5px-20px

    // Update axes
    svg
      .select(".x-axis")
      .call(d3.axisBottom(xScale).ticks(10).tickFormat((d) => `${d}%`));

    svg.select(".y-axis").call(d3.axisLeft(yScale).ticks(5));

    // Bind data with key function
    const circles = svg.selectAll("circle").data(filteredData, d => d.category);

    // Remove old circles
    circles.exit()
      .transition()
      .duration(500)
      .attr("r", 0)
      .remove();

    // Add new circles
    const circlesEnter = circles.enter()
      .append("circle")
      .attr("r", 0)
      .attr("cx", d => xScale(d.positivePercentage))
      .attr("cy", d => yScale(d.totalReviews))
      .attr("fill", d => colorScale(d.category));

    // Merge new and existing circles
    const circlesMerged = circlesEnter.merge(circles);

    // Add event listeners
    circlesMerged
      .on("mouseover", (event, d) => {
        this.tooltip
          .style("opacity", 1)
          .html(`
            <strong>${d.category}</strong><br/>
            Positive Percentage: ${d.positivePercentage.toFixed(2)}%<br/>
            Total Reviews: ${d.totalReviews.toFixed(0)}<br/>
            Number of Games: ${d.numberOfGames}
          `);
      })
      .on("mousemove", (event) => {
        this.tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        this.tooltip.style("opacity", 0);
      });

    // Apply transitions
    circlesMerged
      .transition()
      .duration(500)
      .attr("cx", (d) => xScale(d.positivePercentage))
      .attr("cy", (d) => yScale(d.totalReviews))
      .attr("r", (d) => sizeScale(d.numberOfGames))
      .attr("fill", d => colorScale(d.category)); // Ensure fill is updated

    // Update Legend
    const genres = colorScale.domain();

    // Bind data to legend items
    const legendItems = this.legend.selectAll(".legend-item")
      .data(genres);

    // Enter selection
    const legendEnter = legendItems.enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`);

    legendEnter.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", d => colorScale(d));

    legendEnter.append("text")
      .attr("x", 18)
      .attr("y", 10)
      .text(d => d)
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");

    // Update existing legend items
    legendItems.select("rect")
      .attr("fill", d => colorScale(d));

    legendItems.select("text")
      .text(d => d);

    // Remove old legend items
    legendItems.exit().remove();
  },

  },
};
</script>

<style>
svg {
  border: 1px solid #ccc;
}
.tooltip {
  position: absolute;
  text-align: left;
  width: auto;
  height: auto;
  padding: 5px;
  font: 12px sans-serif;
  background: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  pointer-events: none;
  opacity: 0;
}
</style>
