# How to integrate Electron + React (Vite) + Mongodb

Untuk mengintegrasikan electron dengan react, dapat mengikuti intruksi yang disediakan pada dokumentasi electron js [https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app].
Tapi terdapat beberapah hal yang harus dirubah jika menggunakan Vite dikarenakan electron js menggunakan common js module, dan vite sudah tidak mendukung common js module seperti yang tertulis di artikel berikut [https://vitejs.dev/guide/troubleshooting]

Ubah semua import pada electron js menggunakan cara ES module seperti berikut:
'''
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import 'dotenv/config'
import { fileURLToPath } from 'url';
import axios from 'axios';
'''
