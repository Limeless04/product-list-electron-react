# How to integrate Electron + React (Vite) + Mongodb

Untuk mengintegrasikan electron dengan react, dapat mengikuti intruksi yang disediakan pada dokumentasi [electron js](https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app).
Tapi terdapat beberapah hal yang harus dirubah jika menggunakan Vite dikarenakan electron js menggunakan common js module, dan vite sudah tidak mendukung common js module seperti yang tertulis di artikel berikut [Troubleshooting Vite CJS](https://vitejs.dev/guide/troubleshooting)

Tapi sebelum masuk ke kodingan ada beberapa library yang akan ditambahkan diantaranya:
1. axios untuk mengakses backend
2. dotenv untuk mengakses environment variabel

Ubah semua import pada electron js menggunakan cara ES module seperti berikut:
```
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import 'dotenv/config'
import { fileURLToPath } from 'url';
import axios from 'axios';

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
  // Akan berisi fungsi untuk menghandle interaksi react - electron

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

Kemudian untuk dapat menjalankan electron.js
pada .env tambahkan perintah berikut
```
// endpoint yang akan diakses oleh electron untuk membuka react
ELECTRON_START_URL=http://localhost:5173
```

Setelah menambahkan variabel env start url, kemudian tinggal mengubah package.json agar electron js dapat berjalan semestinyua
```
{
  "name": "react-test",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  // tambahkan perintah dibawah ini untuk menunjuk kearah script utama electron.js
  "main": "electron/main.js",
   ...
```
Kemudian pada bagian ```scripts``` pada package.json tambahkan
```
...
  "scripts": {
    // untuk menjalankan server backend
    "start:mongodb": "nodemon mongodb/index.js",
    // untuk menjalankan electron app
    "start:electron": "electron .",
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
..
```


# Communication between React + Electron

Electron memiliki fiture bernama IPC yang memungkingkan berkomunikasi antara frontend (react) dan backend (mongodb), dimana electron akan berperan menjadi jembatan antara react dan mongodb. Dapat dibaca pada link berikut [Inter Process Communication](https://www.electronjs.org/docs/latest/tutorial/ipc)

Pertama pada preload.js yang telah dibuat tambahkan perintah berikut, yang akan berperan sebagai API yang dapat diakses melalui instance dari object window oleh react
```
import { contextBridge, ipcRenderer } from 'electron';
// contextBridge akan menjadi penghubungung antara react dan electron
// dimana react dapat mengakses fungsi yang dideklarasikan pada contextBridge
// 'myAPI' adalah nama dari API contextBridge ini
contextBridge.exposeInMainWorld('myAPI', {
    // method yang dideklarasikan disini akan terekspos dan dapat diakses oleh react dan electron.js
    getById: (id) => ipcRenderer.invoke('get-by-id', id),
    submitData: (data) => ipcRenderer.invoke('submit-data', data),
    getAllProduct: () => ipcRenderer.invoke('get-all-product'),
    deleteProduct: (id) => ipcRenderer.invoke("delete-product", id)

});
```
Untuk memahami lebih lanjut tentang preload.js dapat membacanya disini [Using Prelaod.js](https://www.electronjs.org/docs/latest/tutorial/tutorial-preload)

Setelah mendeklarasikan method pada preload.js, method tadi dapat diakses melalui react seperti berikut
```
const fetchingProducts = async () => {
    try {
      // window adalah browser object modal
      // myAPI adalah nama dari api yang dibuat pada preload.js
      // getAllproduct adalah nama method yang dapat dipanggil pada react
      let data = await window.myAPI.getAllProduct();
      setProduct(data);
    } catch (err) {
      console.error("Error Fetching Data ", err);
      alert(`${err}`);
    }
  };
```
Kemudian pada electron.js, pada bagian
```
app.whenReady().then(() => {
  createWindow()
  // ketika react mengeksekusi myAPI getAllProduct,
  // fungsi dibawah inilah yang akan menghandle perintah tersebut  
  ipcMain.handle('get-all-product', handleGetData)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})
```

Ada 2 cara komunikasi dapat terjalin antara electron.js dan react dapat berlangsung:
1. One Way
   dengan menggunakan ipcMain.on() dan ipcRender.send(). cara ini merupakan cara sinkronus
3. Two Way
   dengan menggunakan ipMain.handle() dan ipcRender.invoke(). sedangkan ini asinkron

Note: Untuk preload.js, jika menggunakan vite dan tidak dapat mengakses api dari preload.js (error not defined), ubahlah ekstensi preload.js menjadi preload.mjs. hal ini disebabkan oleh package.json bawaan vite yang hanya menerima Es Module saja.
Note: Perlu diingat bahwa api pada preload hanya dapat diakses melalui electron app, api tersebut tidak dapat diakses melalui browser

# Bridging the Gap
Agar aplikasi berjalan dengan baik, Electron yang akan melakukan komunikasi dengan backend dan kemudian electron akan mengirim data hasil fetching menuju react untuk di render.
Misal terdapat sebuah endpoint berikut, pada mongodb script:
```
app.get('/api/products', async (req, res) => {
  const database = client.db('react-product');
  const collection = database.collection('products');

  try {
    const result = await collection.find({}).toArray();
    res.json(result);
  } catch (error) {
    console.error('Error reading data from MongoDB', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
```
Pada main.js electron dapat membuat sebuah fungsi untuk melakukan fetching data dengan axios seperti berikut:
```
async function getData() {
  try {
    const res = await instance.get()
    const result = res.data
   
    return result;
  }catch(err){
    console.error('Error making API request:', err);
    throw err;
  }
}
```
Kemduian buat sebuah fungsi untuk menghandle fetching data
```
async function handleGetData() {
  try {
    const result = await getData()
    return result
  } catch (err) {
    console.error('Error making API request:', err);
    // Optionally send an error message back to the renderer process
    throw err
  }
}
```
Kemudian pada saat app ready handle proses handleGetData seperti berikut:
```
app.whenReady().then(() => {
  createWindow()
  ipcMain.handle('get-all-product', handleGetData)
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})
```
Sebeneranya kodingan diatas dapat dibuat menjadi ringkas seperti berikut:
```
ipcMain.handle('get-all-product', async () => {
    try {
    const result =  await instance.get()
    const result = res.data
   
    return result;
    } catch (err) {
      console.error('Error making API request:', err);
      // Optionally send an error message back to the renderer process
      throw err
    }
  } )
```
Hanya saja agar lebiah mudah saya pisahkan tiap prosesnya.
Tahap selanjutnya tinggal menghandle fungsi diatas lewat prealod.js dan mengaksesnya melalui react.js
```
// pada prealod.js
contextBridge.exposeInMainWorld('myAPI', {
    getAllProduct: () => ipcRenderer.invoke('get-all-product'),
});

// pada react
  const fetchingProducts = async () => {
    try {
      let data = await window.myAPI.getAllProduct();
      setProduct(data);
    } catch (err) {
      console.error("Error Fetching Data ", err);
      alert(`${err}`);
    }
  };
// selanjutnya tinggal merender product-nya
```
# Running The App
Untuk menjalankan aplikasinya, Berikut langkah-langkahnya:
1. Jalankan dulu server backendnya dulu dengan perintah ``` npm run start:mongodb ```
2. Jalankan react melalui vite dengan ``` npm run dev ```
3. Jalankan electron app dengan perintah ``` npm run start:electron ```

Berikut tampilan dari Electron + React + Mongodb
Tampilan Utama
![image](https://github.com/Limeless04/product-list-electron-react/assets/45208538/47c6913e-7178-4614-b56d-512703f57d60)
Tampilan Login page
![image](https://github.com/Limeless04/product-list-electron-react/assets/45208538/c0eba740-89cd-4d82-a01a-0b560bee60aa)
Tampilan Detail Page
![image](https://github.com/Limeless04/product-list-electron-react/assets/45208538/15651146-9207-41bc-9f7a-79116fd473ab)
Tampilan Tambah Product
![image](https://github.com/Limeless04/product-list-electron-react/assets/45208538/6fa64971-d231-4039-9f63-fce1974bf5d3)
![image](https://github.com/Limeless04/product-list-electron-react/assets/45208538/56656a8e-dad4-4acd-9a2f-a9584f3d55eb)




