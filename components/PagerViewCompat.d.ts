import React from 'react';

export interface PagerViewHandle {
  setPage: (index: number) => void;
}

interface PagerViewProps {
  style?: object;
  initialPage?: number;
  onPageSelected?: (e: { nativeEvent: { position: number } }) => void;
  children: React.ReactNode;
  overdrag?: boolean;
}

declare const PagerViewCompat: React.ForwardRefExoticComponent<
  PagerViewProps & React.RefAttributes<PagerViewHandle>
>;
export default PagerViewCompat;
