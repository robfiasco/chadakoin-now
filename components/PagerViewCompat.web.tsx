/**
 * Web stub for react-native-pager-view.
 * Shows one child at a time; setPage() switches pages instantly.
 * Swipe gestures are not supported on web — tab buttons handle navigation.
 */
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View } from 'react-native';

interface PagerViewProps {
  style?: object;
  initialPage?: number;
  onPageSelected?: (e: { nativeEvent: { position: number } }) => void;
  children: React.ReactNode;
  overdrag?: boolean;
}

export interface PagerViewHandle {
  setPage: (index: number) => void;
}

const PagerViewCompat = forwardRef<PagerViewHandle, PagerViewProps>(
  ({ style, initialPage = 0, onPageSelected, children }, ref) => {
    const [activePage, setActivePage] = useState(initialPage);
    const pages = React.Children.toArray(children);

    useImperativeHandle(ref, () => ({
      setPage(index: number) {
        setActivePage(index);
        onPageSelected?.({ nativeEvent: { position: index } });
      },
    }));

    return (
      <View style={style}>
        {pages.map((child, i) => (
          <View key={i} style={{ flex: 1, display: i === activePage ? 'flex' : 'none' }}>
            {child}
          </View>
        ))}
      </View>
    );
  }
);

export default PagerViewCompat;
