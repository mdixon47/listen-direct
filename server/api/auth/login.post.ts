import { z } from 'zod'
import { verifyCredentials } from '../../utils/users'

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
})

export default defineEventHandler(async (event) => {
  const credentials = await readValidatedBody(event, credentialsSchema.parse)
  const user = verifyCredentials(credentials.email, credentials.password)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  await setUserSession(event, {
    user,
    loggedInAt: new Date().toISOString(),
  }, {
    maxAge: user.role === 'demo' ? 60 * 60 * 2 : 60 * 60 * 8,
  })

  return { user }
})
