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
      <button @click="toggleTrails" class="toggle-trails-btn">
        {{ showTrails ? "Stop Trails" : "Start Trails" }}
      </button>
    </div>
    <svg ref="chart"></svg>
  </div>
</template>

<script>
import * as d3 from "d3";
//import { useGameStore } from '../stores/gameStore'; // Import the store

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
      showTrails: false, // 是否显示踪迹
      trailStartIndex: null, // 记录踪迹起始索引
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
  created() {
    this.read()
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resizeChart);
  },
  methods: {
    setChartSize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight - 100;
      this.margin = { top: 80, right: 100, bottom: 80, left: 100 };
    },
    resizeChart() {
      this.setChartSize();
      d3.select(this.$refs.chart)
        .attr("width", this.width)
        .attr("height", this.height);
      this.updateChart();
    },
    async read() {
      try {
        const gameData = await d3.csv('../../data/game_with_review.csv', (d) => {
          const standardizeResponse = (response) => response?.trim().toLowerCase() ?? '';
          return {
            appid: parseInt(standardizeResponse(d['appid'])), 
            name: standardizeResponse(d['name']),
            date: standardizeResponse(d['release_date']),
            categories: standardizeResponse(d['categories']),
            genres: standardizeResponse(d['genres']),
            community_tags: standardizeResponse(d['steamspy_tags']),
            pos_rating: parseInt(standardizeResponse(d['positive_ratings'])), 
            neg_rating: parseInt(standardizeResponse(d['negative_ratings'])), 
          };
        });
        console.log("data: ", gameData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
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
    toggleTrails() {
      this.showTrails = !this.showTrails;

      if (this.showTrails) {
        // 记录起始索引为当前时间点
        this.trailStartIndex = this.currentStep;
      } else {
        // 停止踪迹显示时清除踪迹并重置索引
        this.trailStartIndex = null;
        this.updateTrails();
      }
      this.updateData();
    },
    updateData() {
      const currentDate = this.timeSteps[this.currentStep];
      this.filteredData = this.data.filter((d) => d.time === currentDate);
      this.updateTrails();
      this.updateChart();
    },
    updateTrails() {
      const { data, svg, width, height, margin, colorScale, showTrails, trailStartIndex, currentStep } = this;

      if (!showTrails || trailStartIndex === null) {
        // 如果踪迹未启用或未设置起始索引，则隐藏所有踪迹
        svg.selectAll(".trail-circle")
          .transition()
          .duration(500)
          .attr("opacity", 0);
        return;
      }

      const xScale = d3
        .scaleLinear()
        .domain([0, 110]) // X 轴范围
        .range([margin.left, width - margin.right]);

      const yScale = d3
        .scaleLinear()
        .domain([0, 11000]) // Y 轴范围
        .range([height - margin.bottom, margin.top]);

      const sizeScale = d3
        .scaleSqrt()
        .domain([1, 50]) // 游戏数量范围
        .range([5, 30]);

      const opacityScale = d3
        .scaleLinear()
        .domain([trailStartIndex, currentStep]) // 仅显示起始到当前时间的踪迹
        .range([0.2, 1]);

      const circles = svg.selectAll(".trail-circle").data(data, (d) => `${d.time}-${d.category}`);

      circles
        .enter()
        .append("circle")
        .attr("class", "trail-circle")
        .merge(circles)
        .attr("cx", (d) => xScale(d.positivePercentage))
        .attr("cy", (d) => yScale(d.totalReviews))
        .attr("r", (d) => sizeScale(d.numberOfGames))
        .attr("fill", (d) => colorScale(d.category))
        .attr("opacity", (d) => {
          const timeIndex = this.timeSteps.indexOf(d.time);
          if (timeIndex < trailStartIndex || timeIndex > currentStep) {
            return 0; // 隐藏起始时间之前和未来时间的圆点
          }
          return opacityScale(timeIndex); // 根据时间调整透明度
        });

      circles.exit().remove();
    },
    updateChart() {
      const { svg, filteredData, width, height, margin, colorScale } = this;

      const xScale = d3
        .scaleLinear()
        .domain([0, 110])
        .range([margin.left, width - margin.right]);

      const yScale = d3
        .scaleLinear()
        .domain([0, 11000])
        .range([height - margin.bottom, margin.top]);

      const sizeScale = d3
        .scaleSqrt()
        .domain([1, 50])
        .range([5, 30]);

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

      const circles = svg.selectAll(".filtered-circle").data(filteredData, (d) => d.category);

      circles
        .exit()
        .transition()
        .duration(500)
        .attr("r", 0)
        .remove();

      const circlesEnter = circles
        .enter()
        .append("circle")
        .attr("class", "filtered-circle")
        .attr("r", 0)
        .attr("cx", (d) => xScale(d.positivePercentage))
        .attr("cy", (d) => yScale(d.totalReviews))
        .attr("fill", (d) => colorScale(d.category))
        .attr("opacity", 0.7);

      circlesEnter
        .merge(circles)
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
