<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { Plus, RotateCcw, Settings, Trash2, X } from 'lucide-vue-next'
import { iconLibraryOf, iconLibraryLabels, iconNameOf, resolveSocialIcon } from '@/app/social-icons'
import { normalizeProfileSocialHref } from '@/utils/profile-social'
import { useSettingsStore } from '@/stores/settings'
import SocialIconPicker from '@/components/settings/SocialIconPicker.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const store = useSettingsStore()
const dialog = ref<HTMLDialogElement | null>(null)
const form = ref<HTMLFormElement | null>(null)
const iconPickerFor = ref<string | null>(null)
let iconTrigger: HTMLButtonElement | null = null

function openIconPicker(id: string, event: MouseEvent) {
  iconTrigger = event.currentTarget as HTMLButtonElement
  iconPickerFor.value = iconPickerFor.value === id ? null : id
}

async function chooseIcon(id: string, icon: string) {
  const social = store.socials.find((item) => item.id === id)
  if (!social) return
  social.icon = icon
  iconPickerFor.value = null
  await nextTick()
  iconTrigger?.focus()
}

async function syncDialog(open: boolean) {
  await nextTick()
  const element = dialog.value
  if (!element) return
  if (open && !element.open) {
    element.showModal()
    form.value?.scrollTo({ top: 0, behavior: 'instant' })
  }
  if (!open && element.open) element.close()
}

function close() {
  iconPickerFor.value = null
  emit('close')
}

function handleCancel(event: Event) {
  event.preventDefault()
  close()
}

function handleDialogClick(event: MouseEvent) {
  if (event.target === dialog.value) close()
}

watch(() => props.open, syncDialog, { immediate: true })
</script>

<template>
  <dialog
    ref="dialog"
    class="settings-dialog"
    aria-labelledby="settings-title"
    @cancel="handleCancel"
    @click="handleDialogClick"
  >
    <div class="settings-surface">
      <header class="settings-header">
        <h2 id="settings-title"><Settings :size="18" aria-hidden="true" />全局设置</h2>
        <button class="settings-close" type="button" aria-label="关闭设置" autofocus @click="close">
          <X :size="18" aria-hidden="true" />
        </button>
      </header>
      <form ref="form" class="settings-form" @submit.prevent>
        <fieldset>
          <legend>追番账号</legend>
          <label
            >哔哩哔哩 UID<input
              v-model.trim="store.bilibiliUid"
              inputmode="numeric"
              placeholder="VITE_API_BILIBILI_UID"
          /></label>
          <label
            >Bangumi 用户名<input v-model.trim="store.bangumiUserId" placeholder="VITE_BANGUMI_USER_ID"
          /></label>
        </fieldset>

        <section class="social-settings" aria-labelledby="social-settings-title">
          <div class="settings-section-heading">
            <h3 id="social-settings-title">社交链接</h3>
            <button class="settings-add" type="button" @click="store.addSocial()">
              <Plus :size="15" aria-hidden="true" />添加
            </button>
          </div>
          <p class="settings-hint">显示在侧栏头像下方，修改后自动保存在当前浏览器。</p>
          <div v-if="!store.socials.length" class="settings-empty">暂未配置社交链接</div>
          <div v-for="social in store.socials" :key="social.id" class="social-editor">
            <div class="social-editor-row">
              <label class="social-label"
                >名称<input v-model.trim="social.label" maxlength="48" placeholder="例如 GitHub"
              /></label>
              <button
                class="icon-picker-trigger"
                type="button"
                :aria-label="`选择${social.label || '社交链接'}图标`"
                :aria-expanded="iconPickerFor === social.id"
                @click="openIconPicker(social.id, $event)"
              >
                <component :is="resolveSocialIcon(social.icon)" :size="19" aria-hidden="true" />
                <span
                  >{{
                    iconLibraryOf(social.icon) === 'lucide'
                      ? ''
                      : `${iconLibraryLabels[iconLibraryOf(social.icon)]} / `
                  }}{{ iconNameOf(social.icon) }}</span
                >
              </button>
              <button
                class="social-remove"
                type="button"
                :aria-label="`删除${social.label || '社交链接'}`"
                @click="store.removeSocial(social.id)"
              >
                <Trash2 :size="16" aria-hidden="true" />
              </button>
            </div>
            <label
              >地址<input
                v-model.trim="social.href"
                inputmode="url"
                maxlength="2048"
                placeholder="https://example.com 或 /about#contact"
                :class="{ 'is-invalid': social.href && !normalizeProfileSocialHref(social.href) }"
                :aria-invalid="Boolean(social.href && !normalizeProfileSocialHref(social.href))"
                :aria-describedby="
                  social.href && !normalizeProfileSocialHref(social.href)
                    ? `social-error-${social.id}`
                    : undefined
                "
            /></label>
            <p
              v-if="social.href && !normalizeProfileSocialHref(social.href)"
              :id="`social-error-${social.id}`"
              class="settings-hint"
              role="alert"
            >
              请输入 http(s):// 开头的链接、/ 开头的站内路径，或 mailto:、tel: 地址。
            </p>
            <SocialIconPicker
              v-if="iconPickerFor === social.id"
              :selected="social.icon"
              @select="chooseIcon(social.id, $event)"
            />
          </div>
        </section>

        <button class="settings-reset" type="button" @click="store.reset">
          <RotateCcw :size="15" aria-hidden="true" />恢复默认
        </button>
      </form>
    </div>
  </dialog>
