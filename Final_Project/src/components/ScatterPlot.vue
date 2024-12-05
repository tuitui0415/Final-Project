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

export default {
  data() {
    return {
      data: [], // 原始数据
      filteredData: [], // 当前时间步的数据
      svg: null, // SVG 容器
      width: 0,
      height: 0,
      margin: { top: 80, right: 100, bottom: 80, left: 100 },
      timeSteps: [], // 时间步
      currentStep: 0, // 当前时间步索引
      colorScale: null, // genre 映射到颜色的比例尺
      showTrails: false, // 是否显示 Trails
      trailStartIndex: null, // Trails 的起始索引
    };
  },
  mounted() {
    this.setChartSize();
    this.loadCSVData();
    this.initChart();

    window.addEventListener("resize", this.resizeChart);
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
    async loadCSVData() {
      try {
        const rawData = await d3.csv("/data/game_with_review.csv", (d) => ({
          appid: parseInt(d.appid),
          name: d.name.trim(),
          release_date: new Date(d.release_date.trim()).toISOString().slice(0, 10), // 标准化日期
          reclassified_genre: d.reclassified_genre.trim(),
          positive_ratings: +d.positive_ratings,
          negative_ratings: +d.negative_ratings,
        }));

        this.data = rawData;

        // 生成时间步
        const dates = [...new Set(rawData.map((d) => d.release_date))].sort((a, b) =>
          new Date(a) - new Date(b)
        );
        this.timeSteps = dates;

        console.log("Time Steps:", this.timeSteps);

        // 初始化颜色比例尺
        this.createColorScale();
        this.updateData();
      } catch (error) {
        console.error("Error loading CSV data:", error);
      }
    },
    createColorScale() {
      const genres = Array.from(new Set(this.data.map((d) => d.reclassified_genre)));
      this.colorScale = d3.scaleOrdinal().domain(genres).range(d3.schemeTableau10);
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
        this.trailStartIndex = this.currentStep;
      } else {
        this.trailStartIndex = null;
        this.updateTrails();
      }
      this.updateData();
    },
    updateData() {
      const currentDate = this.timeSteps[this.currentStep];
      console.log("Slider shows:", currentDate);

      const cumulativeDates = this.timeSteps.filter(
        (date) => new Date(date) <= new Date(currentDate)
      );
      console.log("Cumulative Dates:", cumulativeDates);

      const cumulativeGames = this.data.filter((d) => cumulativeDates.includes(d.release_date));
      console.log("Games filtered for current step:", cumulativeGames.length);

      const genreStats = d3.rollups(
        cumulativeGames,
        (games) => ({
          count: games.length, // 累积的游戏总数
          avgPositiveRate: d3.mean(
            games,
            (g) => (g.positive_ratings / (g.positive_ratings + g.negative_ratings)) * 100
          ),
          avgTotalReviews: d3.mean(games, (g) => g.positive_ratings + g.negative_ratings),
        }),
        (d) => d.reclassified_genre
      );

      this.filteredData = genreStats.map(([genre, stats]) => ({
        genre,
        ...stats,
      }));

      console.log("Filtered Data:", this.filteredData);

      this.updateTrails();
      this.updateChart();
    },
    updateTrails() {
      const { svg, margin, colorScale, showTrails, trailStartIndex, currentStep } = this;

      if (!showTrails || trailStartIndex === null) {
        svg.selectAll(".trail-circle").attr("opacity", 0);
        return;
      }

      const xScale = d3
        .scaleLinear()
        .domain([0, 100]) // 好评率范围
        .range([margin.left, this.width - margin.right]);

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(this.filteredData, (d) => d.avgTotalReviews)])
        .range([this.height - margin.bottom, margin.top]);

      const opacityScale = d3
        .scaleLinear()
        .domain([trailStartIndex, currentStep]) // 起点到当前时间步的透明度
        .range([0.2, 1]);

      svg
        .selectAll(".trail-circle")
        .data(this.filteredData)
        .join("circle")
        .attr("class", "trail-circle")
        .attr("cx", (d) => xScale(d.avgPositiveRate))
        .attr("cy", (d) => yScale(d.avgTotalReviews))
        .attr("r", 10)
        .attr("fill", (d) => colorScale(d.genre))
        .attr("opacity", (d) => {
          const timeIndex = this.timeSteps.indexOf(d.release_date);
          return timeIndex >= trailStartIndex && timeIndex <= currentStep
            ? opacityScale(timeIndex)
            : 0;
        });
    },
    showTooltip(event, d) {
      const tooltip = this.tooltip;
      tooltip.style("opacity", 1);
      tooltip
        .html(`
          <strong>${d.genre}</strong><br>
          Total Games: ${d.count}<br>
          Avg Positive Rate: ${d.avgPositiveRate.toFixed(2)}%<br>
          Avg Total Reviews: ${d.avgTotalReviews.toFixed(2)}
        `)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 10}px`);
    },
    hideTooltip() {
      this.tooltip.style("opacity", 0);
    },
    updateChart() {
      const { svg, filteredData, width, height, margin, colorScale } = this;

      const xScale = d3
        .scaleLinear()
        .domain([0, 100]) // X轴：好评率
        .range([margin.left, width - margin.right]);

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(filteredData, (d) => d.avgTotalReviews || 0)]) // Y轴：评论总数
        .range([height - margin.bottom, margin.top]);

      const sizeScale = d3
        .scaleSqrt()
        .domain([0, d3.max(filteredData, (d) => d.count || 0)]) // 游戏数量范围
        .range([5, 80]); // 圆点大小范围

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

      const circles = svg.selectAll(".circle").data(filteredData, (d) => d.genre);

      circles.exit().remove();

      circles
        .enter()
        .append("circle")
        .attr("class", "circle")
        .attr("r", 0)
        .on("mouseover", this.showTooltip)
        .on("mouseout", this.hideTooltip)
        .merge(circles)
        .transition()
        .duration(500)
        .attr("cx", (d) => xScale(d.avgPositiveRate))
        .attr("cy", (d) => yScale(d.avgTotalReviews))
        .attr("r", (d) => sizeScale(d.count)) // 使用 count 调整大小
        .attr("fill", (d) => colorScale(d.genre))
        .attr("opacity", 0.7);
    },
  },
};
</script>
