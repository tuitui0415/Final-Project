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
      <div class="button-container">
        <button @click="toggleYAxisLock" class="action-btn">
          {{ isYAxisLocked ? "Unlock Y-Axis" : "Lock Y-Axis" }}
        </button>
        <button @click="saveSnapshot" class="action-btn" :disabled="!isYAxisLocked">
          Snapshot
        </button>
        <button @click="clearSnapshots" class="action-btn">Clear Snapshots</button>
      </div>
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
      data: [],
      filteredData: [],
      trailsData: [],
      svg: null,
      width: 0,
      height: 0,
      margin: { top: 80, right: 20, bottom: 120, left: 100 },
      timeSteps: [],
      startStep: 0,
      endStep: 0,
      colorScale: null,
      snapshots: [],
      selectedGenres: [],
      isYAxisLocked: false,
      yAxisLockValue: null,
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
    handleCircleClick(d) {
      this.hideTooltip();
      const startDate = this.timeSteps[this.startStep];
      const endDate = this.timeSteps[this.endStep];
      console.log("Selected Date Range:", startDate, "to", endDate);

      this.$router.push({ 
        name: 'DetailPlot', 
        params: { 
          genre: d.genre, 
          startDate: startDate, 
          endDate: endDate
        }
      });
    },
    toggleYAxisLock() {
      this.isYAxisLocked = !this.isYAxisLocked;
      if (this.isYAxisLocked) {
        const filteredForSelectedGenres = this.filteredData.filter((d) =>
          this.selectedGenres.includes(d.genre)
        );
        this.yAxisLockValue = d3.max(
          filteredForSelectedGenres,
          (d) => d.avgTotalReviews || 0
        );
      } else {
        this.yAxisLockValue = null;
      }

      this.updateChart();
    },
    setChartSize() {
      this.width = window.innerWidth - 300;
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
          release_date: new Date(d.release_date.trim()).toISOString().slice(0, 10),
          reclassified_genre: d.reclassified_genre.trim(),
          positive_ratings: +d.positive_ratings,
          negative_ratings: +d.negative_ratings,
        }));

        this.data = rawData;

        const dates = [...new Set(rawData.map((d) => d.release_date))].sort((a, b) =>
          new Date(a) - new Date(b)
        );
        this.timeSteps = dates;
        this.endStep = 0;

        console.log("Time Steps:", this.timeSteps);

        this.createColorScale();
        this.updateData();
        this.initLegend(); 
      } catch (error) {
        console.error("Error loading CSV data:", error);
      }
    },
    createColorScale() {
      const genres = Array.from(new Set(this.data.map((d) => d.reclassified_genre)));
      const colorPalette = [
        "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2",
        "#7f7f7f", "#bcbd22", "#17becf", "#393b79", "#637939", "#8c6d31", "#843c39",
        "#7b4173", "#5254a3", "#6b6ecf", "#9c9ede", "#6b6ecf", "#dbdb8d", "#393b79",
        "#122d36"
      ];

      this.colorScale = d3.scaleOrdinal().domain(genres).range(colorPalette);
      this.selectedGenres = genres;
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
        data: this.filteredData.filter((d) => this.selectedGenres.includes(d.genre)),
        startDate: this.timeSteps[this.startStep],
        endDate: this.timeSteps[this.endStep],
      };
      this.snapshots.push(snapshot);
      this.updateSnapshots(); 
    },
    updateSnapshots() {
      const { svg, snapshots, colorScale, width, height, margin } = this;

      const xScale = d3
        .scaleLinear()
        .domain([0, 100])
        .range([margin.left, width - margin.right]);

      const yScale = d3
        .scaleLinear()
        .domain([
        0,
        this.isYAxisLocked
          ? this.yAxisLockValue
          : d3.max(
              snapshots.flatMap((snapshot) =>
                snapshot.data.filter((d) => this.selectedGenres.includes(d.genre))
              ),
              (d) => d.avgTotalReviews || 0
            ),
      ])
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
        )
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
        .attr("fill", (d) => colorScale(d.genre))
        .attr("opacity", 1);

      snapshotCircles.exit().remove();

      svg.selectAll(".snapshot-circle")
        .on("mouseover", (event, d) => {
          this.tooltip
            .style("opacity", 1)
            .html(`
              <strong>${d.genre}</strong><br>
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
      this.svg.append("g").attr("class", "y-axis").attr("transform", `translate(${margin.left}, 0)`);

      this.tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    },
    initLegend() {
      const genres = this.colorScale.domain(); 
      const legendContainer = d3.select(this.$refs.legend);

      legendContainer.selectAll("*").remove();

      const legend = legendContainer
        .selectAll(".legend-item")
        .data(genres)
        .enter()
        .append("div")
        .attr("class", "legend-item")
        .style("cursor", "pointer")
        .on("click", (event, genre) => {
          if (this.selectedGenres.includes(genre)) {
            this.selectedGenres = this.selectedGenres.filter((g) => g !== genre);
          } else {
            this.selectedGenres.push(genre);
          }
          this.updateChart();
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

      legend
        .style("cursor", "pointer")
        .on("click", (event, genre) => {
          if (this.selectedGenres.includes(genre)) {
            this.selectedGenres = this.selectedGenres.filter((g) => g !== genre);
          } else {
            this.selectedGenres.push(genre);
          }
          this.updateChart();

          legend.style("opacity", (d) =>
            this.selectedGenres.includes(d) ? 1 : 0.4
          );
        })
        .style("opacity", (d) => (this.selectedGenres.includes(d) ? 1 : 0.4));
    },
    toggleGenre(genre) {

      if (this.selectedGenres.includes(genre)) {
        this.selectedGenres = this.selectedGenres.filter((g) => g !== genre);
      } else {
        this.selectedGenres.push(genre);
      }
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

      this.filteredData.sort((a, b) => b.count - a.count);

      this.updateChart();
      this.updateLegend();
    },
    updateLegend() {
      const legendContainer = d3.select(this.$refs.legend);
      const genreDataMap = new Map(this.filteredData.map(d => [d.genre, d]));
      const allGenres = this.colorScale.domain();
      const sortedGenres = allGenres.sort((a, b) => {
        const aVal = genreDataMap.has(a) ? genreDataMap.get(a).count : 0;
        const bVal = genreDataMap.has(b) ? genreDataMap.get(b).count : 0;
        return bVal - aVal;
      });

      const visibleGenres = sortedGenres.filter(genre => {
        const val = genreDataMap.has(genre) ? genreDataMap.get(genre).count : 0;
        return val > 0;
      });

      legendContainer.selectAll("*").remove();

      const legend = legendContainer
        .selectAll(".legend-item")
        .data(visibleGenres, d => d);

      const legendEnter = legend.enter()
        .append("div")
        .attr("class", "legend-item")
        .style("cursor", "pointer")
        .on("click", (event, genre) => {
          if (this.selectedGenres.includes(genre)) {
            this.selectedGenres = this.selectedGenres.filter(g => g !== genre);
          } else {
            this.selectedGenres.push(genre);
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
        .style("opacity", d => this.selectedGenres.includes(d) ? 1 : 0.4);

      legend.exit().remove();
    },

    updateChart() {
      const { svg, filteredData, selectedGenres, width, height, margin, colorScale } = this;

      const filteredForSelectedGenres = filteredData.filter((d) =>
        selectedGenres.includes(d.genre)
      );
      const xScale = d3
        .scaleLinear()
        .domain([0, 100])
        .range([margin.left, width - margin.right]);

      const yScale = d3
        .scaleLinear()
        .domain([
          0,
          this.isYAxisLocked
            ? this.yAxisLockValue
            : d3.max(
                filteredForSelectedGenres,
                (d) => d.avgTotalReviews || 0
              ),
        ])
        .range([height - margin.bottom, margin.top]);
      this.xScale = xScale;
      this.yScale = yScale;

      const sizeScale = d3
        .scaleLinear()
        .domain([0, d3.max(filteredForSelectedGenres, (d) => d.count || 0)])
        .range([5, 100]);

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


      this.updateSnapshots();
      const circles = svg.selectAll(".circle").data(filteredForSelectedGenres, (d) => d.genre);

      circles
      .exit()
      .transition()
      .duration(500)
      .attr("r", 0)
      .attr("opacity", 0)
      .remove();


      circles
        .enter()
        .append("circle")
        .attr("class", "circle")
        .attr("r", 0)
        .on("mouseover", this.showTooltip)
        .on("mouseout", this.hideTooltip)
        .on("click", (event, d) => {
          this.handleCircleClick(d);
        })
        .merge(circles)
        .transition()
        .duration(500)
        .attr("cx", (d) => xScale(d.avgPositiveRate))
        .attr("cy", (d) => yScale(d.avgTotalReviews))
        .attr("r", (d) => Math.sqrt(d.count) * 5)
        .attr("fill", (d) => colorScale(d.genre))
        .attr("opacity", 0.5);
      this.updateLegend();
    },
    showTooltip(event, d) {
      const tooltip = this.tooltip;
      const startDate = this.timeSteps[this.startStep];
      const endDate = this.timeSteps[this.endStep];
      tooltip.style("opacity", 1);
      tooltip
        .html(`
          <strong>${d.genre}</strong><br>
          Total Games: ${d.count}<br>
          Avg Positive Rate: ${d.avgPositiveRate.toFixed(2)}%<br>
          Avg Total Reviews: ${d.avgTotalReviews.toFixed(2)}<br>
          Time Range: ${startDate} - ${endDate} <!-- 显示时间段 -->
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

