import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import 'dotenv/config'
import { fileURLToPath } from 'url';
import * as Realm from "realm-web";
import { ObjectId } from 'mongodb';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let window = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function createWindow() {
  // Create the browser window.
  window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
    },
  });

  // Load the index.html of the app.
  // This will give an error for now, since we will be using a React app instead of a file.
  window.loadFile('dist/index.html');
  // window.loadURL(startUrl)
  window.show()
  // // Open the DevTools.
  window.webContents.openDevTools({ mode: 'detach' });
}

const mongoApp = new Realm.App({ id: process.env.APP_ID });

async function loginApiKey(apiKey) {
  // Create an API Key credential
  const credentials = Realm.Credentials.apiKey(apiKey);
  // Authenticate the user
  const user = await mongoApp.logIn(credentials);
  console.log("user id:", user.id)
  // `App.currentUser` updates to match the logged in user
  console.assert(user.id === mongoApp.currentUser.id);
  return user;
}

const user = await loginApiKey(process.env.ATLAS_API_KEY)
const client = mongoApp.currentUser.mongoClient("mongodb-atlas")
const products = client.db('react-product').collection('products');

async function getData() {
  try {
    // Access the movies collection through MDB Realm & the readonly rule.
    const data = await products.find({})
    const modifiedData = data.map(doc => {
      doc._id = doc._id.toString();
      return doc;
    });
    return modifiedData;
  } catch (err) {
    console.error("Need to log in first", err);
    return;
  }
}

async function getById(id) {
  try {
    const res = await products.findOne({_id: new ObjectId(id)})
    return res;
  } catch (err) {
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

async function handleSubmitData(data) {
  try {
    const res = await products.insertOne(data)
    console.log(res)
    return res;
  } catch (err) {
    console.error('Error making API request:', err);
    throw err;
  }
}

async function handleDelete(id) {
  try {
    console.log(id)
    const res = await products.deleteOne({ _id : new ObjectId(id)})
    console.log(res)
    return res;
  } catch (err) {
    console.error('Error making API request:', err);
    throw err;
  }
}


app.whenReady().then(() => {
  createWindow()
  ipcMain.handle('get-all-product', handleGetData)
  ipcMain.handle("submit-data", async (event, data) => {
    try {
      const result = await handleSubmitData(data);
      return result;
    } catch (error) {
      console.error('Error handling submit-data:', error);
      throw error;
    }
  })
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
  
  ipcMain.handle("delete-product", async (event, id) => {
    // console.log(id)
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