# Project FAQ

## PWA
Q: PWA 是什麼？  
A: PWA (Progressive Web App) 是可安裝的網頁應用，能加入主畫面、離線快取，並透過 Service Worker 更新資源。

Q: 使用者安裝 PWA 後更新網站，還要重新下載嗎？  
A: 不用，但 PWA 會受到快取影響，需要重新整理或等待 Service Worker 更新。

Q: 為什麼遠端裝置還看到舊版？  
A: 通常是 PWA/瀏覽器快取。可清除站點資料、取消 Service Worker、重新安裝。

Q: 可以放「Install App」按鈕嗎？  
A: 可以，透過 `beforeinstallprompt` 事件提示安裝。

## TWA / Play Store
Q: 為什麼要用 TWA？  
A: TWA 讓 PWA 打包成 Android App 上架 Play Store，使用網頁同一套 UI。

Q: APK / AAB 是什麼？  
A: APK 是傳統安裝包，AAB 是 Google Play 建議的「App Bundle」格式。

Q: 上架 Play Store 要上傳什麼？  
A: 上傳 `app-release-bundle.aab`（建議放在 `android/artifacts/` 內）。

Q: GitHub 更新後 Play Store 會自動更新嗎？  
A: 不會。若要更新 Play Store，需要重新產生新版本 AAB 再上傳。

## Firebase Hosting
Q: GitHub Actions 會部署到 Firebase 嗎？  
A: 會。workflow 用 `FirebaseExtended/action-hosting-deploy`，並指定 `projectId`。

Q: 為什麼要有 `public/` 資料夾？  
A: `firebase.json` 的 `hosting.public` 設定為 `public`，所以部署只看 `public/`。

Q: 為什麼本地更新了，線上還是舊版？  
A: 很可能是 `public/` 沒同步。要把 `src/` 與 `hosting/` 內的檔案複製到 `public/` 再部署。

## Firebase Auth / Firestore
Q: Event 會存到雲端嗎？  
A: 有登入時會寫入 Firestore，並用 `onSnapshot` 即時同步。

Q: 完成 (completed) 後資料會被刪掉嗎？  
A: 可以設定。現在邏輯是「勾選完成就刪除 Firestore 文件」。

Q: 為什麼無法新增 event？  
A: 常見原因是沒登入或 Firestore rules 權限不足。

## Service Worker / Cache
Q: Service Worker 是什麼？  
A: 在背景負責快取、離線支援、資源更新的腳本。

Q: 如何強制遠端更新？  
A: 清除站點資料、取消 Service Worker、重新整理或重裝 PWA。
