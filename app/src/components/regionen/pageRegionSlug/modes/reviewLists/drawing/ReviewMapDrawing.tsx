import { DrawLayers } from '@osm-editor-kit/react-map-gl-draw'
import { useEffect } from 'react'
import { useReviewComposeType, useReviewDrawActions } from './review-draw-store'
import { ReviewDrawingToolbar } from './ReviewDrawingToolbar'
import { reviewDrawStyles } from './reviewDrawStyles'
import { ReviewEditToolbar } from './ReviewEditToolbar'
import { useReviewDraw } from './useReviewDraw'

/**
 * Map drawing for Prüflisten: compose toolbar (`rl.new`) or geometry-edit (`rl.move`)
 * after the header pencil is toggled. While a real draw session is active (compose,
 * or move with a selected review entry), `useReviewDrawActive` is true and RegionMap
 * hands pointer gestures to the drawing surface / drops interactive layers. A leftover
 * `rl.move` after delete is not a draw session, so map clicks work again.
 */
export const ReviewMapDrawing = () => {
  const { draw, session, sessionKey, editType } = useReviewDraw()
  const composeType = useReviewComposeType()
  const { setComposeType, resetCompose } = useReviewDrawActions()

  useEffect(
    function resetComposeWhenSessionEnds() {
      // An unsaved shape must not show up again in the next compose session.
      return () => resetCompose()
    },
    [session, resetCompose],
  )

  if (session === 'idle') return null

  return (
    <>
      <DrawLayers
        key={sessionKey}
        draw={draw}
        id="review-draw"
        styles={reviewDrawStyles[session]}
      />
      {session === 'compose' ? (
        <ReviewDrawingToolbar
          type={composeType}
          isDrawing={draw.isDrawing}
          onTypeChange={(type) => {
            draw.cancel()
            setComposeType(type)
          }}
          onFinish={draw.finish}
          onCancel={draw.cancel}
        />
      ) : (
        <ReviewEditToolbar
          isDrawing={draw.isDrawing}
          isAddingPart={draw.tool !== 'select'}
          canAddPart={editType !== null && draw.canAdd(editType)}
          canDeletePart={draw.canDeleteSelected}
          onAddPart={() => {
            if (editType) draw.setTool(draw.tool === 'select' ? editType : 'select')
          }}
          onDeletePart={draw.deleteSelected}
          onFinish={draw.finish}
          onCancel={draw.cancel}
        />
      )}
    </>
  )
}
