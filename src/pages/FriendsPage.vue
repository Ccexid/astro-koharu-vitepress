<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Flower2, ArrowUpRight, Smile } from 'lucide-vue-next'
import FriendRequestForm from '@/components/friends/FriendRequestForm.vue'
import { listFriends, listFriendGroups } from '@/services/posts'
import type { Friend, FriendGroup } from '@/types/post'
const friends = ref<Friend[]>([])
const groups = ref<FriendGroup[]>([])
const selected = ref('')
const loading = ref(true)
const error = ref(false)
const sections = computed(() =>
  groups.value.map((group) => ({
    ...group,
    items: friends.value.filter((friend) => friend.group === group.id),
  })),
)
const visible = computed(() =>
  sections.value.filter((group) => (!selected.value ? group.items.length : group.id === selected.value)),
)
async function load() {
  loading.value = true
  error.value = false
  try {
    ;[friends.value, groups.value] = await Promise.all([listFriends(), listFriendGroups()])
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
<template>
  <p v-if="loading" class="status-message" role="status">正在加载友链…</p>
  <div v-else-if="error" class="status-message" role="alert">
    友链暂时无法加载。<button type="button" @click="load">重试</button>
  </div>
  <template v-else>
    <div class="index-intro">
      <p>
        <strong>{{ friends.length }}</strong> 位朋友
      </p>
    </div>
    <div class="index-tabs friends-group-tabs" role="group" aria-label="友链分组">
      <button type="button" :aria-pressed="!selected" @click="selected = ''">
        全部<sup>{{ friends.length }}</sup></button
      ><button
        v-for="group in sections"
        :key="group.id"
        type="button"
        :aria-pressed="selected === group.id"
        @click="selected = group.id"
      >
        {{ group.title }}<sup>{{ group.items.length }}</sup>
      </button>
    </div>
    <section v-for="group in visible" :key="group.id" class="friends-section">
      <h2 class="year-rule">
        <Flower2 :size="18" aria-hidden="true" />{{ group.title }}<span class="year-rule-line"></span
        ><small>{{ group.items.length }}</small>
      </h2>
      <p class="friends-group-description">{{ group.description }}</p>
      <div v-if="group.items.length" class="friends-grid">
        <a
          v-for="friend in group.items"
          :key="friend.url"
          class="friend-item"
          :href="friend.url"
          target="_blank"
          rel="noopener noreferrer"
          :style="{ '--friend-color': friend.color }"
          ><span class="friend-avatar" aria-hidden="true"><Smile :size="38" :stroke-width="1.2" /></span
          ><span class="friend-copy"
            ><span
              ><strong>{{ friend.owner }}</strong
              ><small>{{ friend.name }}</small></span
            ><span class="friend-description">{{ friend.description }}</span></span
          ><ArrowUpRight class="friend-arrow" :size="15" aria-hidden="true"
        /></a>
      </div>
      <p v-else class="status-message">这个分组还没有友链。</p>
    </section>
    <p v-if="!friends.length" class="status-message" role="status">这里暂时还没有友链。</p>
    <p class="friends-note">以上均为模板示例站点，外链使用 example.com 演示域名。</p>
    <FriendRequestForm />
  </template>
</template>
