import React from 'react'

type Props = {
  children: React.ReactNode
}

export const ToolsWrapper = ({ children }: Props) => {
  return (
    <section className="bg-gray-50 p-4">
      <h4 className="mb-3 font-semibold text-gray-900">Hilfsmittel zur Beurteilung der Daten</h4>
      {children}
    </section>
  )
}
