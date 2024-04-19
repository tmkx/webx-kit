# Introduction

## Why

WebX Kit is built upon [webpack](https://webpack.js.org/)/[rspack](https://www.rspack.dev/), and the projects I maintain are primarily webpack-based. It's natural to reuse the existing codebase.

::: info

If you enjoy using [Vite](https://vitejs.dev/), consider exploring [WXT](https://wxt.dev/).

If you prefer [Parcel](https://parceljs.org/), explore [Plasmo](https://docs.plasmo.com/).

:::

## Comparison

There are several key differences I want to emphasize:

- WebX Kit supports HMR for content scripts, but this feature is not supported by WXT or Plasmo. This can impact efficiency when developing an injected user interface.
- WebX Kit has a first-class support for Chrome MV3 only (I have limited energy). If your product requires MV2 or Firefox compatibility, you may need to consider alternative solutions.
- WebX Kit is still under development. Please report any issues you encounter.

https://wxt.dev/guide/compare.html
