// Limit raster memory on phones/tablets while preserving CSS zoom dimensions.
export function rasterScale(width, height, deviceRatio = 1) {
  return Math.min(Math.max(deviceRatio, 1), 2, Math.sqrt(4000000 / (Math.ceil(width) * Math.ceil(height))));
}
