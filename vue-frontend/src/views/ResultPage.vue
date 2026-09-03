<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { TriangleAlert } from '@lucide/vue'

import AnimatedIconButton from '@/components/AnimatedIconButton.vue'
import EditableNameHeading from '@/components/EditableNameHeading.vue'
import ResultSkeleton from '@/components/ResultSkeleton.vue'
import ShareButton from '@/components/ShareButton.vue'
import StatePanel from '@/components/StatePanel.vue'
import { resolveCategoryIcon } from '@/components/icons/categoryIcons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppNavigation } from '@/composables/useAppNavigation'
import { useMergedSurvey } from '@/composables/useMergedSurvey'
import { useSurveyStore } from '@/stores/useSurveyStore'
import { fetchSheet, isBackendEnabled } from '@/utils/api'
import { LEVEL_LABELS } from '@/utils/constants'
import { getDataFromUrl, getIdFromUrl } from '@/utils/shareUtils'

const store = useSurveyStore()
const { mergedCategories } = useMergedSurvey()

const { goToTop, goToSurvey: goBack } = useAppNavigation()

const startOwnSheet = (): void => {
  store.reset()
  goToTop()
}

type ErrorReason = 'expired' | 'notfound' | 'error'

type PageStatus =
  | { type: 'loading' }
  | { type: 'ready' }
  | { type: 'error'; reason: ErrorReason; expiryDays?: number }

const pageStatus = ref<PageStatus>({ type: 'loading' })

// 共有ビューかどうかはURLだけで確定するため、取得完了を待たずに決めておく。
// これによりローディング中もアクション行を実描画でき、表示完了時に位置が動かない。
const sharedId = getIdFromUrl()
const urlData = getDataFromUrl()
const isSharedView = (!!sharedId && isBackendEnabled()) || urlData !== null

onMounted(async () => {
  if (sharedId && isBackendEnabled()) {
    const result = await fetchSheet(sharedId)
    if (result.status === 'success') {
      store.loadFromSharedState(result.data)
      pageStatus.value = { type: 'ready' }
      return
    }
    if (result.status === 'expired') {
      pageStatus.value = { type: 'error', reason: result.status, expiryDays: result.expiryDays }
      return
    }
    if (result.status === 'notfound' || result.status === 'error') {
      pageStatus.value = { type: 'error', reason: result.status }
      return
    }
  }

  if (urlData) {
    store.loadFromSharedState(urlData)
  }
  pageStatus.value = { type: 'ready' }
})

const handleNameCommitted = async (name: string): Promise<void> => {
  store.setUserName(name)
  if (!isBackendEnabled()) return
  try {
    await store.getSavedIdOrSave()
  } catch (error) {
    console.error('プリフェッチ用の保存エラー:', error)
  }
}

const displayName = computed(() => store.userName || 'Guest')

// ─── 分岐処理 ──────────────────────────────────────────────────────────────

// ready 以外では空配列を返す。ローディング中にストアの前回データが
// 一瞬描画されるのを防ぎ、テンプレート側は v-for だけで済む。
const displayCategories = computed(() => {
  if (pageStatus.value.type !== 'ready') return []

  return mergedCategories.value
    .filter((cat) => cat.isChecked)
    .map((cat) => ({
      ...cat,
      questions: cat.questions
        .map((q) => ({
          ...q,
          answers: q.answers.filter((a) => a.isChecked),
        }))
        .filter((q) => q.answers.length > 0),
    }))
    .filter((cat) => cat.questions.length > 0)
})

const ERROR_TITLES: Record<ErrorReason, string> = {
  expired: 'リンクの有効期限が切れています',
  notfound: 'リンクが見つかりません',
  error: '読み込みに失敗しました',
}

const errorTitle = computed(() =>
  pageStatus.value.type === 'error' ? ERROR_TITLES[pageStatus.value.reason] : '',
)

const errorMessage = computed(() => {
  const status = pageStatus.value
  if (status.type !== 'error') return ''

  const messages: Record<ErrorReason, string> = {
    expired: `共有リンクの有効期限（${status.expiryDays}日間）が切れています。`,
    notfound: 'お探しのスキルシートは存在しないか、削除された可能性があります。',
    error: '一時的な問題で読み込めませんでした。時間をおいて再度お試しください。',
  }
  return messages[status.reason]
})
</script>

