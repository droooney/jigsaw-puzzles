export interface Dimensions {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Box extends Dimensions, Point {

}
