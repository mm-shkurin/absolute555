// Галерея: крупный кадр, лента миниатюр, полноэкранный просмотр по щелчку.
//
// Кадр листается прямо здесь — стрелками, жестом и клавишами. До этого сменить его можно
// было только щелчком по миниатюре: на телефоне они мелкие, а стрелок не было вовсе, и
// человек листал галерею, открыв полноэкранный просмотр ради каждого кадра.
import { useState } from 'react'
import { Lightbox } from './Lightbox'
import { GalleryFrame } from './GalleryFrame'
import { GalleryThumbs } from './GalleryThumbs'
import { nextIndex } from '../logic/gallerySwipe'

interface GalleryProps {
  photos: string[]
  total: number
}

export function Gallery({ photos, total }: GalleryProps) {
  const [current, setCurrent] = useState(0)
  const [open, setOpen] = useState(false)
  const step = (by: number) => setCurrent((index) => nextIndex(index, by, photos.length))

  return (
    <div data-testid="gallery">
      <GalleryFrame
        photo={photos[current]}
        caption={`фотография ${current + 1} из ${total}`}
        arrows={photos.length > 1}
        onStep={step}
        onOpen={() => setOpen(true)}
      />
      <GalleryThumbs photos={photos} total={total} current={current} onPick={setCurrent} />
      {open ? (
        <Lightbox
          photos={photos}
          total={total}
          current={current}
          onCurrent={setCurrent}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  )
}
