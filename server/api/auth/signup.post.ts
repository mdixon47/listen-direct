import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import { resolveAppUser } from '../../utils/supabase-auth'

const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(12).max(128),
  fullName: z.string().trim().min(2).max(120),
  organizationName: z.string().trim().min(2).max(120),
})

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, signupSchema.parse)
  const client = await serverSupabaseClient(event)
  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        organization_name: input.organizationName,
      },
    },
  })

  if (error || !data.user) {
    throw createError({ statusCode: 400, statusMessage: error?.message ?? 'Unable to create account' })
  }

  if (!data.session) {
    return { confirmationRequired: true, user: null }
  }

  return { confirmationRequired: false, user: await resolveAppUser(event, data.user.id) }
})
