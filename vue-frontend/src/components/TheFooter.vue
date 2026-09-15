<script setup lang="ts">
import { Button } from '@/components/ui/button'
</script>

<template>
  <footer class="flex justify-center border-t py-4 print:hidden">
    <Button
      as="a"
      href="https://github.com/masa2401/FullStack-CreateSkillSheet"
      target="_blank"
      rel="noopener noreferrer"
      variant="outline"
      size="sm"
    >
      <font-awesome-icon icon="fa-brands fa-github" />
      View on GitHub
    </Button>
  </footer>
</template>
