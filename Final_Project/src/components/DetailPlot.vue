<template>
  <div>
    <h1>Details for {{ genre }}</h1>
    <!-- Another D3 or chart code to display details goes here -->
  </div>
</template>

<script>
export default {
  props: ['genre'],
  mounted() {
    // Use this.genre to fetch or filter data and create your second visualization.
  }
}
</script>