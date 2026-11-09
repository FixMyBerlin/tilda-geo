import { useIntl } from 'react-intl'
import { renderTranslationHtml } from './renderTranslationHtml'

type Props = {
  id: string
  defaultMessage: string
  /** Fills placeholders like `{value}` in the translation. */
  values?: Record<string, string | undefined>
}

export const InspectorFormattedMessage = ({ id, defaultMessage, values }: Props) => {
  const intl = useIntl()
  const text = intl.formatMessage({ id, defaultMessage }, values)

  return renderTranslationHtml(text)
}
