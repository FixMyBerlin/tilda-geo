import { useIntl } from 'react-intl'
import { renderTranslationHtml } from './renderTranslationHtml'

type Props = {
  id: string
  defaultMessage: string
}

export const InspectorFormattedMessage = ({ id, defaultMessage }: Props) => {
  const intl = useIntl()
  const text = intl.formatMessage({ id, defaultMessage })

  return renderTranslationHtml(text)
}
