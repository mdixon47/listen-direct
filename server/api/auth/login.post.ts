import { z } from 'zod'
import { serverSupabaseClient } from '#supabase/server'
import { assertLoginAllowed, clearLoginFailures, recordLoginFailure } from '../../utils/login-rate-limit'
import { resolveAppUser } from '../../utils/supabase-auth'

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
})

export default defineEventHandler(async (event) => {
  const credentials = await readValidatedBody(event, credentialsSchema.parse)

  assertLoginAllowed(event, credentials.email)
  const client = await serverSupabaseClient(event)
  const { data, error } = await client.auth.signInWithPassword(credentials)

  if (error || !data.user) {
    recordLoginFailure(event, credentials.email)
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  clearLoginFailures(event, credentials.email)
  const user = await resolveAppUser(event, data.user.id)

  return { user }
})
