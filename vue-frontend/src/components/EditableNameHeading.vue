<script setup lang="ts">
import { ref, watch } from 'vue'

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
    <div
      class="flex min-w-0 flex-wrap items-baseline justify-center gap-1 text-3xl font-extrabold sm:text-4xl print:text-2xl"
    >
      <div class="grid max-w-full min-w-0">
        <!-- 入力値の複製。visibility:hidden なので見えないまま場所を占有し、この幅がグリッドの
             列幅＝入力欄の幅になる。フォントは preflight の font:inherit で input と一致する -->
        <span
          class="invisible col-start-1 row-start-1 overflow-hidden px-2 whitespace-pre"
          aria-hidden="true"
          >{{ nameDraft || NAME_PLACEHOLDER }}</span
        >
        <input
          v-model="nameDraft"
          type="text"
          data-slot="name-input"
          size="1"
          class="col-start-1 row-start-1 w-full min-w-0 rounded-lg border-b-2 border-dashed border-transparent bg-field px-2 text-center transition-colors placeholder:text-muted-foreground read-only:cursor-default read-only:bg-transparent hover:border-ring read-only:hover:border-transparent focus:border-ring read-only:focus:border-transparent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none print:break-after-avoid print:border-none print:ring-0"
          :readonly="!isNameEditable"
          :maxlength="NAME_MAX_LENGTH"
          :aria-label="`お名前（${NAME_MAX_LENGTH}文字まで）`"
          :placeholder="NAME_PLACEHOLDER"
          @focus="handleNameFocus"
          @blur="handleNameBlur"
          @keydown="handleNameKeydown"
        />
      </div>
      <span aria-hidden="true">様のスキルシート</span>
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
