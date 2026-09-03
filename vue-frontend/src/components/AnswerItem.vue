<script setup lang="ts">
import { useId } from 'vue'

import type { AcceptableValue } from 'reka-ui'
import { RadioGroupItem } from 'reka-ui'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup } from '@/components/ui/radio-group'
import type { StarLevel } from '@/types'
import { LEVEL_LABELS } from '@/utils/constants'

interface Props {
  answerId: number
  label: string
  isChecked: boolean
  value?: StarLevel
}

const { answerId, label, isChecked, value } = defineProps<Props>()

const emit = defineEmits<{
  'update:answer': [
    payload: { answerId: number; patch: { isChecked?: boolean; value?: StarLevel } },
  ]
}>()

/**
 * 回答IDは質問ごとに1から振り直されるため文書内で一意にならない。
 * Label の for 属性が別の質問の同IDに当たってしまうので、
 * Vue が払い出す一意なIDを使う。
 */
const checkboxId = useId()

// チェックボックスの変更
const handleCheckChange = (checked: boolean | 'indeterminate'): void => {
  emit('update:answer', {
    answerId,
    patch: { isChecked: checked === true },
  })
}

// 習熟度の変更
const handleLevelChange = (level: AcceptableValue): void => {
  emit('update:answer', {
    answerId,
    patch: { value: Number(level) as StarLevel },
  })
}
</script>

<template>
  <div class="border-l-4 pl-4">
    <div class="flex items-center gap-2 py-2">
      <Checkbox
        :id="checkboxId"
        :model-value="isChecked"
        @update:model-value="handleCheckChange"
      />
      <Label
        :for="checkboxId"
        class="flex-1 cursor-pointer text-base leading-relaxed font-normal"
      >
        {{ label }}
      </Label>
    </div>

    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2.5 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="-translate-y-2.5 opacity-0"
    >
      <div
        v-if="isChecked"
        class="bg-card mt-2 rounded-xl border p-4"
      >
        <RadioGroup
          :model-value="value"
          class="flex flex-wrap gap-2"
          :aria-label="`${label} の習熟度`"
          @update:model-value="handleLevelChange"
        >
          <!--
            shadcn-vue の RadioGroupItem は円形インジケータ前提のため、
            カード型の見た目を保つ用途では Reka の RadioGroupItem を直接使い、
            data-[state=checked] でスタイルを切り替える。
          -->
          <RadioGroupItem
            v-for="level in LEVEL_LABELS.length"
            :key="level"
            :value="level"
            :aria-label="`習熟度 ${level}: ${LEVEL_LABELS[level - 1]!.text}`"
            class="focus-visible:border-ring focus-visible:ring-ring/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary flex min-w-20 flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[3px] focus-visible:outline-none data-[state=checked]:scale-105"
          >
            <span class="text-xl font-bold">{{ level }}</span>
            <span class="text-xs opacity-80">{{ '★'.repeat(level) }}</span>
          </RadioGroupItem>
        </RadioGroup>
        <span
          v-if="!value"
          class="mt-2 block text-center text-sm font-semibold text-amber-500 motion-safe:animate-pulse"
          role="alert"
        >
          <font-awesome-icon icon="fa-regular fa-lightbulb" />
          習熟度を選択してください
        </span>
      </div>
    </transition>
  </div>
</template>
