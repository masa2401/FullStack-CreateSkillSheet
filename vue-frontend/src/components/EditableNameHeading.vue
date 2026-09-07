<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { SquarePen } from '@lucide/vue'

import AppButton from '@/components/AppButton.vue'
import { useNameCommit } from '@/composables/useNameCommit'

interface Props {
  /** 初期値。useNameCommit生成時に一度だけ読み取られ、以降のpropsの変更には反応しない */
  initialName: string
  /** 現在表示すべき名前。store.userNameの変更にリアクティブに追従する */
  displayName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  commit: [name: string]
}>()

const NAME_MAX_LENGTH = 20
const NAME_PLACEHOLDER = 'お名前を入力'

/** 半角1文字の平均字送り。Latin 大文字（約 0.7em）が欠けないよう上限側に寄せている */
const HALF_WIDTH_EM = 0.7
/** 入力欄の左右に確保する余白（文字数換算） */
const NAME_WIDTH_MARGIN_EM = 0.6
/** 幅の上限。全角は定義上 1em なので maxlength 文字ぶん + 余白。maxlength とは単位が別 */
const NAME_MAX_WIDTH_EM = NAME_MAX_LENGTH + NAME_WIDTH_MARGIN_EM

const {
  draft: nameDraft,
  isEditable: isNameEditable,
  showEditButton,
  editableWindowMs,
  requestCommit: commitNameDraft,
  cancelPendingCommit: cancelNameCommit,
  startEdit: startNameEdit,
} = useNameCommit(props.initialName, {
  onCommit: (name) => emit('commit', name),
})

/**
 * 入力値の表示幅を em 単位で見積もる。日本語フォントの全角は定義上ちょうど 1em。
 * `size` 属性を使わないのは、基準がブラウザ依存の「平均字送り幅」で
 * 日本語フォントでは全角相当になり、半角名のときに大きく余るため。
 */
const measureWidthEm = (text: string): number =>
  [...text].reduce(
    (sum, char) => sum + (/[\u0020-\u007e\uff61-\uff9f]/.test(char) ? HALF_WIDTH_EM : 1),
    0,
  )

const nameWidthEm = computed(() => {
  const width = Math.min(
    measureWidthEm(nameDraft.value || NAME_PLACEHOLDER) + NAME_WIDTH_MARGIN_EM,
    NAME_MAX_WIDTH_EM,
  )
  // 浮動小数の誤差が style 属性にそのまま出るのを防ぐ
  return Math.round(width * 100) / 100
})

const handleNameFocus = (): void => cancelNameCommit()

const handleNameBlur = (): void => commitNameDraft()

const handleNameKeydown = (event: KeyboardEvent): void => {
  if (event.key !== 'Enter') return
  event.preventDefault()
  ;(event.target as HTMLInputElement).blur()
}

const isEditProgressCollapsed = ref<boolean>(false)

watch(showEditButton, (visible) => {
  if (!visible) return
  isEditProgressCollapsed.value = false
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isEditProgressCollapsed.value = true
    })
  })
})
</script>
<template>
  <h2
    data-slot="user-name-heading"
    class="sr-only"
    aria-live="polite"
  >
    {{ displayName }} 様のスキルシート
  </h2>
  <div class="flex min-w-0 flex-col items-center gap-2">
    <div class="flex min-w-0 flex-wrap items-baseline justify-center gap-1">
      <input
        v-model="nameDraft"
        type="text"
        data-slot="name-input"
        class="max-w-full min-w-0 rounded-lg border-b-2 border-dashed border-transparent bg-field px-2 text-center text-3xl font-extrabold transition-colors placeholder:text-muted-foreground read-only:cursor-default read-only:bg-transparent hover:border-ring read-only:hover:border-transparent focus:border-ring read-only:focus:border-transparent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:text-4xl print:break-after-avoid print:border-none print:text-2xl print:ring-0"
        :readonly="!isNameEditable"
        :maxlength="NAME_MAX_LENGTH"
        :style="{ width: `calc(${nameWidthEm}em + 1rem)` }"
        :aria-label="`お名前（${NAME_MAX_LENGTH}文字まで）`"
        :placeholder="NAME_PLACEHOLDER"
        @focus="handleNameFocus"
        @blur="handleNameBlur"
        @keydown="handleNameKeydown"
      />
      <span
        class="text-3xl font-extrabold sm:text-4xl print:text-2xl"
        aria-hidden="true"
        >様のスキルシート</span
      >
    </div>
    <div
      v-if="showEditButton"
      class="flex items-center justify-center gap-2 print:hidden"
    >
      <AppButton
        data-slot="edit-name-button"
        variant="outline"
        size="sm"
        @click="startNameEdit"
      >
        <SquarePen aria-hidden="true" />
        名前を編集する
      </AppButton>
      <div
        class="h-1 w-20 shrink-0 overflow-hidden rounded-full bg-primary/20"
        aria-hidden="true"
      >
        <div
          data-slot="edit-progress-fill"
          class="h-full bg-primary transition-[width] ease-linear motion-reduce:transition-none"
          :class="isEditProgressCollapsed ? 'w-0' : 'w-full'"
          :style="{ transitionDuration: `${editableWindowMs}ms` }"
        ></div>
      </div>
    </div>
  </div>
</template>
