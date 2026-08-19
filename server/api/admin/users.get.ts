import { serverSupabaseClient } from '#supabase/server'
import { requireAppUser } from '../../utils/supabase-auth'

export default defineEventHandler(async (event) => {
  const user = await requireAppUser(event)

  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Administrator access required' })
  }

  const client = await serverSupabaseClient(event)
  const { data: memberships, error: membershipError } = await client
    .from('organization_members')
    .select('user_id, role, created_at')
    .eq('organization_id', user.organizationId)
    .order('created_at')

  if (membershipError) throw createError({ statusCode: 500, statusMessage: 'Unable to load members' })

  const memberIds = memberships.map(membership => membership.user_id)
  const { data: profiles, error: profileError } = memberIds.length
    ? await client.from('profiles').select('id, display_name, email').in('id', memberIds)
    : { data: [], error: null }

  if (profileError) throw createError({ statusCode: 500, statusMessage: 'Unable to load profiles' })
  const profilesById = new Map(profiles.map(profile => [profile.id, profile]))

  return {
    users: memberships.map((membership) => {
      const profile = profilesById.get(membership.user_id)
      return {
        id: membership.user_id,
        name: profile?.display_name ?? 'Workspace member',
        email: profile?.email ?? 'Unavailable',
        role: membership.role,
        workspace: user.workspace,
      }
    }),
    generatedAt: new Date().toISOString(),
  }
})
