// import { contextBridge, ipcRenderer } from 'electron';
// eslint-disable-next-line no-undef
const {contextBridge, ipcRenderer} = require("electron")

contextBridge.exposeInMainWorld('myAPI', {
    getById: (id) => ipcRenderer.invoke('get-by-id', id),
    submitData: (data) => ipcRenderer.invoke('submit-data', data),
    getAllProduct: () => ipcRenderer.invoke('get-all-product'),
    deleteProduct: (id) => ipcRenderer.invoke("delete-product", id)

});