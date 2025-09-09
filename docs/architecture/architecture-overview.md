# 全端技術架構文件: PCM (專業營建管理) - 總覽

## 1. 簡介 (Introduction)

本文件旨在闡述「PCM 專業營建管理」專案的完整全端技術架構，內容涵蓋後端系統、前端實作及其整合方式。它將作為 AI 開發代理與工程師團隊的唯一技術真相來源 (Single Source of Truth)，確保整個技術堆疊的一致性。

### 啟動範本或既有專案 (Starter Template or Existing Project)
根據先前已確認的技術選型（Next.js 與 shadcn/ui），本架構文件將假設專案是透過標準的 `create-next-app` 指令進行初始化，並在此基礎上整合 shadcn/ui。這為我們提供了業界標準的專案結構與開發工具鏈。

### 變更日誌 (Change Log)
| 日期 | 版本 | 描述 | 作者 |
| :--- | :--- | :--- | :--- |
| 2025-09-08 | 1.0 | 初始架構文件建立 | Winston (Architect) |

## 2. 高層次架構 (High-Level Architecture)

### 技術摘要 (Technical Summary)
PCM 系統將被建構成一個全端、無伺服器 (Serverless) 的網頁應用程式，並基於 Next.js 框架開發。前端將採用 React 與 shadcn/ui 元件庫打造，而後端邏輯則透過 Next.js API Routes 實現。整個應用程式將會被容器化為一個 Docker 映像檔，部署於客戶的地端虛擬化環境中，並使用 Oracle 資料庫作為其主要的數據儲存層。此架構採用 Monorepo 模式進行程式碼管理，以利於前後端之間的型別共享與協同開發。

### 平台與基礎設施 (Platform and Infrastructure)
* **部署平台**: 地端虛擬化主機 (On-Premise Virtualization)
* **容器化技術**: Docker
* **資料庫**: Oracle

### 程式碼庫結構 (Repository Structure)
* **結構**: Monorepo
* **管理工具**: 採用 `npm workspaces` 或類似工具來管理單一儲存庫中的多個套件。

### 高層次架構圖 (High-Level Architecture Diagram)
使用者透過瀏覽器與部署在 Docker 中的 PCM 應用程式互動。此應用程式包含前端與後端，並會連接至 Oracle 資料庫、檔案儲存體，以及外部的刷卡機 API。

### 架構模式 (Architectural and Design Patterns)
* **無伺服器架構 (Serverless Architecture)**: 利用 Next.js API Routes 作為後端。
* **元件化 UI (Component-Based UI)**: 透過可重複使用的 React 元件來建構介面。
* **倉儲模式 (Repository Pattern)**: 在後端，分離業務邏輯與資料存取邏輯。

## 3. 技術堆疊 (Tech Stack)
| 類別 | 技術 | 版本 | 用途與理由 |
| :--- | :--- | :--- | :--- |
| **前端框架** | Next.js | `14.x` | 核心的全端應用程式框架。 |
| **UI 元件庫** | shadcn/ui | `Latest` | 提供高品質、可客製化的 UI 元件基礎。 |
| **前後端語言** | TypeScript | `5.x` | 提供靜態型別檢查，提升程式碼的健壯性。 |
| **狀態管理** | React Context / Zustand | `18.x` / `4.x` | 分別處理簡單與複雜的客戶端狀態。 |
| **資料庫** | Oracle | `待確認版本` | 核心資料儲存。 |
| **認證與授權** | NextAuth.js (Auth.js) | `5.x` | Next.js 生態系中最主流的認證函式庫。 |
| **測試** | Jest / React Testing Library / Playwright | `Latest` | 分別用於單元、元件與端對端測試。 |
| **部署** | Docker / Docker Compose | `Latest` | 用於建立容器化的開發與生產環境。 |
| **CI/CD** | Jenkins | `Latest LTS` | 業界最通用的開源 CI/CD 工具。 |
| **日誌與監控**| Netdata | `Latest` | 輕量、簡單的 All-in-One 監控方案。 |