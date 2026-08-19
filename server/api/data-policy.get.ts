import { serverSupabaseClient } from '#supabase/server'
import { requireAppUser } from '../utils/supabase-auth'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('data_policies')
    .select('shadow_transcripts, consent_logging, acoustic_signals, raw_audio_retention_hours, version, updated_at')
    .eq('organization_id', user.organizationId)
    .single()

  if (error || !data) throw createError({ statusCode: 500, statusMessage: 'Unable to load data policy' })
  return { policy: data }
})
