<script setup lang="ts">
definePageMeta({ middleware: 'guest' })

type AuthMode = 'signin' | 'signup'
type AppRole = 'demo' | 'user' | 'admin'

type AuthOption = {
  id: AuthMode
  title: string
  description: string
}

const options: AuthOption[] = [
  { id: 'signin', title: 'Sign in', description: 'Open an existing Listen Direct workspace.' },
  { id: 'signup', title: 'Create account', description: 'Create a protected workspace in Supabase.' },
]

const route = useRoute()
const credentials = reactive({ email: '', password: '', fullName: '', organizationName: '' })
const mode = ref<AuthMode>('signin')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showPassword = ref(false)

function selectMode(selectedMode: AuthMode) {
  mode.value = selectedMode
  errorMessage.value = ''
  successMessage.value = ''
}

function safeRedirect(role: AppRole) {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  if (redirect.startsWith('/') && !redirect.startsWith('//')) return redirect
  return role === 'admin' ? '/admin' : '/dashboard'
}

async function submit() {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (mode.value === 'signup') {
      const result = await $fetch<{ confirmationRequired: boolean; user: { role: AppRole } | null }>('/api/auth/signup', {
        method: 'POST',
        body: credentials,
      })

      if (result.confirmationRequired || !result.user) {
        successMessage.value = 'Check your email to confirm the account, then sign in.'
        mode.value = 'signin'
        return
      }

      await navigateTo(safeRedirect(result.user.role), { external: true })
      return
    }

    const result = await $fetch<{ user: { role: AppRole } }>('/api/auth/login', {
      method: 'POST',
      body: { email: credentials.email, password: credentials.password },
    })
    await navigateTo(safeRedirect(result.user.role), { external: true })
  } catch (error: unknown) {
    const response = error as { data?: { statusMessage?: string } }
    errorMessage.value = response.data?.statusMessage ?? (mode.value === 'signin' ? 'The email or password is incorrect.' : 'Unable to create the account.')
  } finally {
    loading.value = false
  }
}

useHead({
  title: 'Sign in · Listen Direct',
  meta: [{ name: 'description', content: 'Sign in to the Listen Direct voice operations platform.' }],
})
</script>

