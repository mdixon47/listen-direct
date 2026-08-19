<script setup lang="ts">
type CookiePreferences = {
  essential: true
  analytics: boolean
  version: '1.0'
  updatedAt: string
}

const preferences = useCookie<CookiePreferences | null>('ld-cookie-preferences', {
  default: () => null,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 180,
})

const reopened = ref(false)
const customizing = ref(false)
const analytics = ref(false)
const visible = computed(() => !preferences.value || reopened.value)

function openSettings() {
  analytics.value = preferences.value?.analytics ?? false
  customizing.value = true
  reopened.value = true
}

function save(analyticsEnabled: boolean) {
  preferences.value = {
    essential: true,
    analytics: analyticsEnabled,
    version: '1.0',
    updatedAt: new Date().toISOString(),
  }
  analytics.value = analyticsEnabled
  customizing.value = false
  reopened.value = false

  if (import.meta.client) {
    window.dispatchEvent(new CustomEvent('listen-direct:consent', { detail: preferences.value }))
  }
}
</script>

<template>
  <Transition name="cookie-slide">
    <aside v-if="visible" class="cookie-consent" aria-label="Cookie preferences">
      <div class="cookie-copy">
        <span>PRIVACY CONTROLS</span>
        <h2>Choose how this site uses cookies.</h2>
        <p>Essential cookies keep authentication and preferences working. Optional analytics remain off unless you actively enable them.</p>
        <div class="cookie-links"><NuxtLink to="/privacy">Privacy Policy</NuxtLink><NuxtLink to="/terms">Terms of Use</NuxtLink></div>
      </div>

      <div v-if="customizing" class="cookie-options">
        <label><span><strong>Essential</strong><small>Sessions, security, and your cookie choice</small></span><input type="checkbox" checked disabled></label>
        <label><span><strong>Analytics</strong><small>Anonymous product-usage measurement</small></span><input v-model="analytics" type="checkbox"></label>
      </div>

      <div class="cookie-actions">
        <template v-if="customizing"><button class="secondary" @click="save(false)">Essential only</button><button class="primary" @click="save(analytics)">Save choices</button></template>
        <template v-else><button class="text" @click="customizing = true">Customize</button><button class="secondary" @click="save(false)">Essential only</button><button class="primary" @click="save(true)">Accept all</button></template>
      </div>
    </aside>
  </Transition>

  <button v-if="!visible" class="cookie-settings" aria-label="Open cookie settings" @click="openSettings">Cookie settings</button>
</template>

<style scoped>
.cookie-consent{--lime:#c6ff4a;position:fixed;z-index:1000;left:20px;right:20px;bottom:20px;max-width:1180px;margin:auto;border:1px solid #c6ff4a55;background:#0c120ef5;box-shadow:0 20px 80px #000b;backdrop-filter:blur(18px);color:#eef4e9;padding:20px;display:grid;grid-template-columns:minmax(300px,1fr) minmax(260px,.75fr) auto;gap:24px;align-items:center;font-family:Arial,Helvetica,sans-serif}.cookie-copy>span{color:var(--lime);letter-spacing:.15em;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace}.cookie-copy h2{font-size:19px;letter-spacing:-.025em;margin:7px 0;font-weight:600}.cookie-copy p{color:#8d988c;font-size:10px;line-height:1.55;margin:0;max-width:570px}.cookie-links{display:flex;gap:14px;margin-top:9px}.cookie-links a{color:#b6c0b3;text-decoration:underline;text-underline-offset:3px;font-size:9px}.cookie-options{border-left:1px solid #dff4d51c;padding-left:20px}.cookie-options label{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:7px 0}.cookie-options label+label{border-top:1px solid #dff4d512}.cookie-options strong,.cookie-options small{display:block}.cookie-options strong{font-size:10px}.cookie-options small{color:#788377;font-size:8px;margin-top:3px}.cookie-options input{width:16px;height:16px;accent-color:var(--lime)}.cookie-actions{display:flex;gap:7px;justify-content:flex-end;flex-wrap:wrap}.cookie-actions button{min-height:37px;padding:0 12px;text-transform:uppercase;letter-spacing:.08em;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace;cursor:pointer;white-space:nowrap}.cookie-actions .primary{background:var(--lime);color:#10170a}.cookie-actions .secondary{border:1px solid #dff4d529;color:#dce5d8}.cookie-actions .text{color:#98a394}.cookie-settings{position:fixed;z-index:900;left:14px;bottom:14px;border:1px solid #dff4d529;background:#0c120ee8;color:#aab5a8;padding:8px 10px;text-transform:uppercase;letter-spacing:.08em;font:700 7px ui-monospace,SFMono-Regular,Menlo,monospace;cursor:pointer}.cookie-slide-enter-active,.cookie-slide-leave-active{transition:transform .25s ease,opacity .25s}.cookie-slide-enter-from,.cookie-slide-leave-to{transform:translateY(20px);opacity:0}@media(max-width:900px){.cookie-consent{grid-template-columns:1fr auto}.cookie-options{grid-column:1/-1;border-left:0;border-top:1px solid #dff4d51c;padding:10px 0 0}.cookie-actions{grid-column:2;grid-row:1}}@media(max-width:620px){.cookie-consent{left:10px;right:10px;bottom:10px;grid-template-columns:1fr;padding:17px;gap:15px}.cookie-actions{grid-column:1;grid-row:auto;justify-content:stretch}.cookie-actions button{flex:1}.cookie-options{grid-column:1}.cookie-settings{left:10px;bottom:10px}}
</style>
