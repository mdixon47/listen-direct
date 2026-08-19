import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import { requireAppUser } from '../utils/supabase-auth'

const policySchema = z.object({
  shadowTranscripts: z.boolean(),
  consentLogging: z.boolean(),
  acousticSignals: z.boolean(),
  rawAudioRetentionHours: z.number().int().min(0).max(8760),
})

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, policySchema.parse)
  const user = await requireAppUser(event)
  if (user.role === 'demo') throw createError({ statusCode: 403, statusMessage: 'Demo policies are read-only' })

  const client = await serverSupabaseClient(event)
  const { data: current } = await client
    .from('data_policies')
    .select('version')
    .eq('organization_id', user.organizationId)
    .single()

  const { data, error } = await client
    .from('data_policies')
    .update({
      shadow_transcripts: input.shadowTranscripts,
      consent_logging: input.consentLogging,
      acoustic_signals: input.acousticSignals,
      raw_audio_retention_hours: input.rawAudioRetentionHours,
      version: (current?.version ?? 0) + 1,
      updated_by: user.id,
    })
    .eq('organization_id', user.organizationId)
    .select('version, updated_at')
    .single()

  if (error || !data) throw createError({ statusCode: 500, statusMessage: 'Unable to save data policy' })
  return { policy: data }
})
