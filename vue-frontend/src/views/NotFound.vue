<script setup lang="ts">
import { Search } from '@lucide/vue'

import AnimatedIconButton from '@/components/AnimatedIconButton.vue'
import StatePanel from '@/components/StatePanel.vue'
import { useAppNavigation } from '@/composables/useAppNavigation'

const { goToTop } = useAppNavigation()
</script>

<template>
  <StatePanel title="ページが見つかりません">
    <template #icon>
      <Search
        class="size-12"
        aria-hidden="true"
      />
    </template>
    <template #lead>
      <p class="mb-2 text-5xl font-extrabold text-muted-foreground">404</p>
    </template>
    <template #message>
      お探しのページは存在しないか、<br />
      移動または削除された可能性があります。
    </template>
    <template #actions>
      <AnimatedIconButton
        icon="fa-regular fa-house"
        label="トップへ戻る"
        animation-type="bounce"
        @click="goToTop"
      />
    </template>
  </StatePanel>
</template>
