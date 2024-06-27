# Tips

## Get extensions' code

> `Default` maybe `Profile 1` / ...

Chrome

::: code-group

```bash [macOS]
$ cd ~/Library/Application\ Support/Google/Chrome/Default/Extensions/
```

:::

Arc

::: code-group

```bash [macOS]
$ cd ~/Library/Application\ Support/Arc/User\ Data/Default/Extensions/
```

:::

## Background auto-idle

> [The extension service worker lifecycle > Idle and shutdown](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle#idle-shutdown)

The background will idle after 30 seconds of inactivity. Opening the DevTools of the background service worker prevents it from going idle. To view the background's console output without disrupting energy-saving, go to `chrome://serviceworker-internals/`.
