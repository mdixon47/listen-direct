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
const demoEmail = 'demo@listendirect.com'
const credentials = reactive({ email: '', password: '', fullName: '', organizationName: '' })
const mode = ref<AuthMode>(route.query.mode === 'signup' ? 'signup' : 'signin')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showPassword = ref(false)
const passwordInput = ref<HTMLInputElement | null>(null)

function selectMode(selectedMode: AuthMode) {
  mode.value = selectedMode
  errorMessage.value = ''
  successMessage.value = ''
}

async function useDemoAccount() {
  selectMode('signin')
  credentials.email = demoEmail
  credentials.password = ''
  await nextTick()
  passwordInput.value?.focus()
}

async function launchGuestDemo() {
  await navigateTo({ path: '/dashboard', query: { demo: '1' } })
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
        <span><i /><i /><i /></span><b>LISTEN<strong>/DIRECT</strong></b>
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

        <div v-if="mode === 'signin'" class="demo-options">
          <button class="demo-account" type="button" @click="launchGuestDemo">
            <span>INSTANT DEMO</span>
            <div><strong>No account or password</strong><small>Open a temporary, browser-only product sandbox.</small></div>
            <b>Launch sandbox →</b>
          </button>
          <button class="demo-email" type="button" @click="useDemoAccount">Use shared demo account <strong>{{ demoEmail }}</strong> →</button>
        </div>

        <form @submit.prevent="submit">
          <template v-if="mode === 'signup'">
            <label><span>YOUR NAME</span><input v-model="credentials.fullName" type="text" autocomplete="name" minlength="2" maxlength="120" required></label>
            <label><span>WORKSPACE NAME</span><input v-model="credentials.organizationName" type="text" autocomplete="organization" minlength="2" maxlength="120" required></label>
          </template>
          <label><span>EMAIL ADDRESS</span><input v-model="credentials.email" type="email" autocomplete="username" required></label>
          <label><span>PASSWORD</span><div><input ref="passwordInput" v-model="credentials.password" :type="showPassword ? 'text' : 'password'" :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'" :minlength="mode === 'signin' ? 8 : 12" required><button type="button" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</button></div></label>
          <p v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</p>
          <p v-if="successMessage" class="login-success" role="status">{{ successMessage }}</p>
          <button class="login-submit" type="submit" :disabled="loading">{{ loading ? 'Working…' : mode === 'signin' ? 'Enter workspace' : 'Create secure account' }} <span>→</span></button>
        </form>

        <div class="credential-note"><span>SECURE IDENTITY</span><p>Passwords are handled by Supabase Auth. Listen Direct stores workspace roles and product data behind row-level security.</p><div class="login-legal"><NuxtLink to="/help">Help Center</NuxtLink><NuxtLink to="/privacy">Privacy Policy</NuxtLink><NuxtLink to="/terms">Terms of Use</NuxtLink></div></div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.demo-options{display:grid;gap:8px;margin-bottom:18px}.demo-account{margin-bottom:0}.demo-email{color:#788377;text-align:left;padding:4px 1px;cursor:pointer;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace}.demo-email strong{color:var(--lime)}
</style>
