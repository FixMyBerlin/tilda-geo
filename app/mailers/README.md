# About

## Development

- Use `npm run mailpreview` to preview the template
- Template based on https://demo.react.email/preview/magic-links/aws-verify-email?view=desktop&lang=jsx

## `mailers`

Holds the actions that compose and configure mails.

## `templates`

The React Mail templates used to create the emails in `mailers`.

Docs: https://react.email/docs/getting-started/manual-setup

## Basic setup

Inside [`sendMail()`](./utils/sendMail.tsx) we use [React Mail `render`](https://react.email/docs/utilities/render#render) to create the HTML version of the mails.
