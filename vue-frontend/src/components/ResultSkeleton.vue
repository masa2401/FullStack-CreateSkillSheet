<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div
    data-slot="result-skeleton"
    class="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:py-14"
    role="status"
    aria-label="データを読み込んでいます"
    aria-live="polite"
  >
    <span class="sr-only">データを読み込んでいます</span>

    <Card aria-hidden="true">
      <CardContent class="space-y-4">
        <div class="flex justify-center">
          <Skeleton class="h-9 w-72 max-w-full sm:h-10" />
        </div>
        <div class="mx-auto w-fit space-y-2">
          <Skeleton
            v-for="level in 5"
            :key="level"
            class="h-4 w-56 max-w-full"
          />
        </div>
      </CardContent>
    </Card>

    <div
      class="mt-8 space-y-6"
      aria-hidden="true"
    >
      <Card
        v-for="category in 2"
        :key="category"
        class="gap-4"
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

    <div
      class="mt-10 flex flex-wrap justify-center gap-4 max-sm:flex-col print:hidden"
      aria-hidden="true"
    >
      <Skeleton
        v-for="action in 3"
        :key="action"
        class="h-10 w-44 max-sm:w-full"
      />
    </div>
  </div>
</template>
