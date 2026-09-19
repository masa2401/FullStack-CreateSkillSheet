<script setup lang="ts">
import { Check, Lightbulb, MousePointer } from '@lucide/vue'

import AnimatedIconButton from '@/components/AnimatedIconButton.vue'
import { resolveCategoryIcon } from '@/components/icons/categoryIcons'
import { useAppNavigation } from '@/composables/useAppNavigation'
import { CATEGORY_MASTERS } from '@/data/questions'
import { useSurveyStore } from '@/stores/useSurveyStore'

const store = useSurveyStore()

/** トップで選ぶ職種カテゴリ。常に回答する共通カテゴリ（isCheckedByDefault）は除く */
const selectableCategories = CATEGORY_MASTERS.filter((c) => !c.isCheckedByDefault)

const isCategoryChecked = (categoryId: number): boolean =>
  store.selections.find((c) => c.categoryId === categoryId)?.isChecked ?? false

const toggleCategory = (categoryId: number, event: Event): void => {
  store.setCategoryChecked(categoryId, (event.target as HTMLInputElement).checked)
}

const { goToSurvey } = useAppNavigation()
</script>

<template>
  <div
    class="mx-auto my-auto w-full max-w-5xl px-4 pt-10 pb-16 sm:px-6 lg:pt-14 [@media(min-height:900px)]:pb-40"
  >
    <section>
      <h2 class="flex items-start justify-center gap-2 text-center text-lg font-bold 2xl:text-xl">
        <MousePointer
          class="mt-1 size-5 shrink-0"
          aria-hidden="true"
        />
        該当するカテゴリを選択してください(複数選択可)
      </h2>

      <div
        data-slot="category-cards"
        class="mt-8 grid gap-4 sm:grid-cols-2 2xl:gap-6"
      >
        <label
          v-for="category in selectableCategories"
          :key="category.id"
          data-slot="category-card"
          class="group relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-input bg-card px-6 pt-6 pb-8 text-center shadow-sm transition-colors hover:border-ring has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 2xl:gap-4 2xl:px-8 2xl:pt-8 2xl:pb-10"
        >
          <input
            type="checkbox"
            class="sr-only"
            :checked="isCategoryChecked(category.id)"
            :aria-describedby="`${category.key}-desc`"
            :aria-label="category.label"
            @change="toggleCategory(category.id, $event)"
          />
          <component
            :is="resolveCategoryIcon(category.key)"
            class="size-14 2xl:size-16"
            aria-hidden="true"
          />
          <h3
            data-slot="category-card-title"
            class="text-lg font-bold 2xl:text-xl"
          >
            {{ category.label }}
          </h3>
          <p
            :id="`${category.key}-desc`"
            data-slot="category-card-description"
            class="text-sm leading-relaxed text-muted-foreground group-has-[:checked]:text-primary-foreground 2xl:text-base"
          >
            {{ category.description }}
          </p>
          <span
            v-if="isCategoryChecked(category.id)"
            class="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-card text-primary shadow-sm 2xl:top-6 2xl:right-6"
            aria-hidden="true"
          >
            <Check class="size-6 animate-check-pop" />
          </span>
        </label>
      </div>

      <p
        class="mt-6 flex items-start justify-center gap-2 text-sm text-muted-foreground 2xl:text-base"
      >
        <Lightbulb
          class="mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />
        どちらも選択しない場合は、共通の質問のみ表示されます
      </p>
    </section>

    <div class="mt-10 flex justify-center 2xl:mt-12">
      <AnimatedIconButton
        icon="fa-solid fa-arrow-right"
        label="アンケートを開始"
        animation-type="bounce"
        @click="goToSurvey"
      />
    </div>
  </div>
</template>
