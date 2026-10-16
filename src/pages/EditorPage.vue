<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePageCover } from '@/composables/usePageCover'
import EditorWorkspace from '@/components/editor/EditorWorkspace.vue'
import '@/styles/editor.less'
const route = useRoute()
const sourceSlug = computed(() => (typeof route.query.post === 'string' ? route.query.post : ''))
usePageCover(() => ({ kind: 'page', title: '写作手记', compact: true }))
</script>
<template><EditorWorkspace :key="sourceSlug" :source-slug="sourceSlug" /></template>
