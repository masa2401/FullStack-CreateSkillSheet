<script setup lang="ts">
interface Props {
  title: string
}

defineProps<Props>()
</script>

<template>
  <div
    data-slot="state-panel"
    class="flex flex-1 items-center justify-center px-4 py-16"
  >
    <div class="bg-card w-full max-w-xl rounded-xl border p-8 text-center shadow-sm sm:p-12">
      <div class="text-muted-foreground mb-4 flex justify-center">
        <slot name="icon" />
      </div>
      <slot name="lead" />
      <h2
        data-slot="state-panel-title"
        class="text-2xl font-bold"
      >
        {{ title }}
      </h2>
      <p class="text-muted-foreground mt-3 leading-relaxed">
        <slot name="message" />
      </p>
      <div class="mt-8 flex justify-center">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
