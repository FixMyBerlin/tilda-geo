import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Markdown,
  Section,
  Tailwind,
} from '@react-email/components'
import { getDomain } from '../utils/getDomain'
import { footerTextMarkdown } from './footerTextMarkdown'
import { signatureTextMarkdown } from './signatureTextMarkdown'

const baseUrl = getDomain()

export type MarkdownMailProps = {
  introMarkdown: string
  outroMarkdown?: string
} & ({ ctaLink: string; ctaText: string } | { ctaLink?: never | null; ctaText?: never | null })

export const MarkdownMail = ({
  introMarkdown = '',
  outroMarkdown,
  ctaLink = null,
  ctaText = null,
}: MarkdownMailProps) => {
  return (
    <Tailwind>
      <Html lang="de" dir="ltr">
        <Head>
          <title>TILDA Geo</title>
        </Head>
        <Body className="m-0 bg-gray-100 sm:p-4">
          <Container className="mx-auto bg-white sm:rounded-lg sm:shadow-md">
            <Section className="mb-4 bg-gray-800 px-4 py-5 text-center sm:rounded-t-lg sm:px-8 dark:bg-gray-800">
              <center>
                <Img
                  src={`${baseUrl}/emails/tilda-logo-mail-white.png`}
                  width="134"
                  height="45"
                  alt="TILDA Geo Logo"
                />
              </center>
            </Section>
            <Section className="px-4 py-2 sm:px-8">
              <Markdown
                markdownCustomStyles={{
                  h1,
                  h2,
                  p: mainText,
                  link,
                  li: list,
                }}
              >
                {introMarkdown}
              </Markdown>

              {ctaLink && ctaText ? (
                <Section className="my-5 flex items-center justify-center text-center">
                  <center>
                    <Button
                      className="block min-w-52 rounded-sm bg-blue-500 px-4 py-3.5 text-center font-sans text-base text-white no-underline"
                      href={ctaLink}
                    >
                      {ctaText}
                    </Button>
                  </center>
                </Section>
              ) : null}

              {outroMarkdown ? (
                <Markdown
                  markdownCustomStyles={{
                    h1,
                    h2,
                    p: mainText,
                    link,
                    li: list,
                  }}
                >
                  {outroMarkdown}
                </Markdown>
              ) : null}
            </Section>
            <Hr />
            <Section className="px-9 pb-6 pt-4">
              <Markdown
                markdownCustomStyles={{
                  h1,
                  p: { ...text, margin: '0px' },
                  link,
                }}
              >
                {signatureTextMarkdown}
              </Markdown>
            </Section>
          </Container>
          <Container className="mx-auto py-6">
            <Markdown
              markdownCustomStyles={{
                p: {
                  ...text,
                  fontSize: '12px',
                  margin: '0',
                  padding: '0 20px',
                  lineHeight: '20px',
                },
                link: {
                  fontSize: '12px',
                  color: '#333',
                },
              }}
            >
              {footerTextMarkdown}
            </Markdown>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  )
}

export default MarkdownMail

const fontFamily =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"

const h1 = {
  color: '#333',
  fontFamily,
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '20px 0',
}

const h2 = { ...h1, marginTop: '25px', fontSize: '17px' }

const link = {
  color: '#2C62A9', // text-blue-500
  fontFamily,
  fontSize: '14px',
  textDecoration: 'underline',
}

const text = {
  color: '#333',
  fontFamily,
  fontSize: '14px',
  margin: '10px 0',
  lineHeight: '24px',
}

const mainText = { ...text, marginBottom: '14px' }

const list = { ...text, margin: '5px 0' }
