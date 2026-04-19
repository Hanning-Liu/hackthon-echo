import React, { type CSSProperties } from 'react';
import type { TarotCard } from '../lib/tarotData';
import { getCardImageUrl } from '../lib/tarotData';

/** Renders `public/tarot cards/{basename}.jpg` from card id; upright = normal, reversed = 180° artwork. */
export default function TarotCardArtImage({
  card,
  isReversed,
  className,
  style,
}: {
  card: TarotCard;
  isReversed: boolean;
  className: string;
  style?: CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      <div className={`h-full w-full overflow-hidden rounded-[5px] ${isReversed ? 'rotate-180' : ''}`}>
        <img
          src={getCardImageUrl(card.id)}
          alt={card.name}
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
          draggable={false}
        />
      </div>
    </div>
  );
}
