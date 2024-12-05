<template>
  <div class="container">
    <h2>Steam Game Development Helper</h2>
    <div class="controls">
      <label for="start-slider" class="slider-label">Start Time:</label>
      <div class="slider-container">
        <input
          id="start-slider"
          class="custom-slider"
          type="range"
          :min="0"
          :max="timeSteps.length - 1"
          step="1"
          v-model="startStep"
          @input="updateData"
        />
        <span class="slider-value">{{ timeSteps[startStep] }}</span>
      </div>

      <label for="end-slider" class="slider-label">End Time:</label>
      <div class="slider-container">
        <input
          id="end-slider"
          class="custom-slider"
          type="range"
          :min="startStep"
          :max="timeSteps.length - 1"
          step="1"
          v-model="endStep"
          @input="updateData"
        />
        <span class="slider-value">{{ timeSteps[endStep] }}</span>
      </div>

      <button @click="toggleTrails" class="toggle-trails-btn">
        {{ showTrails ? "Stop Trails" : "Start Trails" }}
      </button>
    </div>

    <div class="chart-container">
      <svg ref="chart"></svg>
      <div ref="legend" class="legend-container"></div>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";

export default {
  data() {
    return {
      data: [], // 原始数据
      filteredData: [], // 当前时间步的数据
      trailsData: [], // 累积轨迹的数据
      svg: null, // SVG 容器
      width: 0,
      height: 0,
      margin: { top: 80, right: 20, bottom: 120, left: 100 },
      timeSteps: [], // 时间步
      startStep: 0, // 时间轴的起始索引
      endStep: 0, // 时间轴的结束索引
      colorScale: null, // genre 映射到颜色的比例尺
      showTrails: false, // 是否显示 Trails
      selectedGenres: [], // 被选中的 genre 列表
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
      this.width = window.innerWidth - 300; // 为 legend 留出 250px
      this.height = window.innerHeight - 200;
      this.margin = { top: 80, right: 20, bottom: 120, left: 100 };
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
        this.endStep = 0;

        console.log("Time Steps:", this.timeSteps);

        // 初始化颜色比例尺
        this.createColorScale();
        this.updateData();
        this.initLegend(); // 初始化 legend
      } catch (error) {
        console.error("Error loading CSV data:", error);
      }
    },
    createColorScale() {
  const genres = Array.from(new Set(this.data.map((d) => d.reclassified_genre)));

  // 使用更大的调色板
  const colorPalette = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2",
    "#7f7f7f", "#bcbd22", "#17becf", "#393b79", "#637939", "#8c6d31", "#843c39",
    "#7b4173", "#5254a3", "#6b6ecf", "#9c9ede", "#6b6ecf", "#dbdb8d", "#393b79",
    "#122d36"
  ];

  // 循环颜色以应对更多分类
  this.colorScale = d3.scaleOrdinal().domain(genres).range(colorPalette);
  this.selectedGenres = genres; // 初始化为所有 genre
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
    initLegend() {
      const genres = this.colorScale.domain(); // 获取所有的 genre
      const legendContainer = d3.select(this.$refs.legend);

      // 清空之前的 legend
      legendContainer.selectAll("*").remove();

      const legend = legendContainer
    .selectAll(".legend-item")
    .data(genres)
    .enter()
    .append("div")
    .attr("class", "legend-item")
    .style("cursor", "pointer") // 添加鼠标指针样式
    .on("click", (event, genre) => {
      if (this.selectedGenres.includes(genre)) {
        this.selectedGenres = this.selectedGenres.filter((g) => g !== genre);
      } else {
        this.selectedGenres.push(genre);
      }
      this.updateChart(); // 更新图表
    });

      // 添加颜色方块
      legend
        .append("div")
        .style("background-color", (d) => this.colorScale(d))
        .style("width", "15px")
        .style("height", "15px")
        .style("margin-right", "10px");

      // 添加文字
      legend
        .append("span")
        .text((d) => d)
        .style("color", "#c7d5e0")
        .style("font-size", "14px");

        legend
  .style("cursor", "pointer") // 鼠标指针样式
  .on("click", (event, genre) => {
    if (this.selectedGenres.includes(genre)) {
      this.selectedGenres = this.selectedGenres.filter((g) => g !== genre);
    } else {
      this.selectedGenres.push(genre);
    }
    this.updateChart(); // 更新图表

    // 更新 legend 样式
    legend.style("opacity", (d) =>
      this.selectedGenres.includes(d) ? 1 : 0.4
    );
  })
  .style("opacity", (d) => (this.selectedGenres.includes(d) ? 1 : 0.4)); // 初始样式

    },
    toggleGenre(genre) {
  // 切换选中状态
    if (this.selectedGenres.includes(genre)) {
    this.selectedGenres = this.selectedGenres.filter((g) => g !== genre);
  } else {
    this.selectedGenres.push(genre);
  }

  // 更新图表
  this.updateChart();
},

    toggleTrails() {
      this.showTrails = !this.showTrails;
      this.updateData();
    },
    updateData() {
      const startDate = this.timeSteps[this.startStep];
      const endDate = this.timeSteps[this.endStep];
      console.log("Selected Date Range:", startDate, "to", endDate);

      const cumulativeDates = this.timeSteps.filter(
        (date) => new Date(date) >= new Date(startDate) && new Date(date) <= new Date(endDate)
      );

      const cumulativeGames = this.data.filter((d) => cumulativeDates.includes(d.release_date));

      const genreStats = d3.rollups(
        cumulativeGames,
        (games) => ({
          count: games.length,
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

      this.updateChart();
    },
    updateChart() {
  const { svg, filteredData, selectedGenres, width, height, margin, colorScale } = this;

  // 过滤只显示选中 genre 的数据
  const filteredForSelectedGenres = filteredData.filter((d) =>
    selectedGenres.includes(d.genre)
  );

  const xScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([margin.left, width - margin.right]);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(filteredForSelectedGenres, (d) => d.avgTotalReviews || 0)])
    .range([height - margin.bottom, margin.top]);

  const sizeScale = d3
    .scaleLinear()
    .domain([0, d3.max(filteredForSelectedGenres, (d) => d.count || 0)])
    .range([5, 100]);

  // 更新 X 轴
  svg
    .select(".x-axis")
    .call(d3.axisBottom(xScale).ticks(10).tickFormat((d) => `${d}%`))
    .selectAll("text")
    .style("fill", "#c7d5e0")
    .style("font-size", "14px");

  // 更新 Y 轴
  svg
    .select(".y-axis")
    .call(d3.axisLeft(yScale).ticks(5))
    .selectAll("text")
    .style("fill", "#c7d5e0")
    .style("font-size", "14px");

  // 渲染圆点
  const circles = svg.selectAll(".circle").data(filteredForSelectedGenres, (d) => d.genre);

  circles
  .exit()
  .transition()
  .duration(500) // 动画持续时间
  .attr("r", 0) // 圆形半径缩小为 0
  .attr("opacity", 0) // 圆形逐渐消失
  .remove(); // 完全移除


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
    .attr("r", (d) => Math.sqrt(d.count) * 5)
    .attr("fill", (d) => colorScale(d.genre))
    .attr("opacity", 0.9);
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
  },
};
</script>

