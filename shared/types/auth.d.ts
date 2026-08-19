declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    role: 'demo' | 'user' | 'admin'
    workspace: string
  }

  interface UserSession {
    loggedInAt: string
  }
}

export {}
