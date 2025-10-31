<script setup lang="ts">
import vueLogoUrl from './assets/vue.svg';
import RemotePreview from './pages/RemotePreview.vue';
</script>

<template>
  <div>
    <a href="https://vuejs.org/" target="_blank">
      <img :src="vueLogoUrl" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <RemotePreview />
</template>

<style scoped></style>
