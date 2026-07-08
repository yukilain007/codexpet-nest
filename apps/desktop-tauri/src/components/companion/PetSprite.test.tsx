import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PetSprite } from './PetSprite';

describe('PetSprite', () => {
  it('uses pixel-stable atlas coordinates when rendered below native size', () => {
    render(
      <PetSprite
        state="idle"
        frame={5}
        spritesheetUrl="/pets/xia-yizhou/spritesheet.webp"
        scale={0.86}
      />,
    );

    expect(screen.getByTestId('local-companion-pet')).toHaveStyle({
      width: '168px',
      height: '182px',
    });
    expect(screen.getByTestId('local-companion-sprite-frame')).toHaveStyle({
      width: '192px',
      height: '208px',
      backgroundSize: '1536px auto',
      backgroundPosition: '-960px 0px',
      transform: 'translateX(-50%) scale(0.875)',
    });
  });
});
