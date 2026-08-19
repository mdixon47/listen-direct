import { z } from 'zod'
import { assertLoginAllowed, clearLoginFailures, recordLoginFailure } from '../../utils/login-rate-limit'
import { verifyCredentials } from '../../utils/users'

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
})

export default defineEventHandler(async (event) => {
  const credentials = await readValidatedBody(event, credentialsSchema.parse)

  assertLoginAllowed(event, credentials.email)
  const user = verifyCredentials(credentials.email, credentials.password)

  if (!user) {
    recordLoginFailure(event, credentials.email)
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  clearLoginFailures(event, credentials.email)

  await setUserSession(event, {
    user,
    loggedInAt: new Date().toISOString(),
  }, {
    maxAge: user.role === 'demo' ? 60 * 60 * 2 : 60 * 60 * 8,
  })

  return { user }
})
