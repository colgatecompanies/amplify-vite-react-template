import { useMemo } from 'react';

const BACKGROUND_IMAGES = [
  '/images/home/background.jpg',
  '/images/cga/20201024_111856 (1).jpg',
  '/images/cga/20240908_195042 (1).jpg',
  '/images/cga/20240908_195117.jpg',
  '/images/cga/20240908_195157.jpg',
  '/images/cga/20250622_184020.jpg',
  '/images/cga/20251222_171137.jpg',
  '/images/cmc/20201024_111856 (2).jpg',
  '/images/cmc/IMG_20180708_181020759_HDR.jpg',
  '/images/cmc/ND_soybeans_MG_8352.jpg',
  '/images/cmc/ND_soybeans_MG_8652.jpg',
];

export function useRandomBackground(): React.CSSProperties {
  const style = useMemo(() => ({
    backgroundImage: `url('${BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)]}')`,
  }), []);

  return style;
}
