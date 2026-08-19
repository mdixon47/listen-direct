<script setup lang="ts">
definePageMeta({ middleware: ['authenticated', 'admin'] })

type AdminUser = {
  id: string
  name: string
  email: string
  role: 'demo' | 'user' | 'admin'
  workspace: string
}

const { user, clear } = useUserSession()
const { data, status, error, refresh } = await useFetch<{ users: AdminUser[]; generatedAt: string }>('/api/admin/users')

const auditEvents = [
  { time: '14:42:18', actor: 'Platform Admin', action: 'Updated retention policy', scope: 'Production', result: 'Applied' },
  { time: '13:18:04', actor: 'Product Operator', action: 'Selected primary model', scope: 'Production', result: 'Applied' },
  { time: '12:51:33', actor: 'Demo Operator', action: 'Started sandbox session', scope: 'Demo Sandbox', result: 'Session only' },
  { time: '11:06:51', actor: 'Platform Admin', action: 'Reviewed fallback alert', scope: 'All Workspaces', result: 'Acknowledged' },
]

const initials = computed(() => user.value?.name.split(' ').map(part => part[0]).join('').slice(0, 2) ?? 'AD')

async function logout() {
  await clear()
  await navigateTo('/login')
}

useHead({ title: 'Administration · Listen Direct' })
</script>

<template>
  <div class="admin-page">
    <aside>
      <NuxtLink class="admin-brand" to="/"><span><i /><i /><i /></span>LISTEN<strong>/DIRECT</strong></NuxtLink>
      <p>PLATFORM ADMINISTRATION</p>
      <nav><NuxtLink to="/admin" class="active"><span>01</span>Identity overview</NuxtLink><NuxtLink to="/dashboard"><span>02</span>Voice operations</NuxtLink></nav>
      <div class="admin-legal"><NuxtLink to="/privacy">Privacy</NuxtLink><NuxtLink to="/terms">Terms</NuxtLink></div><div class="admin-profile"><span>{{ initials }}</span><div><strong>{{ user?.name }}</strong><small>{{ user?.email }}</small></div><button @click="logout">Sign out</button></div>
    </aside>

    <main>
      <header><div><span>ADMIN / IDENTITY</span><h1>Access control</h1></div><div><button @click="refresh">↻ Refresh</button><NuxtLink to="/dashboard">Open operations →</NuxtLink></div></header>

      <section class="admin-metrics"><article><span>TOTAL IDENTITIES</span><strong>{{ data?.users.length ?? 0 }}</strong><p>Across all environments</p></article><article><span>ACTIVE ROLES</span><strong>3</strong><p>Demo · User · Admin</p></article><article><span>SESSION POLICY</span><strong>8h</strong><p>Demo sessions expire in 2h</p></article><article><span>AUTH HEALTH</span><strong class="healthy">100%</strong><p>Sealed-cookie verification</p></article></section>

      <section class="admin-panel users-panel">
        <div class="panel-title"><div><span>IDENTITY DIRECTORY</span><strong>Development accounts</strong></div><small>{{ status === 'pending' ? 'Loading…' : 'Role gates active' }}</small></div>
        <p v-if="error" class="error">Unable to load the protected user directory.</p>
        <div v-else class="admin-table"><table><thead><tr><th>Identity</th><th>Role</th><th>Workspace</th><th>Session</th><th>Status</th></tr></thead><tbody><tr v-for="account in data?.users" :key="account.id"><td><span>{{ account.name.split(' ').map(part => part[0]).join('') }}</span><div><strong>{{ account.name }}</strong><small>{{ account.email }}</small></div></td><td><b :class="account.role">{{ account.role }}</b></td><td>{{ account.workspace }}</td><td>{{ account.role === 'demo' ? '2 hours' : '8 hours' }}</td><td><i /> Active</td></tr></tbody></table></div>
      </section>

      <section class="admin-grid"><article class="admin-panel permissions"><div class="panel-title"><div><span>ROLE MATRIX</span><strong>Effective permissions</strong></div></div><div><span>Capability</span><b>Demo</b><b>User</b><b>Admin</b></div><div><span>Explore dashboard</span><i>✓</i><i>✓</i><i>✓</i></div><div><span>Operate live turns</span><i>Sandbox</i><i>✓</i><i>✓</i></div><div><span>Change policies</span><i>—</i><i>Workspace</i><i>Global</i></div><div><span>Manage identities</span><i>—</i><i>—</i><i>✓</i></div></article><article class="admin-panel audit"><div class="panel-title"><div><span>RECENT AUDIT</span><strong>Identity activity</strong></div></div><ul><li v-for="event in auditEvents" :key="`${event.time}-${event.action}`"><time>{{ event.time }}</time><div><strong>{{ event.action }}</strong><span>{{ event.actor }} · {{ event.scope }}</span></div><b>{{ event.result }}</b></li></ul></article></section>
    </main>
  </div>
