<script setup lang="ts">
const props = defineProps<{
  baseUrl: string
}>()

const emit = defineEmits<{
  (e: 'update-base-url', value: string): void
}>()

const year = new Date().getFullYear()

const configureBaseUrl = () => {
  if (typeof window === 'undefined') {
    return
  }

  const nextUrl = window.prompt('请输入 DailyHotApi 基础地址（示例：http://localhost:6688）', props.baseUrl)
  if (nextUrl === null) {
    return
  }

  emit('update-base-url', nextUrl)
}
</script>

<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <div>
        <p>数据来源：DailyHotApi（支持 40+ 平台热点聚合接口）</p>
        <p>免责声明：内容来源于各平台公开信息，仅用于学习与信息聚合展示。</p>
      </div>

      <div class="footer-side">
        <button type="button" class="url-btn" @click="configureBaseUrl">切换接口地址</button>
        <p class="copyright">© {{ year }} 米奇妙妙屋 · 全网热榜</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 24px;
}

.footer-inner {
  width: min(1240px, calc(100% - 30px));
  margin: 0 auto;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--panel-bg);
  box-shadow: var(--shadow-card);
}

.footer-inner p {
  margin: 4px 0;
  line-height: 1.5;
}

.footer-side {
  text-align: right;
}

.url-btn {
  border: 1px solid var(--color-border);
  background: var(--panel-bg);
  color: var(--text-secondary);
  border-radius: 12px;
  height: 32px;
  padding: 0 12px;
  cursor: pointer;
  transition: color var(--motion-duration) var(--motion-ease), border-color var(--motion-duration) var(--motion-ease), background var(--motion-duration) var(--motion-ease);
}

.url-btn:hover {
  color: #bb362f;
  border-color: rgba(232, 63, 55, 0.42);
  background: color-mix(in srgb, #ffc800 14%, #ffffff);
}

.url-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(232, 63, 55, 0.14);
}

@media (max-width: 900px) {
  .footer-inner {
    width: min(100%, calc(100% - 22px));
    flex-direction: column;
    padding: 14px 14px 16px;
  }

  .footer-side {
    text-align: left;
  }
}
</style>
