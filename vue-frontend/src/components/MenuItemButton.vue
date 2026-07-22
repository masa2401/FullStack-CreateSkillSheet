<script setup lang="ts">
interface Props {
    icon: string;
    text: string;
    variant?: 'default' | 'success' | 'error';
    spin?: boolean;
    disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
    variant: 'default',
    spin: false,
    disabled: false
})

const emit = defineEmits<{ click: [] }>();
</script>

<template>
    <button type="button" @click="emit('click')" class="menu-item"
        :class="{ success: variant === 'success', error: variant === 'error' }" :disabled="disabled">
        <span class="menu-icon">
            <font-awesome-icon :icon="icon" :spin="spin" />
        </span>
        <span class="menu-text">{{ text }}</span>
    </button>
</template>

<style scoped>
.menu-item {
    width: 100%;
    padding: var(--p-8, 1rem);
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    justify-content: start;
    align-items: center;
    gap: var(--p-4, 0.5rem);
    border-radius: 10px;
    transition: all 0.2s;
    font-size: 1rem;
    font-weight: 600;
    color: #483c32;
}

.menu-item:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.menu-item:hover:not(:disabled) {
    background: #f5f5f5;
}

.menu-item.success {
    background: #d1fae5;
    color: #059669;
}

.menu-item.error {
    background: #fee2e2;
    color: #dc2626;
}

.menu-icon {
    font-size: 1rem;
}

.menu-text {
    text-align: left;
}
</style>