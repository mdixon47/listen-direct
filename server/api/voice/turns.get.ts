import { serverSupabaseClient } from '#supabase/server'
import { requireAppUser } from '../../utils/supabase-auth'

function formatTurn(turn: {
  id: string
  started_at: string
  duration_ms: number
  route: string
  model: string
  latency_ms: number
  signal: string
  status: string
  transcript: string | null
}) {
  return {
    id: `turn_${turn.id.slice(0, 8)}`,
    time: new Date(turn.started_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    duration: `${(turn.duration_ms / 1000).toFixed(1)}s`,
    route: turn.route === 'fallback' ? 'Fallback' : 'Direct',
    model: turn.model,
    latency: `${turn.latency_ms}ms`,
    signal: turn.signal,
    status: turn.status === 'flagged' || turn.status === 'failed' ? 'Flagged' : 'Complete',
    transcript: turn.transcript ?? 'Transcript disabled for this turn.',
  }
}

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('voice_turns')
    .select('id, started_at, duration_ms, route, model, latency_ms, signal, status, transcript')
    .eq('organization_id', user.organizationId)
    .order('started_at', { ascending: false })
    .limit(100)

  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to load voice turns' })
  return { turns: data.map(formatTurn) }
})