<template>
  <main class="login-page">
    <section class="login-story">
      <NuxtLink class="login-brand" to="/" aria-label="Listen Direct home">
        <span><i /><i /><i /></span> LISTEN<strong>/DIRECT</strong>
      </NuxtLink>
      <div class="story-copy">
        <p><i /> SECURE VOICE OPERATIONS</p>
        <h1>Hear the signal.<br><em>Control the system.</em></h1>
        <span>Operate direct-audio routing, model fallbacks, evaluation, and privacy from one protected workspace.</span>
      </div>
      <div class="auth-flow" aria-label="Authentication flow">
        <div><small>01</small><strong>Identity</strong><span>Supabase Auth</span></div><b>→</b><div><small>02</small><strong>Session</strong><span>Same-site cookies</span></div><b>→</b><div><small>03</small><strong>Role + RLS</strong><span>Scoped access</span></div>
      </div>
      <footer><span>SESSION SECURITY</span><strong>Encrypted · SameSite · Time limited</strong></footer>
    </section>

    <section class="login-panel">
      <div class="login-box">
        <header><span>SUPABASE AUTH</span><h2>{{ mode === 'signin' ? 'Sign in to your workspace' : 'Create your workspace' }}</h2><p>Identity and access are verified through the connected Supabase project.</p></header>

        <div class="account-types">
          <button v-for="option in options" :key="option.id" type="button" :class="{ active: mode === option.id }" @click="selectMode(option.id)">
            <span>{{ option.id === 'signin' ? 'IN' : '+' }}</span>
            <div><strong>{{ option.title }}</strong><small>{{ option.description }}</small></div>
            <i>{{ mode === option.id ? '●' : '○' }}</i>
          </button>
        </div>

        <form @submit.prevent="submit">
          <template v-if="mode === 'signup'">
            <label><span>YOUR NAME</span><input v-model="credentials.fullName" type="text" autocomplete="name" minlength="2" maxlength="120" required></label>
            <label><span>WORKSPACE NAME</span><input v-model="credentials.organizationName" type="text" autocomplete="organization" minlength="2" maxlength="120" required></label>
          </template>
          <label><span>EMAIL ADDRESS</span><input v-model="credentials.email" type="email" autocomplete="username" required></label>
          <label><span>PASSWORD</span><div><input v-model="credentials.password" :type="showPassword ? 'text' : 'password'" :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'" :minlength="mode === 'signin' ? 8 : 12" required><button type="button" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</button></div></label>
          <p v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</p>
          <p v-if="successMessage" class="login-success" role="status">{{ successMessage }}</p>
          <button class="login-submit" type="submit" :disabled="loading">{{ loading ? 'Working…' : mode === 'signin' ? 'Enter workspace' : 'Create secure account' }} <span>→</span></button>
        </form>

        <div class="credential-note"><span>SECURE IDENTITY</span><p>Passwords are handled by Supabase Auth. Listen Direct stores workspace roles and product data behind row-level security.</p><div class="login-legal"><NuxtLink to="/privacy">Privacy Policy</NuxtLink><NuxtLink to="/terms">Terms of Use</NuxtLink></div></div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-page{--lime:#c6ff4a;--ink:#eef4e9;--muted:#879286;--line:#dff4d51c;min-height:100vh;background:#080c09;color:var(--ink);display:grid;grid-template-columns:minmax(420px,1.08fr) minmax(480px,.92fr);font-family:Arial,Helvetica,sans-serif}.login-story{padding:42px clamp(36px,6vw,88px);border-right:1px solid var(--line);background:radial-gradient(circle at 75% 25%,#a5e53d21,transparent 24rem),linear-gradient(155deg,#111812,#080c09 68%);display:flex;flex-direction:column}.login-brand{display:flex;align-items:center;gap:10px;letter-spacing:.12em;font-size:12px;font-weight:800}.login-brand>span{width:28px;height:28px;border:1px solid var(--lime);display:flex;align-items:center;justify-content:center;gap:2px}.login-brand i{display:block;width:2px;height:8px;background:var(--lime)}.login-brand i:nth-child(2){height:15px}.login-brand i:nth-child(3){height:5px}.login-brand strong{color:var(--lime)}.story-copy{margin:auto 0}.story-copy>p{color:var(--muted);letter-spacing:.18em;font:700 9px ui-monospace,SFMono-Regular,Menlo,monospace}.story-copy>p i{display:inline-block;width:6px;height:6px;background:var(--lime);border-radius:50%;box-shadow:0 0 12px var(--lime);margin-right:10px}.story-copy h1{font-size:clamp(50px,6.2vw,86px);line-height:.93;letter-spacing:-.065em;font-weight:500;margin:25px 0}.story-copy h1 em{color:var(--lime);font-family:Georgia,serif;font-weight:400}.story-copy>span{display:block;color:#a4afa2;max-width:540px;font-size:15px;line-height:1.8}.auth-flow{display:grid;grid-template-columns:1fr 22px 1fr 22px 1fr;align-items:center;border:1px solid var(--line);padding:18px;margin-top:52px}.auth-flow div{min-width:0}.auth-flow small,.auth-flow strong,.auth-flow span{display:block}.auth-flow small{color:#657064;font:8px ui-monospace,SFMono-Regular,Menlo,monospace}.auth-flow strong{font-size:11px;margin:13px 0 5px}.auth-flow span{color:var(--lime);text-transform:uppercase;font:7px ui-monospace,SFMono-Regular,Menlo,monospace}.auth-flow b{color:#596359;font-weight:400}.login-story footer{border-top:1px solid var(--line);margin-top:28px;padding-top:22px;display:flex;justify-content:space-between;gap:20px;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace}.login-story footer span{color:#626d62}.login-story footer strong{color:var(--lime);font-weight:700}.login-panel{display:grid;place-items:center;padding:42px;background:#0b100d}.login-box{width:min(470px,100%)}.login-box header>span{color:var(--lime);letter-spacing:.17em;font:700 9px ui-monospace,SFMono-Regular,Menlo,monospace}.login-box h2{font-size:34px;letter-spacing:-.04em;margin:12px 0 10px;font-weight:500}.login-box header p{color:var(--muted);font-size:12px;line-height:1.7;margin:0}.account-types{display:grid;gap:8px;margin:28px 0}.account-types>button{border:1px solid var(--line);background:#0f1511;display:grid;grid-template-columns:34px 1fr 18px;gap:12px;align-items:center;text-align:left;padding:12px;cursor:pointer}.account-types>button:hover,.account-types>button.active{border-color:#c6ff4a6b;background:#131c13}.account-types>button>span{width:34px;height:34px;border:1px solid #34402f;color:#8d998b;display:grid;place-items:center;font:700 10px ui-monospace,SFMono-Regular,Menlo,monospace}.account-types>button.active>span{background:var(--lime);border-color:var(--lime);color:#10170a}.account-types strong,.account-types small{display:block}.account-types strong{font-size:11px}.account-types small{color:#768175;font-size:9px;margin-top:4px}.account-types>button>i{color:var(--lime);font-style:normal}.login-box form{border-top:1px solid var(--line);padding-top:22px}.login-box label{display:block;margin-bottom:16px}.login-box label>span{display:block;color:#6e796d;letter-spacing:.13em;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace;margin-bottom:8px}.login-box label>input,.login-box label>div{width:100%;height:45px;border:1px solid var(--line);background:#0e1410}.login-box input{width:100%;height:100%;outline:0;padding:0 13px;color:var(--ink);font-size:12px}.login-box label>div{display:flex;align-items:center}.login-box label>div button{color:var(--lime);font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace;padding:0 12px;cursor:pointer}.login-error,.login-success{padding:10px 12px;font-size:10px}.login-error{border:1px solid #ff80664a;background:#ff80660c;color:#ff9c88}.login-success{border:1px solid #c6ff4a4a;background:#c6ff4a0c;color:var(--lime)}.login-submit{width:100%;height:48px;background:var(--lime);color:#11170b;display:flex;align-items:center;justify-content:space-between;padding:0 16px;text-transform:uppercase;letter-spacing:.1em;font-size:9px;font-weight:800;cursor:pointer}.login-submit:disabled{opacity:.6;cursor:wait}.login-submit span{font-size:14px}.credential-note{border-left:2px solid #44503d;margin-top:22px;padding-left:13px}.credential-note span{color:#788377;letter-spacing:.12em;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace}.credential-note p{color:#687368;font-size:9px;line-height:1.6;margin:6px 0 0}@media(max-width:900px){.login-page{grid-template-columns:1fr}.login-story{min-height:460px;border-right:0;border-bottom:1px solid var(--line)}.story-copy{margin:70px 0}.auth-flow{margin-top:0}.login-panel{padding:55px 24px}}@media(max-width:560px){.login-story{padding:28px 20px}.story-copy h1{font-size:48px}.auth-flow{grid-template-columns:1fr}.auth-flow>b{display:none}.auth-flow div{border-bottom:1px solid var(--line);padding:12px}.auth-flow div:last-child{border:0}.login-story footer{display:block}.login-story footer strong{display:block;margin-top:8px}.login-panel{padding:40px 18px}.login-box h2{font-size:29px}}
</style>
