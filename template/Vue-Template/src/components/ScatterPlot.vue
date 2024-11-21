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
      margin: { top: 20, right: 30, bottom: 40, left: 50 },
      timeSteps: [], // 时间轴步长
      currentStep: 0, // 当前时间步长
    };
  },
  mounted() {
    this.generateData();
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
    },
    // 生成模拟数据
    generateData() {
      // 时间范围 (2014-2019), 每月为一个时间步长
      const startDate = new Date(2014, 0, 1);
      const endDate = new Date(2019, 11, 31);
      const timeStep = 30; // 天为步长

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
    // 更新图表
    updateChart() {
      const { svg, filteredData, width, height, margin } = this;

      // 定义缩放
      const xScale = d3
        .scaleLinear()
        .domain([0, 100]) // Positive Percentage: 0%-100%
        .range([margin.left, width - margin.right]);

      const yScale = d3
        .scaleLinear()
        .domain([0, 10000]) // Total Reviews: 0-10000
        .range([height - margin.bottom, margin.top]);

      // 定义圆大小缩放（将游戏数量映射到圆的面积）
      const sizeScale = d3
        .scaleSqrt() // 使用平方根比例映射
        .domain([1, 50]) // 游戏数量范围：1-50
        .range([5, 20]); // 半径范围：5px-20px

      // 更新 X 轴
      svg
        .select(".x-axis")
        .call(d3.axisBottom(xScale).ticks(10).tickFormat((d) => `${d}%`));

      // 更新 Y 轴
      svg.select(".y-axis").call(d3.axisLeft(yScale).ticks(5));

      // 绑定数据
      const circles = svg.selectAll("circle").data(filteredData);

      // 更新现有点
      circles
        .transition()
        .duration(500)
        .attr("cx", (d) => xScale(d.positivePercentage))
        .attr("cy", (d) => yScale(d.totalReviews))
        .attr("r", (d) => sizeScale(d.numberOfGames)) // 根据游戏数量调整半径
        .attr("fill", "steelblue");

      // 添加新点
      circles
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale(d.positivePercentage))
        .attr("cy", (d) => yScale(d.totalReviews))
        .attr("r", 0) // 动画从半径 0 开始
        .attr("fill", "steelblue")
        .transition()
        .duration(500)
        .attr("r", (d) => sizeScale(d.numberOfGames)); // 动画显示大小

      // 移除旧点
      circles
        .exit()
        .transition()
        .duration(500)
        .attr("r", 0)
        .remove();
    },
  },
};
</script>

<style>
svg {
  border: 1px solid #ccc;
}
</style>
