export function getBackgroundWithOpacity(color: string | undefined, alpha: number = 0.2): string | undefined {
  if (!color) return undefined;
  if (color.startsWith('rgba(') || color.startsWith('rgb(')) return color;
  let r = 0;
  let g = 0;
  let b = 0;
  const hex = color.replace('#', '');
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    return color;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}