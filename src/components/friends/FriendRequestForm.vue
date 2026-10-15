<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Copy, Check } from 'lucide-vue-next'
const form = reactive({ site: '', owner: '', url: '', desc: '', image: '', color: '#e9546b' })
const message = ref('')
const copied = ref(false)
const yaml = computed(() =>
  [
    'site: ' + JSON.stringify(form.site || '我的博客'),
    'url: ' + JSON.stringify(form.url || 'https://example.com'),
    'owner: ' + JSON.stringify(form.owner || '你的昵称'),
    'desc: ' + JSON.stringify(form.desc || '一句话介绍'),
    'image: ' + JSON.stringify(form.image || 'https://example.com/avatar.jpg'),
    'color: ' + JSON.stringify(form.color),
  ].join('\n'),
)
watch(yaml, () => {
  copied.value = false
  message.value = ''
})
async function copy() {
  try {
    await navigator.clipboard.writeText(yaml.value)
    copied.value = true
    message.value = '配置已复制。'
  } catch {
    copied.value = false
    message.value = '自动复制失败，请选中预览内容手动复制。'
  }
}
</script>
<template>
  <section class="friend-request" aria-labelledby="apply-title">
    <h2 id="apply-title">申请友链</h2>
    <p>填写你的小站信息，复制配置后通过关于页联系。此演示表单仅在本地生成文本。</p>
    <form @submit.prevent="copy">
      <div class="friend-form">
        <label>站点名称<input v-model="form.site" maxlength="80" placeholder="我的博客" /></label
        ><label>昵称<input v-model="form.owner" maxlength="40" placeholder="你的昵称" /></label
        ><label>站点地址<input v-model="form.url" type="url" placeholder="https://example.com" /></label
        ><label>站点简介<input v-model="form.desc" maxlength="160" placeholder="一句话介绍" /></label
        ><label
          >头像链接<input
            v-model="form.image"
            type="url"
            placeholder="https://example.com/avatar.jpg" /></label
        ><label class="color-field"
          >主题色<input v-model="form.color" type="color" /><span>{{ form.color }}</span></label
        >
      </div>
      <div class="config-heading">
        <h3>配置预览</h3>
        <button type="submit">
          <Check v-if="copied" :size="15" aria-hidden="true" /><Copy
            v-else
            :size="15"
            aria-hidden="true"
          />复制配置
        </button>
      </div>
      <pre tabindex="0"><code>{{ yaml }}</code></pre>
      <p class="copy-status" role="status">{{ message }}</p>
    </form>
  </section>
</template>
