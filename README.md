# Calendar Prototype

一個使用原生 HTML/CSS/JavaScript 打造的行事曆原型。提供 Google 登入、雲端同步、可互動的月份視圖，以及日檢視時段行程，適合延伸成完整的代辦或行程工具。

## 功能特色

- **登入門檻（Auth Gate）**：開啟網頁先進入 Sign in 頁面，使用 Google 登入後才會進入行事曆主畫面。
- **Calendar Panel（月曆面板）**：顯示 6x7 的月份格與 Sun~Sat 標題，可使用上一月 / 下一月 / Today 按鈕切換。點任何日期會自動選取，並展開右側面板。
- **Quick Entry Form（快速輸入表單）**：位在 Calendar Panel 底部，使用日期選擇器與開始/結束時間選單，快速對任意日期建立行程並瞬間切換至對應日期。
- **Day View Panel（日檢視面板）**：顯示被選日期、星期文字、Day Form 與 24 小時時段清單。只有在點選日期後才會出現。
- **Day Form（日檢視表單）**：於 Day View 內用選單挑開始/結束時間並輸入標題，針對目前選定日期快速建立行程。
- **Task List Panel（行程清單面板）**：由「Task List」按鈕開啟的面板，列出所有行程的日期＋標題摘要，與行程狀態同步。
- **行程渲染**：採 30 分鐘解析度定位、僅顯示整點標籤；事件可重疊堆疊，短行程在上方，完成後淡出消失。
- **跨月選取**：即使在月曆中點擊前後月的灰色日期，也會自動切換月份並顯示該日期的行程。
- **淺/深色外觀**：基於 `prefers-color-scheme` 自動切換，維持視覺一致的卡片式 UI。

## 專案結構

```
index.html   # 主要頁面與面板結構
styles.css   # 介面排版、顏色與互動樣式
main.js      # 月曆生成、選取狀態、行程解析/渲染邏輯
```

## 元件 / 名詞定義

| 名稱 | 說明 |
| --- | --- |
| **Auth Gate** | 登入入口畫面 (`auth-gate`)，未登入時只顯示 Sign in 卡片。 |
| **Calendar Panel** | 左側月曆面板，包括標題、月份導航、Sun~Sat 標頭與 6x7 日期按鈕。登入後才會顯示。 |
| **Quick Entry Form** | Calendar Panel 底部的表單 (`calendar-form`)，使用日期欄位與開始/結束時間選單，適合跨日新增行程。 |
| **Day View Panel** | 右側日檢視面板，顯示「Selected date」、Day Form 與 24 小時時段清單。選取日期後才會顯示。 |
| **Day Form** | Day View Panel 內的表單 (`day-form`)，以選單選取開始/結束時間並輸入標題，快速新增當天行程。 |
| **Task List Panel** | 由「Task List」按鈕開啟的面板 (`task-panel`)，列出所有行程的日期＋標題摘要。 |
| **Hour Blocks** | Day View Panel 中每小時的容器（`day-view__hour`），包含時間標籤與行程色塊。 |
| **Event Block** | 顯示在 Hour Blocks 內的行程色塊（`day-view__event`），會標註開始/結束時間與標題，支援重疊堆疊與完成勾選。 |

## 開發 / 部署

1. 安裝相依：本專案純靜態頁面，不需額外套件。
2. 本地預覽：
   ```bash
   cd /path/to/calendar
   python -m http.server 5173
   # 或 `npx serve`
   ```
   之後瀏覽 `http://localhost:5173`。
3. 部署：
   - Firebase Hosting：`firebase deploy` 後可透過 `https://calendar-c745b.web.app` 使用。
   - GitHub Pages（可選）：啟用 Pages（Source 選 main / root）即可透過 `https://<username>.github.io/calendar/` 取用。

## Firebase 整合

- 登入：Google Sign-in（Firebase Authentication）。
- 資料：Cloud Firestore（以 `events` 集合儲存，每筆包含 `userId/dateKey/startMinutes/endMinutes/label/completed`）。
- 權限：需在 Authentication 啟用 Google，並將 `calendar-c745b.web.app` 加入 Authorized domains。

## 待辦想法

- 將事件儲存在 `localStorage` 或後端 API，避免重新整理遺失。
- 新增事件編輯 / 刪除功能。
- 讓 Calendar Panel 也能標示每日期的行程概況（顏色或徽章）。
- 整合真正的 AI 服務以解析更多自然語句或支援語音輸入。

歡迎 fork/issue/PR，一起把這個 Prototype 打造成完整的行事曆！
