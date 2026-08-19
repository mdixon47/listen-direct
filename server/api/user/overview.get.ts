export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  return {
    workspace: session.user.workspace,
    role: session.user.role,
    metrics: {
      directRouteRate: 94.7,
      medianLatencyMs: 482,
      turnSuccessRate: 99.2,
    },
  }
})
