<script setup lang="ts">
import { computed } from 'vue'
import { collectionStatuses, subjectTypes, type CollectionStatus, type SubjectType } from '@/types/bangumi'
const props = defineProps<{
  subjectType: SubjectType
  status: CollectionStatus | 'all'
  typeCounts: Record<number, number>
  statusCounts: Record<string, number>
}>()
const emit = defineEmits<{
  'update:subjectType': [value: SubjectType]
  'update:status': [value: CollectionStatus | 'all']
}>()
const types = computed(() =>
  subjectTypes.filter(
    (type) =>
      !Object.keys(props.typeCounts).length ||
      props.typeCounts[type.value] ||
      props.subjectType === type.value,
  ),
)
const statuses = computed(() =>
  collectionStatuses.filter(
    (state) =>
      !Object.keys(props.statusCounts).length ||
      state.value === 'all' ||
      props.statusCounts[state.value] ||
      props.status === state.value,
  ),
)
</script>
<template>
  <div class="bangumi-filters">
    <div class="index-tabs" role="group" aria-label="收藏媒介">
      <button
        v-for="type in types"
        :key="type.value"
        type="button"
        :aria-pressed="subjectType === type.value"
        @click="emit('update:subjectType', type.value)"
      >
        {{ type.label }}<sup v-if="typeCounts[type.value] !== undefined">{{ typeCounts[type.value] }}</sup>
      </button>
    </div>
    <div class="index-tabs quiet-tabs" role="group" aria-label="收藏状态">
      <button
        v-for="state in statuses"
        :key="state.value"
        type="button"
        :aria-pressed="status === state.value"
        @click="emit('update:status', state.value)"
      >
        {{ state.label
        }}<sup v-if="statusCounts[state.value] !== undefined">{{ statusCounts[state.value] }}</sup>
      </button>
    </div>
  </div>
</template>
