// https://de.wikipedia.org/wiki/Anf%C3%BChrungszeichen

export const Quote = ({ children }: { children: React.ReactNode }) => {
  return <>„{children}“</>
}

export const QuoteSingle = ({ children }: { children: React.ReactNode }) => {
  return <>‚{children}‘</>
}

export const FrenchQuote = ({ children }: { children: React.ReactNode }) => {
  return <>»{children}«</>
}

export const FrenchQuoteSingle = ({ children }: { children: React.ReactNode }) => {
  return <>›{children}‹</>
}

export const quote = (input: string) => `„${input}\u201C`

export const quoteSingle = (input: string) => `\u201A${input}\u2018`

export const frenchQuote = (input: string) => `»${input}«`

export const frenchQuoteSingle = (input: string) => `›${input}‹`