<template>
  <div
    v-if="pageStatus.type !== 'error'"
    class="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:py-14 print:max-w-none print:p-0"
  >
    <Card class="print:break-inside-avoid print:rounded-none print:shadow-none">
      <CardContent class="space-y-4">
        <div class="flex items-center justify-center gap-2">
          <Skeleton
            v-if="pageStatus.type === 'loading'"
            class="h-9 w-72 max-w-full sm:h-10"
          />
          <h2
            v-else-if="isSharedView"
            class="text-center text-3xl font-extrabold sm:text-4xl print:break-after-avoid print:text-2xl"
          >
            {{ displayName }} 様のスキルシート
          </h2>
          <EditableNameHeading
            v-else
            :initial-name="store.userName"
            :display-name="displayName"
            @commit="handleNameCommitted"
          />
        </div>
        <ul class="mx-auto w-fit space-y-1 text-sm text-muted-foreground">
          <li
            v-for="level in LEVEL_LABELS"
            :key="level.stars"
          >
            {{ level.stars }}： {{ level.text }}
          </li>
        </ul>
      </CardContent>
    </Card>

    <div class="mt-8 space-y-6 print:mt-4 print:space-y-4">
      <ResultSkeleton v-if="pageStatus.type === 'loading'" />

      <Card
        v-for="category in displayCategories"
        :key="category.id"
        class="gap-4 print:rounded-none print:box-decoration-clone print:py-4 print:shadow-none"
      >
        <CardHeader>
          <div class="flex items-center justify-center gap-2">
            <component
              :is="resolveCategoryIcon(category.key)"
              class="size-8 shrink-0 print:size-7"
              aria-hidden="true"
            />
            <CardTitle class="text-xl font-bold sm:text-2xl print:break-after-avoid print:text-lg">
              {{ category.label }}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent class="space-y-6 print:space-y-4">
          <div
            v-for="question in category.questions"
            :key="question.id"
          >
            <h4
              class="mb-3 leading-relaxed font-semibold print:mb-2 print:break-inside-avoid print:break-after-avoid print:text-base"
            >
              {{ question.title }}
            </h4>
            <ul class="space-y-3 print:space-y-2">
              <li
                v-for="answer in question.answers"
                :key="answer.label"
                data-slot="skill-card"
                class="border-l-2 border-border py-1 pl-3 print:break-inside-avoid"
              >
                <div
                  data-slot="skill-info"
                  class="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch max-sm:gap-1"
                >
                  <span class="font-medium">{{ answer.label }}</span>
                  <span class="flex shrink-0 items-center max-sm:justify-between">
                    <span
                      class="text-lg text-amber-500 dark:text-amber-400 print:text-base print:text-current print:[print-color-adjust:exact]"
                    >
                      {{ LEVEL_LABELS[(answer.value ?? 0) - 1]?.stars }}
                    </span>
                    <span class="text-xs text-muted-foreground">&nbsp;({{ answer.value }}/5)</span>
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>

    <div
      data-slot="result-actions"
      class="mt-10 flex flex-wrap justify-center gap-4 max-sm:flex-col print:hidden"
    >
      <template v-if="!isSharedView">
        <AnimatedIconButton
          icon="fa-solid fa-arrow-left"
          label="修正する"
          animation-type="beat"
          variant="secondary"
          @click="goBack"
        />

        <ShareButton />

        <AnimatedIconButton
          icon="fa-regular fa-house"
          label="トップへ戻る"
          animation-type="beat"
          variant="secondary"
          @click="goToTop"
        />
      </template>

      <template v-else>
        <AnimatedIconButton
          icon="fa-solid fa-pen"
          label="自分のスキルシートを作成"
          animation-type="beat"
          @click="startOwnSheet"
        />
      </template>
    </div>
  </div>

  <StatePanel
    v-else
    :title="errorTitle"
  >
    <template #icon>
      <TriangleAlert
        class="size-12"
        aria-hidden="true"
      />
    </template>
    <template #message>{{ errorMessage }}</template>
    <template #actions>
      <AnimatedIconButton
        icon="fa-solid fa-house"
        label="トップへ戻る"
        animation-type="beat"
        @click="goToTop"
      />
    </template>
  </StatePanel>
</template>
