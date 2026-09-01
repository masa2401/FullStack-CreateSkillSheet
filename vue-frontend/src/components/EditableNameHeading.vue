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

const nameInputSize = computed(
  () => Math.min(Math.max(nameDraft.value.length, 6), NAME_MAX_LENGTH) + 2,
)

const handleNameFocus = (): void => cancelNameCommit()

const handleNameBlur = (): void => commitNameDraft()

const handleNameKeydown = (event: KeyboardEvent): void => {
  if (event.key !== 'Enter') return
  event.preventDefault()
  ;(event.target as HTMLInputElement).blur()
}

// ─── 編集可能期間の残量プログレスバー ──────────────────────────────
// committedフェーズ開始時に100%で描画したのち、次フレーム以降に0%へ切り替えることで
// CSS transitionによる幅アニメーションを発火させる（毎フレームのJS更新は行わない）
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
        class="bg-accent hover:border-ring focus:border-ring placeholder:text-muted-foreground/60 read-only:hover:border-transparent read-only:focus:border-transparent min-w-0 rounded-lg border-b-2 border-dashed border-transparent px-2 text-center text-3xl font-extrabold transition-colors outline-none read-only:cursor-default read-only:bg-transparent sm:text-4xl print:border-none print:text-2xl print:break-after-avoid"
        :readonly="!isNameEditable"
        :maxlength="NAME_MAX_LENGTH"
        :size="nameInputSize"
        :aria-label="`お名前（${NAME_MAX_LENGTH}文字まで）`"
        placeholder="お名前を入力"
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
        class="bg-primary/20 h-1 w-20 shrink-0 overflow-hidden rounded-full"
        aria-hidden="true"
      >
        <div
          data-slot="edit-progress-fill"
          class="bg-primary h-full transition-[width] ease-linear motion-reduce:transition-none"
          :class="isEditProgressCollapsed ? 'w-0' : 'w-full'"
          :style="{ transitionDuration: `${editableWindowMs}ms` }"
        ></div>
      </div>
    </div>
  </div>
</template>
