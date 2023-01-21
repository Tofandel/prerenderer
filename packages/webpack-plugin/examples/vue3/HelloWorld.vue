<script>
export default {
  // Properties returned from data() become reactive state
  // and will be exposed on `this`.
  data() {
    return {
      count: 0,
      interval: null,
    }
  },

  // Methods are functions that mutate state and trigger updates.
  // They can be bound as event listeners in templates.
  methods: {
    increment() {
      this.count++
    }
  },

  watch: {
    count(c) {
      if (c === 3) {
        document.dispatchEvent(new CustomEvent('render'))
      }
    }
  },

  // Lifecycle hooks are called at different stages
  // of a component's lifecycle.
  // This function will be called when the component is mounted.
  mounted() {
    this.interval = setInterval(() => this.increment(), 1000)
  },

  unmounted() {
    clearInterval(this.interval)
  }
}
</script>

<template>
  <button @click="increment">Count is: {{ count }}</button>
</template>
