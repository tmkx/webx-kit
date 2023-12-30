// Copyright 2021 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// https://chromium.googlesource.com/chromium/src/+/main/tools/typescript/definitions/chrome_event.d.ts

interface ChromeEvent<ListenerType> {
  addListener(listener: ListenerType): void;
  removeListener(listener: ListenerType): void;
}
