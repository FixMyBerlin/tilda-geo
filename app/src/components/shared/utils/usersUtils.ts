export const isAdmin = (user: { role: string } | null | undefined) => {
  if (!user) return false
  return user.role === 'ADMIN'
}
