# How to integrate Electron + React (Vite) + Mongodb

Untuk mengintegrasikan electron dengan react, dapat mengikuti intruksi yang disediakan pada dokumentasi electron js [https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app].
Tapi terdapat beberapah hal yang harus dirubah jika menggunakan Vite dikarenakan electron js menggunakan common js module, dan vite sudah tidak mendukung common js module seperti yang tertulis di artikel berikut [https://vitejs.dev/guide/troubleshooting]

Ubah semua import pada electron js menggunakan cara ES module seperti berikut:
```
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

import 'dotenv/config'
import axios from 'axios';

// Buat sebuah variabel window global
let window = null;

// Ambil lokasi working direktori dari elektron
// karena ES modul tidak memiliki library path untuk menggunakan __dirname ini untuk mengakalinya
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Instance axios digunakan untuk berkomunikasi dengan backend (mongodb)
const instance = axios.create({
  baseURL: "http://localhost:5555/api/products",
});

function createWindow() {
  // url untuk membuka react yang akan diambil dari .env
  const startUrl = process.env.ELECTRON_START_URL
  // Create the browser window.
  window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      // lokasi preload.js yang berfungsi untuk mengekspos API electron untuk berkomunikasi dengan react
      preload: path.join(__dirname, 'preload.mjs')
    },
  });

  // Perintah berikut adalah perintah untuk memungkinkan electron membuka react app dengan menargetkan addres yang digunakan oleh vite
  window.loadURL(startUrl)
  window.show()
  window.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  createWindow()
  

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (import.meta.platform !== 'darwin') {
    app.quit()
  }
})

```

Selanjutnya tinggal membuat beberapa file:
1. file prealod.js
2. file .env di luar untuk digunakan menyimpan base url react/vite
3. Membuat script backend dengan node.js

Struktur folder yang dibuat menjadi seperti berikut:
```
/electron
  main.js
  preload.js
/mongodb
  indes.js
/src
  // berisikan kodingan react
.env
```

