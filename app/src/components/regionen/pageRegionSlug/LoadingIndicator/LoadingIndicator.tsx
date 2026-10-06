import { AnimatePresence, motion } from 'motion/react'
import { twJoin } from 'tailwind-merge'
import { useShowMapLoadingIndicator } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { Spinner } from '@/components/shared/Spinner/Spinner'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { mapOverlayControlSizeClassName } from '../mapOverlayChrome.const'

export const LoadingIndicator = () => {
  const showIndicator = useShowMapLoadingIndicator()

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.output
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className="relative block rounded-md bg-teal-700"
          aria-busy="true"
          aria-label="Kartendaten werden geladen"
        >
          <Tooltip
            text="Kartendaten werden geladen…"
            className={twJoin(
              'flex cursor-help items-center justify-center',
              mapOverlayControlSizeClassName,
            )}
          >
            <Spinner color="teal" screenReaderLabel={false} size="5" />
          </Tooltip>
        </motion.output>
      )}
    </AnimatePresence>
  )
}
