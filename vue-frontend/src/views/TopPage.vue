<script setup lang="ts">
import { computed } from 'vue'

import { Check, Lightbulb, MousePointerClick } from '@lucide/vue'

import AnimatedIconButton from '@/components/AnimatedIconButton.vue'
import { resolveCategoryIcon } from '@/components/icons/categoryIcons'
import { Card, CardContent } from '@/components/ui/card'
import { useAppNavigation } from '@/composables/useAppNavigation'
import { CATEGORY_MASTERS } from '@/data/questions'
import { useSurveyStore } from '@/stores/useSurveyStore'

const store = useSurveyStore()

const engineerMaster = CATEGORY_MASTERS.find((c) => c.key === 'engineer')!
const designerMaster = CATEGORY_MASTERS.find((c) => c.key === 'designer')!

const engineerChecked = computed({
  get: () => store.selections.find((c) => c.categoryId === engineerMaster.id)?.isChecked ?? false,
  set: (val: boolean) => store.setCategoryChecked(engineerMaster.id, val),
})
const designerChecked = computed({
  get: () => store.selections.find((c) => c.categoryId === designerMaster.id)?.isChecked ?? false,
  set: (val: boolean) => store.setCategoryChecked(designerMaster.id, val),
})
const { goToSurvey } = useAppNavigation()
</script>

<template>
  <div class="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
    <Card>
      <CardContent>
        <p class="text-center leading-relaxed">
          これからいくつかの質問を行います。<br />
          質問に回答後、あなたのスキルシートが出力されます。
        </p>
      </CardContent>
    </Card>

    <section class="mt-10">
      <h2 class="flex items-center justify-center gap-2 text-center text-lg font-semibold">
        <MousePointerClick
          class="size-5 shrink-0"
          aria-hidden="true"
        />
        該当するカテゴリを選択してください(複数選択可)
      </h2>

      <div
        data-slot="category-cards"
        class="mt-6 grid gap-4 sm:grid-cols-2"
      >
        <label
          data-slot="category-card"
          class="group border-input bg-card hover:border-ring has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-ring/50 relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border p-6 text-center shadow-sm transition-colors has-[:focus-visible]:ring-[3px]"
        >
          <input
            v-model="engineerChecked"
            type="checkbox"
            class="sr-only"
            aria-describedby="engineer-desc"
            :aria-label="engineerMaster.label"
          />
          <component
            :is="resolveCategoryIcon(engineerMaster.key)"
            class="size-14"
            aria-hidden="true"
          />
          <h3
            data-slot="category-card-title"
            class="text-lg font-bold"
          >
            {{ engineerMaster.label }}
          </h3>
          <p
            id="engineer-desc"
            data-slot="category-card-description"
            class="text-muted-foreground group-has-[:checked]:text-primary-foreground text-sm leading-relaxed"
          >
            {{ engineerMaster.description }}
          </p>
          <span
            v-if="engineerChecked"
            class="bg-card text-primary absolute top-4 right-4 flex size-10 items-center justify-center rounded-full shadow-sm"
            aria-hidden="true"
          >
            <Check class="check-mark size-6" />
          </span>
        </label>
        <label
          data-slot="category-card"
          class="group border-input bg-card hover:border-ring has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-ring/50 relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border p-6 text-center shadow-sm transition-colors has-[:focus-visible]:ring-[3px]"
        >
          <input
            v-model="designerChecked"
            type="checkbox"
            class="sr-only"
            aria-describedby="designer-desc"
            :aria-label="designerMaster.label"
          />
          <component
            :is="resolveCategoryIcon(designerMaster.key)"
            class="size-14"
            aria-hidden="true"
          />
          <h3
            data-slot="category-card-title"
            class="text-lg font-bold"
          >
            {{ designerMaster.label }}
          </h3>
          <p
            id="designer-desc"
            data-slot="category-card-description"
            class="text-muted-foreground group-has-[:checked]:text-primary-foreground text-sm leading-relaxed"
          >
            {{ designerMaster.description }}
          </p>
          <span
            v-if="designerChecked"
            class="bg-card text-primary absolute top-4 right-4 flex size-10 items-center justify-center rounded-full shadow-sm"
            aria-hidden="true"
          >
            <Check class="check-mark size-6" />
          </span>
        </label>
      </div>

      <p class="text-muted-foreground mt-6 flex items-center justify-center gap-2 text-sm">
        <Lightbulb
          class="size-4 shrink-0"
          aria-hidden="true"
        />
        どちらも選択しない場合は、共通の質問のみ表示されます
      </p>
    </section>

    <div class="mt-10 flex justify-center">
      <AnimatedIconButton
        icon="fa-solid fa-arrow-right"
        label="アンケートを開始"
        animation-type="bounce"
        @click="goToSurvey"
      />
    </div>
  </div>
</template>

<style scoped>
.check-mark {
  animation: checkPop 0.3s ease;
}

@keyframes checkPop {
  0% {
    transform: scale(0);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}
</style>
