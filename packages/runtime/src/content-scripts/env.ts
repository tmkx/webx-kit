export function isPageInDark() {
  const { colorScheme, backgroundColor, color } = getComputedStyle(document.body);
  if (colorScheme === 'dark') return true;

  // default backgroundColor:
  // - light: Chrome `rgba(0, 0, 0, 0)`,   Firefox `rgba(0, 0, 0, 0)`,   Safari `rgba(0, 0, 0, 0)`
  // -  dark: Chrome `rgba(0, 0, 0, 0)`,   Firefox `rgba(0, 0, 0, 0)`,   Safari `rgba(0, 0, 0, 0)`
  // default color:
  // - light: Chrome `rgb(0, 0, 0)`,       Firefox `rgb(0, 0, 0)`,       Safari `rgb(0, 0, 0)`
  // -  dark: Chrome `rgb(255, 255, 255)`, Firefox `rgb(251, 251, 254)`, Safari `rgb(255, 255, 255)`
  const rgbaRE = /rgba?\((\d+), (\d+), (\d+)(, ([\d.]+))?/;
  const isValidColor = (match: RegExpMatchArray | null): match is RegExpMatchArray =>
    !!match &&
    (match[5] ? Number(Number(match[1]) + Number(match[2]) + Number(match[3]) + Number(match[5])) !== 0 : true);
  const isLightColor = (match: RegExpMatchArray) =>
    Number(match[1]) + Number(match[2]) + Number(match[3]) > (256 / 2) * 3;

  // is background dark?
  const bgColor = backgroundColor.match(rgbaRE);
  if (isValidColor(bgColor)) return !isLightColor(bgColor);
  // is text light?
  const textColor = color.match(rgbaRE);
  if (isValidColor(textColor)) return isLightColor(textColor);
  // default is in light
  return false;
}
