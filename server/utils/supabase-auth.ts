import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'

export type AppRole = 'demo' | 'user' | 'admin'

export type AppUser = {
  id: string
  name: string
  email: string
  role: AppRole
  workspace: string
  organizationId: string
}

export async function resolveAppUser(event: H3Event, authUserId: string): Promise<AppUser> {
  const client = await serverSupabaseClient(event)
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, email, display_name, default_organization_id')
    .eq('id', authUserId)
    .single()

  if (profileError) {
    console.error('Unable to resolve Supabase profile', { code: profileError.code, message: profileError.message })
    throw createError({ statusCode: 500, statusMessage: 'Unable to load user profile' })
  }

  if (!profile?.default_organization_id) {
    throw createError({ statusCode: 403, statusMessage: 'User profile is not ready' })
  }

  const [{ data: membership, error: membershipError }, { data: organization, error: organizationError }] = await Promise.all([
    client
      .from('organization_members')
      .select('role')
      .eq('organization_id', profile.default_organization_id)
      .eq('user_id', authUserId)
      .single(),
    client
      .from('organizations')
      .select('id, name')
      .eq('id', profile.default_organization_id)
      .single(),
  ])

  if (membershipError || organizationError) {
    console.error('Unable to resolve Supabase workspace', {
      membershipCode: membershipError?.code,
      organizationCode: organizationError?.code,
    })
    throw createError({ statusCode: 500, statusMessage: 'Unable to load workspace membership' })
  }

  if (!membership || !organization) {
    throw createError({ statusCode: 403, statusMessage: 'Workspace membership is not available' })
  }

  return {
    id: authUserId,
    name: profile.display_name,
    email: profile.email,
    role: membership.role,
    workspace: organization.name,
    organizationId: organization.id,
  }
}

export async function requireAppUser(event: H3Event): Promise<AppUser> {
  const authUser = await serverSupabaseUser(event)
  if (!authUser?.sub) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  return resolveAppUser(event, authUser.sub)
}
