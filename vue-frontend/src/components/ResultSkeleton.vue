<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div
    data-slot="result-skeleton"
    role="status"
    aria-label="データを読み込んでいます"
    aria-live="polite"
  >
    <span class="sr-only">データを読み込んでいます</span>

    <Card
      class="gap-4"
      aria-hidden="true"
    >
      <CardHeader>
        <div class="flex items-center justify-center gap-2">
          <Skeleton class="size-8 shrink-0 rounded-full" />
          <Skeleton class="h-7 w-48 max-w-full" />
        </div>
      </CardHeader>
      <CardContent class="space-y-6">
        <div
          v-for="question in 2"
          :key="question"
          class="space-y-3"
        >
          <Skeleton class="h-5 w-full max-w-md" />
          <div
            v-for="answer in 3"
            :key="answer"
            class="border-border flex items-center justify-between gap-4 border-l-2 py-1 pl-3 max-sm:flex-col max-sm:items-stretch max-sm:gap-1"
          >
            <Skeleton class="h-5 w-full max-w-56" />
            <Skeleton class="h-5 w-24 shrink-0 max-sm:w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
