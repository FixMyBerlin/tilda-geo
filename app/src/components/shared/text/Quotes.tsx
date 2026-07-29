// https://de.wikipedia.org/wiki/Anf%C3%BChrungszeichen

export const Quote = ({ children }: { children: React.ReactNode }) => {
  return <>„{children}“</>
}

export const quote = (input: string) => `„${input}\u201C`

export const frenchQuote = (input: string) => `»${input}«`
