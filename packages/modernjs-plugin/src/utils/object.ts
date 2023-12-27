function collectPaths(paths: string[] = []) {
  return new Proxy(
    {},
    {
      get(_target, p): any {
        paths.push(p as string);
        return collectPaths(paths);
      },
    }
  );
}

export function set<T extends object, U>(obj: T, selector: (obj: T) => U, value: U) {
  const paths: string[] = [];
  selector(collectPaths(paths) as T);

  const finalProperty = paths.pop();
  if (!finalProperty) return;

  const finalObject = paths.reduce((acc, path) => ((acc as any)[path] ||= {}), obj);

  Object.defineProperty(finalObject, finalProperty, { value, writable: true });
}
