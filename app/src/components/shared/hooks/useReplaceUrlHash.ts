import { useNavigate } from '@tanstack/react-router'

/**
 * Sets the URL hash without a history entry and without scrolling — for hashes that follow
 * the scroll position (scroll-spy) or a scroll the page already does itself.
 *
 * Use this instead of `window.history.replaceState` or a plain `navigate({ hash })`: TanStack
 * Router patches `replaceState`, runs a load for every hash change and then scrolls the hash
 * target into view, which pulls the page back while the user scrolls.
 */
export const useReplaceUrlHash = () => {
  // No `from`: `to: '.'` stays on the current location, like `useRegionSearchNavigation`.
  const navigate = useNavigate()

  return (hash: string) => {
    if (window.location.hash === `#${hash}`) return
    void navigate({
      to: '.',
      search: true,
      hash,
      replace: true,
      resetScroll: false,
      hashScrollIntoView: false,
    })
  }
}