</template>

<style scoped>
:global(html:has(.settings-dialog[open])) {
  overflow: hidden;
}

.settings-dialog {
  width: min(92vw, 680px);
  max-width: 100%;
  max-height: min(88dvh, 760px);
  margin: auto;
  padding: 0;
  border: 0;
  border-radius: 16px;
  box-shadow: 0 24px 70px rgb(31 24 30 / 24%);
  background: transparent;
  color: var(--ink);
  overflow: hidden;
  opacity: 0;
  scale: 0.96;
  translate: 0 12px;
  transition:
    opacity 220ms var(--motion-ease-enter),
    scale 220ms var(--motion-ease-enter),
    translate 220ms var(--motion-ease-enter),
    display 220ms allow-discrete,
    overlay 220ms allow-discrete;
}
.settings-dialog[open] {
  opacity: 1;
  scale: 1;
  translate: 0 0;
}
.settings-dialog::backdrop {
  opacity: 0;
  background: rgb(34 23 31 / 42%);
  transition:
    opacity 220ms var(--motion-ease-enter),
    display 220ms allow-discrete,
    overlay 220ms allow-discrete;
}
.settings-dialog[open]::backdrop {
  opacity: 1;
}
@starting-style {
  .settings-dialog[open] {
    opacity: 0;
    scale: 0.96;
    translate: 0 12px;
  }
  .settings-dialog[open]::backdrop {
    opacity: 0;
  }
}
.settings-surface {
  display: flex;
  max-height: min(88dvh, 760px);
  flex-direction: column;
  overflow: hidden;
  background: var(--surface);
}
.settings-header {
  display: flex;
  min-height: 66px;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  border-bottom: 1px solid var(--line);
}
.settings-header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.15rem;
}
.settings-close,
.settings-add,
.settings-reset,
.icon-picker-trigger,
.social-remove {
  cursor: pointer;
}
.settings-close {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--surface);
  color: var(--ink);
}
.settings-form {
  display: grid;
  gap: 22px;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 24px 22px 28px;
}
.settings-form fieldset,
.social-settings {
  display: grid;
  gap: 10px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.settings-form legend,
.settings-section-heading h3 {
  margin-bottom: 2px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 400;
}
.settings-form label {
  display: grid;
  gap: 6px;
  min-width: 0;
  font-size: 0.82rem;
}
.settings-form input {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 10px;
  background: var(--page-bg);
  color: var(--ink);
  font: inherit;
}
.settings-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.settings-section-heading h3 {
  margin: 0;
}
.settings-add {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 32px;
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 5px 9px;
  background: transparent;
  color: var(--petal-deep);
  font: inherit;
  font-size: 0.78rem;
}
.settings-hint,
.settings-empty {
  margin: 0;
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1.6;
}
.social-editor {
  display: grid;
  gap: 9px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: color-mix(in srgb, var(--page-bg) 72%, transparent);
}
.social-editor-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: end;
}
.icon-picker-trigger {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  gap: 7px;
  max-width: 180px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 10px;
  background: var(--page-bg);
  color: var(--ink);
  font: inherit;
  font-size: 0.74rem;
}
.icon-picker-trigger span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.social-remove {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
}
.settings-reset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  font: inherit;
}
.settings-form input:focus-visible,
.settings-form button:focus-visible {
  outline: 2px solid var(--petal);
  outline-offset: 2px;
}
.settings-form input.is-invalid {
  border-color: var(--petal-deep);
}
@media (max-width: 600px) {
  .settings-dialog {
    width: min(94vw, 680px);
    max-height: 90dvh;
  }
  .settings-surface {
    max-height: 90dvh;
  }
  .settings-form {
    padding-inline: 16px;
  }
  .settings-form input {
    font-size: 1rem;
  }
  .social-editor-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .social-label {
    grid-column: 1 / -1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .settings-dialog,
  .settings-dialog::backdrop {
    transition: none;
  }
}
</style>
