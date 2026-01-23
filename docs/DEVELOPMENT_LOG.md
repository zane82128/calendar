# Development Log

- 2026-01-21: Added Firebase Auth + Firestore sync and auth gate flow.
- 2026-01-21: Introduced PWA support (manifest, service worker, install button).
- 2026-01-21: Added task list panel and completed-event fade out.
- 2026-01-22: Removed the day-form (kept the day view panel) and hide completed tasks from the task list.
- 2026-01-23: Switched to full-screen panel layout and added bottom tab navigation.
- 2026-01-23: Added Monthly Preview page and preview navigation entry point.
- 2026-01-23: Added event color selection and color-aware rendering.
- 2026-01-23: Added responsive layout adjustments, safe-area handling, and scalable typography.
- 2026-01-23: Removed duplicate calendar header buttons, added schedule navigation, and monthly-to-schedule jump.
- 2026-01-23: Refined monthly grid sizing, added settings version label, and bumped cache version.
- 2026-01-23: Forced Google sign-in to use redirect flow to avoid popup COOP errors.


## TBD
1. 移除calendar panel的sign in/out, preview, today, task list button, 因為跟下方的按鈕重複了 並把移除button後多餘的空間刪除，節省空間
2. 調整monthly preview的layout 每個日期的button要固定大小 

![alt text](docs/examples/examples/Screenshot_20260123_211023_Chrome.jpg)
