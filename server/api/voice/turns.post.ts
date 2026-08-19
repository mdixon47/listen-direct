import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import { requireAppUser } from '../../utils/supabase-auth'

const turnSchema = z.object({
  durationMs: z.number().int().min(0).max(3_600_000),
  route: z.enum(['direct', 'fallback']),
  model: z.string().trim().min(1).max(120),
  latencyMs: z.number().int().min(0).max(600_000),
  signal: z.string().trim().min(1).max(120),
  status: z.enum(['complete', 'flagged', 'failed']).default('complete'),
  transcript: z.string().max(20_000).nullable(),
  acousticSignals: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
})

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, turnSchema.parse)
  const user = await requireAppUser(event)
  if (user.role === 'demo') throw createError({ statusCode: 403, statusMessage: 'Demo turns are session-only' })

  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('voice_turns')
    .insert({
      organization_id: user.organizationId,
      user_id: user.id,
      duration_ms: input.durationMs,
      route: input.route,
      model: input.model,
      latency_ms: input.latencyMs,
      signal: input.signal,
      status: input.status,
      transcript: input.transcript,
      acoustic_signals: input.acousticSignals,
    })
    .select('id, started_at, duration_ms, route, model, latency_ms, signal, status, transcript')
    .single()

  if (error || !data) throw createError({ statusCode: 500, statusMessage: 'Unable to save voice turn' })

  return {
    turn: {
      id: `turn_${data.id.slice(0, 8)}`,
      time: new Date(data.started_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      duration: `${(data.duration_ms / 1000).toFixed(1)}s`,
      route: data.route === 'fallback' ? 'Fallback' : 'Direct',
      model: data.model,
      latency: `${data.latency_ms}ms`,
      signal: data.signal,
      status: data.status === 'flagged' || data.status === 'failed' ? 'Flagged' : 'Complete',
      transcript: data.transcript ?? 'Transcript disabled for this turn.',
    },
  }
})
