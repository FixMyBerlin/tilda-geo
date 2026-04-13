import { newUserRegistrationMailer } from 'mailers/newUserRegistrationMailer'

type UserForEmail = {
  id: string
  osmId: number
  osmName: string | null
  osmDescription: string | null
  email: string
  createdAt: Date
}

export async function sendNewUserRegistration(user: UserForEmail) {
  await newUserRegistrationMailer({ user }).send()
}
