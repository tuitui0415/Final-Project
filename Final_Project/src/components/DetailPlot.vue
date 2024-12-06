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
      snapshots: [], // 保存的快照数据
      selectedGenres: [], // 被选中的 genre 列表
      isYAxisLocked: false, // 是否锁定 Y 轴
      yAxisLockValue: null, // 锁定 Y 轴时的最大值
    };
  },
  mounted() {
    // Retrieve parameters from the route
    this.genre = this.$route.params.genre;
    this.startDate = new Date(this.$route.params.startDate.trim()).toISOString().slice(0, 10);
    this.endDate = new Date(this.$route.params.endDate.trim()).toISOString().slice(0, 10);

    this.setChartSize();
    this.loadCSVData();
    //this.initChart();
  },
  methods: {
    setChartSize() {
      this.width = window.innerWidth - 300; // 为 legend 留出 250px
      this.height = window.innerHeight - 200;
      this.margin = { top: 80, right: 20, bottom: 120, left: 100 };
    },
    async loadCSVData() {
      try {
        const rawData = await d3.csv("/data/game_with_review.csv", (d) => ({
          appid: parseInt(d.appid),
          name: d.name.trim(),
          release_date: new Date(d.release_date.trim()).toISOString().slice(0, 10), // 标准化日期
          genre: d.reclassified_genre.trim(),
          positive_ratings: +d.positive_ratings,
          negative_ratings: +d.negative_ratings,
        }));

        this.data = rawData.filter(game => 
          (game.genre === this.genre) &&
          (game.release_date >= this.startDate) &&
          (game.release_date <= this.endDate)
        );
        console.log("new data: ", this.data);

        // 生成时间步
        const dates = [...new Set(rawData.map((d) => d.release_date))].sort((a, b) =>
          new Date(a) - new Date(b)
        );
        this.timeSteps = dates;
        this.endStep = 0;

        console.log("Time Steps:", this.timeSteps);

        // 初始化颜色比例尺
        //this.createColorScale();
        //this.updateData();
        //this.initLegend(); // 初始化 legend
      } catch (error) {
        console.error("Error loading CSV data:", error);
      }
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
  },
};
</script>

<style scoped>
.container {
  text-align: center;
}
</style>
