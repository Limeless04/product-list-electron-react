import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import 'dotenv/config'
import { fileURLToPath } from 'url';
import axios from 'axios';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let window = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const instance = axios.create({
  baseURL: "http://localhost:5555/api/products",
});

function createWindow() {
  // eslint-disable-next-line no-undef
  const startUrl = process.env.ELECTRON_START_URL
  // Create the browser window.
  window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      // sandbox: false,
      preload: path.join(__dirname, 'preload.mjs')
    },
  });

  // Load the index.html of the app.
  // This will give an error for now, since we will be using a React app instead of a file.
  //   window.loadFile('index.html');
  window.loadURL(startUrl)
  window.show()
  // Open the DevTools.
  window.webContents.openDevTools({ mode: 'detach' });
}


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

async function getById(id) {
  try {
    const res = await instance.get(`/${id}`,{
      params:{
        "id": id
      }
    })
    const result = res.data
    console.log(result)
    return result;
  }catch(err){
    console.error('Error making API request:', err);
    throw err;
  }
 
}

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




async function handleSubmitData(data){
  try {
    const res = await instance.post('/',data)
    const result = res.data
    return result;
  }catch(err){
    console.error('Error making API request:', err);
    throw err;
  }
}

async function handleDelete(id){
  try{
    const res = await instance.delete(`/${id}`, {
      params:{
        "id": id
      }})
      const result = res.data
      return result;
  }catch(err){
    console.error('Error making API request:', err);
    throw err;
  }
}


app.whenReady().then(() => {
  ipcMain.handle('get-all-product', handleGetData)
  createWindow()
  ipcMain.handle('get-by-id', async (event, id) => {
    try {
      const result = await getById(id)
      return result
    } catch (err) {
      console.error('Error making API request:', err);
      // Optionally send an error message back to the renderer process
      throw err
    }
  } )
  ipcMain.handle("submit-data", async (event, data) => {
    try {
      const result = await handleSubmitData(data);
      return result;
    } catch (error) {
      console.error('Error handling submit-data:', error);
      throw error;
    }
  })
  ipcMain.handle("delete-product", async (event, id) => {
    try {
      const result = await handleDelete(id);
      return result;
    } catch (error) {
      console.error('Error handling submit-data:', error);
      throw error;
    }
  })

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