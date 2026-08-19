import { serverSupabaseClient } from '#supabase/server'
import { requireAppUser } from '../../utils/supabase-auth'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const client = await serverSupabaseClient(event)
  const { count } = await client
    .from('voice_turns')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', user.organizationId)

  return {
    workspace: user.workspace,
    role: user.role,
    persistedTurns: count ?? 0,
    metrics: {
      directRouteRate: 94.7,
      medianLatencyMs: 482,
      turnSuccessRate: 99.2,
    },
  }
})
