export function isSelectionValid(selection?: Selection | null): selection is Selection {
  return !!selection && !selection.isCollapsed;
}
