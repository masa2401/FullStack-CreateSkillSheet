<script setup lang="ts">
import { computed } from 'vue'

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
  isLocked: isNameLocked,
  showEditButton,
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
</script>
<template>
  <h2
    class="user-name-heading"
    aria-live="polite"
  >
    {{ displayName }} 様のスキルシート
  </h2>
  <div class="name-input-wrapper">
    <input
      v-model="nameDraft"
      type="text"
      class="page-title-input"
      :class="{ 'is-locked': isNameLocked }"
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
      class="title-suffix"
      aria-hidden="true"
      >様のスキルシート</span
    >
    <button
      v-if="showEditButton"
      type="button"
      class="edit-name-button"
      @click="startNameEdit"
    >
      名前を編集する
    </button>
  </div>
</template>
<style scoped>
.user-name-heading {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.name-input-wrapper {
  display: flex;
  align-items: baseline;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  position: relative;
  width: 100%;
}

.page-title-input {
  font-family: inherit;
  font-size: 2.5rem;
  font-weight: 800;
  color: #483c32;
  text-shadow: 0 2px 4px rgba(211, 198, 166, 0.3);
  text-align: center;
  background: transparent;
  border: none;
  border-bottom: 2px dashed transparent;
  padding: 0 var(--p-4, 0.5rem);
  transition: border-color 0.2s;
  min-width: 0;
}

.page-title-input:not(.is-locked):hover,
.page-title-input:not(.is-locked):focus {
  border-bottom-color: #d3c6a6;
}

.page-title-input:focus {
  outline: none;
}

.page-title-input.is-locked {
  cursor: default;
}

.page-title-input::placeholder {
  color: rgba(72, 60, 50, 0.35);
}

.title-suffix {
  font-size: 2.5rem;
  font-weight: 800;
  color: #483c32;
  text-shadow: 0 2px 4px rgba(211, 198, 166, 0.3);
}

.edit-name-button {
  display: block;
  width: 100%;
  text-align: center;
  background: none;
  border: none;
  color: #7c6a58;
  font-size: 0.9rem;
  text-decoration: underline;
  cursor: pointer;
  padding: var(--p-4, 0.5rem) 0 0;
}

.edit-name-button:hover,
.edit-name-button:focus-visible {
  color: #483c32;
}

@media (max-width: 768px) {
  .page-title-input,
  .title-suffix {
    font-size: 2rem;
  }
}

@media print {
  .page-title-input,
  .title-suffix {
    font-size: 1.8rem;
    text-shadow: none;
    break-after: avoid;
  }

  .page-title-input {
    border: none !important;
  }

  .edit-name-button {
    display: none !important;
  }
}
</style>
