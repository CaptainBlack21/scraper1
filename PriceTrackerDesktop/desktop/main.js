const { app, BrowserWindow } = require("electron");
const path = require("path");

const isDev = !app.isPackaged || process.env.VITE_DEV_SERVER;
const BACKEND_PORT = process.env.BACKEND_PORT || "3001";

// Prod'da backend'i paket içinden başlat
function startBackendInProd() {
  process.chdir(process.resourcesPath);
  process.env.PORT = BACKEND_PORT;
  process.env.NODE_ENV = "production";
  process.env.ELECTRON_APP = "1";

  try {
    const backendEntry = path.join(process.resourcesPath, "backend-dist", "server.js");
    console.log("Starting backend from:", backendEntry);
    require(backendEntry);
  } catch (e) {
    console.error("Backend start error:", e);
  }
}


function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: { contextIsolation: true, sandbox: true }
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    // Frontend build'ini dosyadan açıyoruz (HashRouter ile uyumlu)
    const indexFile = path.join(process.resourcesPath, "frontend-dist", "index.html");
    win.loadFile(indexFile);
  }
}

app.whenReady().then(() => {
  if (!isDev) startBackendInProd();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
