import { requireAppUser } from '../../utils/supabase-auth'

export default defineEventHandler(async event => ({ user: await requireAppUser(event) }))
