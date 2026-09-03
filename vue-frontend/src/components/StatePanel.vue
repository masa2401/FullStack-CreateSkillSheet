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
    <div class="w-full max-w-xl rounded-xl border bg-card p-8 text-center shadow-sm sm:p-12">
      <div class="mb-4 flex justify-center text-muted-foreground">
        <slot name="icon" />
      </div>
      <slot name="lead" />
      <h2
        data-slot="state-panel-title"
        class="text-2xl font-bold"
      >
        {{ title }}
      </h2>
      <p class="mt-3 leading-relaxed text-muted-foreground">
        <slot name="message" />
      </p>
      <div class="mt-8 flex justify-center">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
