<script setup lang="ts">
import { LEVEL_LABELS } from '@/utils/constants'
</script>

<template>
  <ul
    class="mx-auto grid w-fit gap-1 text-sm text-muted-foreground md:grid-flow-col md:grid-rows-3 md:gap-x-8 print:grid-flow-col print:grid-rows-3 print:gap-x-8"
  >
    <li
      v-for="level in LEVEL_LABELS"
      :key="level.stars"
    >
      {{ level.stars }}： {{ level.text }}
    </li>
  </ul>
</template>
