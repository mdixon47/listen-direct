import { listUsers } from '../../utils/users'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Administrator access required' })
  }

  return {
    users: listUsers(),
    generatedAt: new Date().toISOString(),
  }
})
