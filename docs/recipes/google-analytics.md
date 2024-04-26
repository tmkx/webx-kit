# Google Analytics

> [Introduction to Google Analytics 4](https://developers.google.com/analytics/devguides/collection/ga4)
>
> [About the Google tag](https://support.google.com/tagmanager/answer/11994839)

::: code-group

```ts [@/analytics.ts]
import 'https://www.googletagmanager.com/gtag/js?id=G-YOURCODE';

window.dataLayer = window.dataLayer || [];

export function gtag() {
  dataLayer.push(arguments);
}

gtag('js', new Date());
gtag('config', 'G-YOURCODE');
```

:::
