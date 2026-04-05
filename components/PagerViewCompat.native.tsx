import PagerView from 'react-native-pager-view';

// Re-export PagerView for native, plus a compatible handle type
export type PagerViewHandle = { setPage: (index: number) => void };
export default PagerView;
