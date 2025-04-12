declare module 'svg-path-bounds' {
  /**
   * Get the bounds of an SVG path
   * @param path - The SVG path string
   * @returns An array representing [minX, minY, maxX, maxY]
   */
  export function getPathBounds(path: string): [number, number, number, number];
  export default getPathBounds;
}