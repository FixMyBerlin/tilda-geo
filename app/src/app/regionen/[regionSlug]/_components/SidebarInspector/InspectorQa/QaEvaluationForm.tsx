import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import { buttonStyles } from '@/src/app/_components/links/styles'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { userStatusOptions } from './qaConfigs'

type Props = {
  onSubmit: (userStatus: string, body?: string) => void
  isLoading: boolean
}

export const QaEvaluationForm = ({ onSubmit, isLoading }: Props) => {
  const [selectedStatus, setSelectedStatus] = useState('')
  const [comment, setComment] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedStatus) {
      onSubmit(selectedStatus, comment || undefined)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h4 className="mb-3 font-semibold text-gray-900">Bewertung hinzufügen</h4>

        {/* Radio buttons for status */}
        <div className="space-y-2">
          {userStatusOptions.map((option) => (
            <label
              key={option.value}
              className="group flex cursor-pointer items-start rounded-md border border-gray-300 bg-gray-100 p-3 shadow-sm select-none hover:bg-gray-50"
            >
              <div className="flex h-5 items-center">
                <input
                  type="radio"
                  name="userStatus"
                  value={option.value}
                  checked={selectedStatus === option.value}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
              <div className="ml-2">
                {/* Status pill */}
                <div
                  className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: option.hexColor }}
                >
                  {option.label}
                </div>
                <div>
                  <div className="mt-1 text-xs text-gray-500">{option.description}</div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Comment field */}
      <div>
        <label htmlFor="comment" className="mb-2 block text-sm font-medium text-gray-700">
          Kommentar (Optional, Markdown)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Zusätzliche Anmerkungen..."
          rows={3}
          className="block w-full rounded-md border-0 bg-gray-50 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600 focus:ring-inset sm:py-1.5 sm:text-sm sm:leading-6"
          disabled={isLoading}
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isLoading || !selectedStatus}
          className={twJoin(
            buttonStyles,
            'bg-white px-3 py-1',
            isLoading || !selectedStatus
              ? 'cursor-not-allowed border-gray-300 text-gray-400 shadow-sm hover:bg-white'
              : 'border-gray-400 shadow-md',
          )}
        >
          Speichern
        </button>
        {isLoading && <SmallSpinner />}
      </div>
    </form>
  )
}
