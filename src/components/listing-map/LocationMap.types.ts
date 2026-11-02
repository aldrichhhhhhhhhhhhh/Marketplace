export type MapPoint = { latitude: number; longitude: number };

export type LocationMapProps = {
  point: MapPoint | null;
  onPick: (point: MapPoint) => void;
};
