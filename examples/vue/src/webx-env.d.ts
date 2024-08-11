/// <reference types="@rsbuild/core/types" />

declare module '*.svg';

declare module '*.vue' {
  const component: any;
  export default component;
}
