<template>
  <div class="container">
    <h2>Details for {{ genre }} ({{ startDate }} - {{ endDate }})</h2>
    <div class="controls">
      <div class="button-container">
        <button @click="$router.push({ name: 'Home' })" class="action-btn">Back</button>
        <button @click="toggleBulletScreen" class="action-btn">
    {{ isBulletPlaying ? "Pause Bullets" : "Play Bullets" }}
  </button>
      </div>
    </div>
    <div class="chart-container">
      <svg ref="chart"></svg>
      <div ref="legend" class="legend-container"></div>
      <div ref="bulletScreen" class="bullet-screen-container"></div>
    </div>
    

    <PieChart
      v-if="showPieChart"
      :data="pieChartData"
      :title="pieChartTitle"
      @close="closePieChart"
    />
  </div>
</template>

<script>
import * as d3 from "d3";
import PieChart from "/src/components/PieChart.vue";

export default {
  components: {
    PieChart,
  },
  data() {
    return {
      genre: null,
      startDate: null,
      endDate: null,
      data: [],
      filteredData: [], 
      svg: null, 
      width: 0,
      height: 0,
      margin: { top: 80, right: 20, bottom: 120, left: 100 },
      colorScale: null,
      snapshots: [],
      selectedGameTypes: [],
      isYAxisLocked: false,
      yAxisLockValue: null,
      showPieChart: false,
      pieChartData: [],
      pieChartTitle: "",
      fullReviews: [],
      isBulletPlaying: true,
      bulletTimeouts: [],
    };
  },
  mounted() {
    this.genre = this.$route.params.genre;
    this.startDate = new Date(this.$route.params.startDate.trim()).toISOString().slice(0, 10);
    this.endDate = new Date(this.$route.params.endDate.trim()).toISOString().slice(0, 10);

    this.setChartSize();
    this.loadCSVData();
    this.initChart();

    window.addEventListener("resize", this.resizeChart);
    
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resizeChart);
  },
  methods: {
    showGamePieChart(gameType) {
      const mostReviewedGame = this.data
        .filter((d) => d.game_type === gameType)
        .reduce((max, game) =>
          game.positive_ratings + game.negative_ratings >
          max.positive_ratings + max.negative_ratings
            ? game
            : max,
          { positive_ratings: 0, negative_ratings: 0 }
        );

      if (!mostReviewedGame) return;

      this.pieChartData = [
        { category: "Positive", value: mostReviewedGame.positive_ratings },
        { category: "Negative", value: mostReviewedGame.negative_ratings },
      ];
      this.pieChartTitle = `Most Reviewed Game: ${mostReviewedGame.name}`;
      this.showPieChart = true;
    },
    closePieChart() {
      this.showPieChart = false;
    },
    setChartSize() {
      this.width = window.innerWidth - 300; 
      this.height = window.innerHeight - 200;
      this.margin = { top: 80, right: 20, bottom: 120, left: 100 };
    },
    toggleBulletScreen() {
    this.isBulletPlaying = !this.isBulletPlaying;

    if (this.isBulletPlaying) {
      this.bulletTimeouts.forEach((timeout) => clearTimeout(timeout));
      this.bulletTimeouts = [];
    } else {
      this.displayBulletScreen(this.currentAppId);
    }
  },
    getReviewsByAppId(appid) {
    return this.fullReviews.filter((review) => review.app_id === appid);
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
          release_date: new Date(d.release_date.trim()).toISOString().slice(0, 10),
          genre: d.reclassified_genre.trim(),
          positive_ratings: +d.positive_ratings,
          negative_ratings: +d.negative_ratings,
          game_type: d.game_type.trim(),
        }));

        const reviewData = await d3.csv("/data/full_user_review10.csv", (d) => ({
      app_id: parseInt(d.app_id), 
      review_text: d.review_text.trim(),
      review_score: parseInt(d.review_score), 
    }));
        this.data = rawData.filter(
          (game) =>
            game.genre === this.genre &&
            game.release_date >= this.startDate &&
            game.release_date <= this.endDate
        );
        this.fullReviews = reviewData;

        this.createColorScale();

        this.updateData();

        this.initLegend();
      } catch (error) {
        console.error("Error loading CSV data:", error);
      }
    },
    displayBulletScreen(appid) {
  const reviews = this.getReviewsByAppId(appid);
  const bulletScreen = this.$refs.bulletScreen;

  bulletScreen.innerHTML = "";
  this.bulletTimeouts.forEach((timeout) => clearTimeout(timeout));
  this.bulletTimeouts = [];

  let delay = 0;
  const fixedSpeed = 100;

  reviews.forEach((review, index) => {
    const timeoutId = setTimeout(() => {
      if (!this.isBulletPlaying) return;

      const div = document.createElement("div");
      div.className = "bullet-screen-text";
      const textWidth = div.offsetWidth || review.review_text.length * 10;
      const screenWidth = bulletScreen.offsetWidth || window.innerWidth;
      const animationDuration = (textWidth + screenWidth) / fixedSpeed;

      div.style.animationDuration = `${animationDuration}s`;
      div.style.top = `${Math.random() * 80 + 10}%`;
      div.textContent = review.review_text;

      bulletScreen.appendChild(div);
      div.addEventListener("animationend", () => {
        bulletScreen.removeChild(div);
      });
    }, delay);

    this.bulletTimeouts.push(timeoutId);

    delay += 2000;
  });
},
    createColorScale() {
      const gameTypes = Array.from(new Set(this.data.map((d) => d.game_type)));
      const colorPalette = [
        "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b",
        "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
      ];
      this.colorScale = d3.scaleOrdinal().domain(gameTypes).range(colorPalette);
      this.selectedGameTypes = gameTypes;
    },
    toggleYAxisLock() {
      this.isYAxisLocked = !this.isYAxisLocked;

      if (this.isYAxisLocked) {
        const filteredForSelected = this.filteredData.filter((d) =>
          this.selectedGameTypes.includes(d.game_type)
        );
        this.yAxisLockValue = d3.max(
          filteredForSelected,
          (d) => d.avgTotalReviews || 0
        );
      } else {
        this.yAxisLockValue = null;
      }

      this.updateChart();
    },
    clearSnapshots() {
      this.snapshots = [];
      this.updateSnapshots();
    },
    saveSnapshot() {
      if (!this.isYAxisLocked) {
        alert("Please lock the Y-Axis before taking a snapshot.");
        return;
      }

      const snapshot = {
        data: this.filteredData.filter((d) =>
          this.selectedGameTypes.includes(d.game_type)
        ),
        startDate: this.startDate,
        endDate: this.endDate,
      };
      this.snapshots.push(snapshot);
      this.updateSnapshots();
    },
    updateSnapshots() {
      const { svg, snapshots, colorScale, width, height, margin } = this;

      const xScale = d3.scaleLinear().domain([0, 100]).range([margin.left, width - margin.right]);
      const yMax = this.isYAxisLocked
        ? this.yAxisLockValue
        : d3.max(snapshots.flatMap((snapshot) =>
            snapshot.data.filter((d) => this.selectedGameTypes.includes(d.game_type))
          ), (d) => d.avgTotalReviews || 0
        );

      const yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([height - margin.bottom, margin.top]);

      const snapshotCircles = svg
        .selectAll(".snapshot-circle")
        .data(
          snapshots.flatMap((snapshot) =>
            snapshot.data.map((d) => ({
              ...d,
              startDate: snapshot.startDate,
              endDate: snapshot.endDate,
            }))
          ),
          d => d.game_type + d.startDate + d.endDate
        );

      snapshotCircles
        .enter()
        .append("circle")
        .attr("class", "snapshot-circle")
        .attr("r", 0)
        .merge(snapshotCircles)
        .attr("cx", (d) => xScale(d.avgPositiveRate))
        .attr("cy", (d) => yScale(d.avgTotalReviews))
        .attr("r", (d) => Math.sqrt(d.count) * 5)
        .attr("fill", (d) => colorScale(d.game_type))
        .attr("opacity", 1);

      snapshotCircles.exit().remove();

      svg.selectAll(".snapshot-circle")
        .on("mouseover", (event, d) => {
          this.tooltip
            .style("opacity", 1)
            .html(`
              <strong>${d.game_type}</strong><br>
              Total Games: ${d.count}<br>
              Avg Positive Rate: ${d.avgPositiveRate.toFixed(2)}%<br>
              Avg Total Reviews: ${d.avgTotalReviews.toFixed(2)}<br>
              Time Range: ${d.startDate} - ${d.endDate}
            `)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 10}px`);
        })
        .on("mouseout", () => {
          this.tooltip.style("opacity", 0);
        });
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

      this.svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left}, 0)`);

      this.tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    },
    initLegend() {
      const gameTypes = this.colorScale.domain();
      const legendContainer = d3.select(this.$refs.legend);
      legendContainer.selectAll("*").remove();

      const legend = legendContainer
        .selectAll(".legend-item")
        .data(gameTypes)
        .enter()
        .append("div")
        .attr("class", "legend-item")
        .style("cursor", "pointer")
        .on("click", (event, gt) => {
          if (this.selectedGameTypes.includes(gt)) {
            this.selectedGameTypes = this.selectedGameTypes.filter((g) => g !== gt);
          } else {
            this.selectedGameTypes.push(gt);
          }
          this.updateChart();
          this.updateLegend();
        });

      legend
        .append("div")
        .style("background-color", (d) => this.colorScale(d))
        .style("width", "15px")
        .style("height", "15px")
        .style("margin-right", "10px");

      legend
        .append("span")
        .text((d) => d)
        .style("color", "#c7d5e0")
        .style("font-size", "14px");

      legend.style("opacity", (d) => this.selectedGameTypes.includes(d) ? 1 : 0.4);
    },
    updateLegend() {
      const legendContainer = d3.select(this.$refs.legend);

      const typeDataMap = new Map(this.filteredData.map(d => [d.game_type, d]));

      const allGameTypes = this.colorScale.domain();
      const sortedGameTypes = allGameTypes.sort((a, b) => {
        const aVal = typeDataMap.has(a) ? typeDataMap.get(a).count : 0;
        const bVal = typeDataMap.has(b) ? typeDataMap.get(b).count : 0;
        return bVal - aVal;
      });

      const visibleGameTypes = sortedGameTypes.filter(gt => {
        const val = typeDataMap.has(gt) ? typeDataMap.get(gt).count : 0;
        return val > 0;
      });

      legendContainer.selectAll("*").remove();

      const legend = legendContainer
        .selectAll(".legend-item")
        .data(visibleGameTypes, d => d);

      const legendEnter = legend.enter()
        .append("div")
        .attr("class", "legend-item")
        .style("cursor", "pointer")
        .on("click", (event, gt) => {
          if (this.selectedGameTypes.includes(gt)) {
            this.selectedGameTypes = this.selectedGameTypes.filter(g => g !== gt);
          } else {
            this.selectedGameTypes.push(gt);
          }
          this.updateChart();
          this.updateLegend();
        });

      legendEnter.append("div")
        .style("background-color", d => this.colorScale(d))
        .style("width", "15px")
        .style("height", "15px")
        .style("margin-right", "10px");

      legendEnter.append("span")
        .text(d => d)
        .style("color", "#c7d5e0")
        .style("font-size", "14px");

      legendEnter.merge(legend)
        .style("opacity", d => this.selectedGameTypes.includes(d) ? 1 : 0.4);

      legend.exit().remove();
    },
    updateData() {
      const gameTypeStats = d3.rollups(
        this.data,
        (games) => ({
          count: games.length,
          avgPositiveRate: d3.mean(games, (g) => (g.positive_ratings / (g.positive_ratings + g.negative_ratings)) * 100),
          avgTotalReviews: d3.mean(games, (g) => g.positive_ratings + g.negative_ratings),
        }),
        (d) => d.game_type
      );

      this.filteredData = gameTypeStats.map(([game_type, stats]) => ({
        game_type,
        ...stats,
      }));
      this.filteredData.sort((a, b) => b.count - a.count);

      this.updateChart();
      this.updateLegend();
    },
    updateChart() {
      const { svg, filteredData, selectedGameTypes, width, height, margin, colorScale } = this;

      const filteredForSelected = filteredData.filter((d) =>
        selectedGameTypes.includes(d.game_type)
      );

      const xScale = d3.scaleLinear().domain([0, 100]).range([margin.left, width - margin.right]);
      const yMax = this.isYAxisLocked
        ? this.yAxisLockValue
        : d3.max(filteredForSelected, (d) => d.avgTotalReviews || 0);

      const yScale = d3.scaleLinear().domain([0, yMax]).range([height - margin.bottom, margin.top]);
      this.xScale = xScale;
      this.yScale = yScale;

      svg.select(".x-axis")
        .call(d3.axisBottom(xScale).ticks(10).tickFormat((d) => `${d}%`))
        .selectAll("text")
        .style("fill", "#c7d5e0")
        .style("font-size", "14px");

      svg.select(".y-axis")
        .call(d3.axisLeft(yScale).ticks(5))
        .selectAll("text")
        .style("fill", "#c7d5e0")
        .style("font-size", "14px");

      this.updateSnapshots();

      const circles = svg.selectAll(".circle").data(filteredForSelected, d => d.game_type);

      circles.exit()
        .transition()
        .duration(500)
        .attr("r", 0)
        .attr("opacity", 0)
        .remove();

      circles.enter()
        .append("circle")
        .attr("class", "circle")
        .attr("r", 0)

        .on("click", (event, d) => {
          
    const mostReviewedGame = this.data.find((game) => game.game_type === d.game_type);
    if (mostReviewedGame) {
      this.displayBulletScreen(mostReviewedGame.appid);
    }
    this.showGamePieChart(d.game_type);
  })
        .on("mouseover", this.showTooltip)
        .on("mouseout", this.hideTooltip)
        .merge(circles)
        .transition()
        .duration(500)
        .attr("cx", d => xScale(d.avgPositiveRate))
        .attr("cy", d => yScale(d.avgTotalReviews))
        .attr("r", d => Math.sqrt(d.count) * 5)
        .attr("fill", d => colorScale(d.game_type))
        .attr("opacity", 0.5);
    },
    showTooltip(event, d) {
      this.tooltip
        .style("opacity", 1)
        .html(`
          <strong>${d.game_type}</strong><br>
          Total Games: ${d.count}<br>
          Avg Positive Rate: ${d.avgPositiveRate.toFixed(2)}%<br>
          Avg Total Reviews: ${d.avgTotalReviews.toFixed(2)}<br>
          Time Range: ${this.startDate} - ${this.endDate}
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

<style scoped>
.container {
  text-align: center;
}

.chart-container {
  padding-top: 135px;
}
</style>
