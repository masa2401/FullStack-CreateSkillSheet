<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

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
  phase: namePhase,
  draft: nameDraft,
  isEditable: isNameEditable,
  showEditButton,
  errorMessage: nameErrorMessage,
  editableWindowMs,
  requestCommit: commitNameDraft,
  cancelPendingCommit: cancelNameCommit,
  startEdit: startNameEdit,
} = useNameCommit(props.initialName, {
  onCommit: (name) => emit('commit', name),
})

/**
 * 確定済みで入力欄を表示しない状態。確定待ち（confirming）は再フォーカスで確定を
 * キャンセルできる仕様のため、入力欄のまま残す
 */
const isNameLocked = computed<boolean>(
  () => namePhase.value === 'committed' || namePhase.value === 'locked',
)

const nameInputRef = useTemplateRef<HTMLInputElement>('nameInput')

/** 押したボタン自体が消えるため、フォーカスを出現した入力欄へ移す */
const handleStartEdit = async (): Promise<void> => {
  startNameEdit()
  await nextTick()
  nameInputRef.value?.focus()
}

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
  <div
    class="flex min-w-0 flex-wrap items-baseline justify-center gap-1 text-3xl font-extrabold sm:text-4xl print:text-2xl"
  >
    <div class="grid max-w-full min-w-0 items-baseline">
      <!-- 入力値の複製。visibility:hidden なので見えないまま場所を占有し、この幅がグリッドの
           列幅＝入力欄（確定後は表示用テキスト）の幅になる。フォントは preflight の font:inherit で input と一致する -->
      <span
        class="invisible col-start-1 row-start-1 overflow-hidden px-2 whitespace-pre"
        aria-hidden="true"
        >{{ nameDraft || NAME_PLACEHOLDER }}</span
      >
      <!-- 確定後は入力欄ではなく表示用テキストにする。読み上げは sr-only の h2 が担うため aria-hidden。
           px-2 と透明な border-b-2 は入力欄と位置・高さを揃えるため -->
      <span
        v-if="isNameLocked"
        data-slot="name-display"
        class="col-start-1 row-start-1 min-w-0 overflow-hidden border-b-2 border-transparent px-2 text-center text-ellipsis whitespace-pre"
        aria-hidden="true"
        >{{ nameDraft }}</span
      >
      <input
        v-else
        ref="nameInput"
        v-model="nameDraft"
        type="text"
        data-slot="name-input"
        size="1"
        class="col-start-1 row-start-1 w-full min-w-0 rounded-lg border-b-2 border-dashed border-transparent bg-field px-2 text-center transition-colors placeholder:text-muted-foreground read-only:cursor-default read-only:bg-transparent hover:border-ring read-only:hover:border-transparent focus:border-ring read-only:focus:border-transparent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none print:break-after-avoid print:border-none print:ring-0"
        :readonly="!isNameEditable"
        :maxlength="NAME_MAX_LENGTH"
        :aria-label="`お名前（${NAME_MAX_LENGTH}文字まで）`"
        :aria-invalid="Boolean(nameErrorMessage)"
        :aria-describedby="nameErrorMessage ? 'name-input-error' : undefined"
        :placeholder="NAME_PLACEHOLDER"
        @focus="handleNameFocus"
        @blur="handleNameBlur"
        @keydown="handleNameKeydown"
      />
      <!-- 名前の真下。編集ボタンと同じ2行目だが、表示される phase が異なるため同時には出ない。
           幅0の箱で左右へはみ出させ、メッセージ幅が列幅（＝名前欄の幅）を押し広げないようにする。
           見た目は TooltipContent に合わせるが data-slot は分ける（e2e の guestHint が
           [data-slot="tooltip-content"] で取得しているため、同じ属性だと複数マッチになる） -->
      <div
        v-if="nameErrorMessage"
        class="col-start-1 row-start-2 flex w-0 justify-center justify-self-center pt-3 print:hidden"
      >
        <p
          id="name-input-error"
          data-slot="name-error"
          role="alert"
          class="relative w-max max-w-[90vw] rounded-md bg-foreground px-3 py-1.5 text-xs font-normal text-nowrap text-background"
        >
          <!-- TooltipArrow 相当。上向きに出すため本体の上辺へまたがらせる -->
          <span
            class="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rotate-45 rounded-xs bg-foreground"
            aria-hidden="true"
          ></span>
          {{ nameErrorMessage }}
        </p>
      </div>

      <!-- 名前の真下に置くため同じ列の2行目に配置する。幅0の箱の中で中央揃えにして左右へ
           はみ出させ、ボタン幅が列幅（＝名前欄の幅）を押し広げないようにする -->
      <div
        v-if="showEditButton"
        class="col-start-1 row-start-2 flex w-0 justify-center justify-self-center pt-2 print:hidden"
      >
        <div class="flex flex-col gap-1">
          <AppButton
            data-slot="edit-name-button"
            variant="outline"
            size="sm"
            @click="handleStartEdit"
          >
            <SquarePen aria-hidden="true" />
            名前を編集する
          </AppButton>
          <div
            class="h-1 w-full overflow-hidden rounded-full bg-primary/20"
            aria-hidden="true"
          >
            <div
              data-slot="edit-progress-fill"
              class="h-full bg-primary transition-[width] ease-linear"
              :class="isEditProgressCollapsed ? 'w-0' : 'w-full'"
              :style="{ transitionDuration: `${editableWindowMs}ms` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
    <span aria-hidden="true">様のスキルシート</span>
  </div>
</template>
