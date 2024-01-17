export function isPageInDark() {
  const { colorScheme, backgroundColor } = getComputedStyle(document.body);
  if (colorScheme === 'dark') return true;
  const bgColor = backgroundColor.match(/rgba?\((\d+), (\d+), (\d+)(, ([\d.]+))?/);
  if (bgColor) {
    // has opacity and is blow 0.1
    if (bgColor[5] && Number(bgColor[5]) < 0.1) return false;
    return Number(bgColor[1]) + Number(bgColor[2]) + Number(bgColor[3]) < (256 / 2) * 3;
  }
  return false;
}