</template>

<style scoped>
.admin-page{--lime:#c6ff4a;--ink:#eef4e9;--muted:#7d887c;--line:#dff4d51b;min-height:100vh;background:radial-gradient(circle at 84% -5%,#8acb361c,transparent 28rem),#080c09;color:var(--ink);display:grid;grid-template-columns:235px 1fr;font-family:Arial,Helvetica,sans-serif}.admin-page>aside{position:sticky;top:0;height:100vh;border-right:1px solid var(--line);background:#090e0b;padding:25px 18px;display:flex;flex-direction:column}.admin-brand{display:flex;align-items:center;gap:9px;letter-spacing:.1em;font-size:11px;font-weight:800}.admin-brand>span{width:27px;height:27px;border:1px solid var(--lime);display:flex;align-items:center;justify-content:center;gap:2px}.admin-brand i{width:2px;height:8px;background:var(--lime)}.admin-brand i:nth-child(2){height:15px}.admin-brand i:nth-child(3){height:5px}.admin-brand strong{color:var(--lime)}.admin-page>aside>p{color:#657064;letter-spacing:.15em;font:700 7px ui-monospace,SFMono-Regular,Menlo,monospace;border-top:1px solid var(--line);margin:24px 0 14px;padding:20px 8px 0}.admin-page nav{display:grid;gap:5px}.admin-page nav a{color:var(--muted);padding:11px 9px;font-size:11px;display:flex;gap:11px}.admin-page nav a span{font:8px ui-monospace,SFMono-Regular,Menlo,monospace}.admin-page nav a.active{background:var(--lime);color:#10170a;font-weight:700}.admin-profile{margin-top:auto;border-top:1px solid var(--line);padding-top:16px;display:grid;grid-template-columns:34px 1fr;gap:10px;align-items:center}.admin-profile>span{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#1b2817;color:var(--lime);font-size:9px}.admin-profile strong,.admin-profile small{display:block}.admin-profile strong{font-size:10px}.admin-profile small{color:var(--muted);font-size:8px;margin-top:3px}.admin-profile button{grid-column:1/-1;border:1px solid var(--line);padding:9px;color:var(--muted);font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace;cursor:pointer}.admin-page>main{padding:0 32px 50px;min-width:0}.admin-page main>header{height:108px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center}.admin-page main>header>div:first-child span{color:#687368;letter-spacing:.15em;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace}.admin-page h1{font-size:30px;line-height:1;margin:10px 0 0;letter-spacing:-.04em;font-weight:500}.admin-page main>header>div:last-child{display:flex;gap:8px}.admin-page main>header button,.admin-page main>header a{border:1px solid var(--line);padding:12px 14px;color:var(--muted);text-transform:uppercase;font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace}.admin-page main>header a{background:var(--lime);color:#11170b}.admin-metrics{display:grid;grid-template-columns:repeat(4,1fr);border-left:1px solid var(--line);margin-top:25px}.admin-metrics article{background:#0e1410;border:1px solid var(--line);border-left:0;padding:18px}.admin-metrics span{color:#687368;letter-spacing:.12em;font:700 7px ui-monospace,SFMono-Regular,Menlo,monospace}.admin-metrics strong{font:400 31px ui-monospace,SFMono-Regular,Menlo,monospace;display:block;margin:20px 0 8px}.admin-metrics strong.healthy{color:var(--lime)}.admin-metrics p{color:var(--muted);font-size:8px;margin:0}.admin-panel{border:1px solid var(--line);background:linear-gradient(145deg,#121a14,#0d120f)}.users-panel{margin-top:18px}.panel-title{min-height:65px;border-bottom:1px solid var(--line);padding:0 18px;display:flex;align-items:center;justify-content:space-between}.panel-title span,.panel-title strong{display:block}.panel-title span{color:#687368;letter-spacing:.13em;font:700 7px ui-monospace,SFMono-Regular,Menlo,monospace;margin-bottom:7px}.panel-title strong{font-size:12px}.panel-title small{color:var(--lime);font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace}.admin-table{overflow-x:auto}.admin-table table{width:100%;border-collapse:collapse;min-width:720px}.admin-table th{text-align:left;color:#657064;letter-spacing:.12em;font:700 7px ui-monospace,SFMono-Regular,Menlo,monospace;padding:12px 16px;border-bottom:1px solid var(--line)}.admin-table td{padding:14px 16px;color:#939e91;font-size:9px;border-bottom:1px solid #dff4d50c}.admin-table td:first-child{display:flex;align-items:center;gap:10px}.admin-table td:first-child>span{width:31px;height:31px;border-radius:50%;background:#1a2517;color:var(--lime);display:grid;place-items:center;font-size:8px}.admin-table td strong,.admin-table td small{display:block}.admin-table td strong{color:var(--ink);font-size:10px}.admin-table td small{color:var(--muted);font-size:8px;margin-top:4px}.admin-table td>b{display:inline-block;padding:5px 7px;border:1px solid var(--line);text-transform:uppercase;font:700 7px ui-monospace,SFMono-Regular,Menlo,monospace}.admin-table td>b.demo{color:#8d998b}.admin-table td>b.user{color:#79d8ff}.admin-table td>b.admin{color:var(--lime)}.admin-table td:last-child{color:var(--lime)}.admin-table td:last-child i{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--lime);margin-right:6px}.error{color:#ff9c88;padding:20px}.admin-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.permissions>div:not(.panel-title){display:grid;grid-template-columns:1.5fr repeat(3,1fr);padding:11px 17px;border-bottom:1px solid #dff4d50d;align-items:center}.permissions>div:not(.panel-title) span{font-size:9px}.permissions>div:not(.panel-title) b,.permissions>div:not(.panel-title) i{text-align:center;color:var(--muted);font:700 8px ui-monospace,SFMono-Regular,Menlo,monospace}.permissions>div:not(.panel-title) i{color:var(--lime);font-style:normal}.audit ul{list-style:none;margin:0;padding:6px 17px}.audit li{display:grid;grid-template-columns:58px 1fr auto;gap:12px;align-items:center;padding:13px 0;border-bottom:1px solid #dff4d50d}.audit time{color:#697469;font:8px ui-monospace,SFMono-Regular,Menlo,monospace}.audit li strong,.audit li span{display:block}.audit li strong{font-size:9px}.audit li span{color:var(--muted);font-size:8px;margin-top:4px}.audit li b{color:var(--lime);font:700 7px ui-monospace,SFMono-Regular,Menlo,monospace}@media(max-width:1000px){.admin-page{grid-template-columns:190px 1fr}.admin-page>main{padding-inline:20px}.admin-metrics{grid-template-columns:repeat(2,1fr)}.admin-grid{grid-template-columns:1fr}}@media(max-width:700px){.admin-page{display:block}.admin-page>aside{position:static;height:auto}.admin-page nav{grid-template-columns:1fr 1fr}.admin-profile{display:none}.admin-page>main{padding:0 14px 35px}.admin-page main>header{height:auto;padding:22px 0;align-items:flex-start}.admin-page main>header>div:last-child{flex-direction:column}.admin-metrics{grid-template-columns:1fr}.admin-grid{grid-template-columns:1fr}}
</style>
