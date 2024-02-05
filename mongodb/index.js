import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 5555

app.use(cors())
app.use(bodyParser.json())

const username = encodeURIComponent(process.env.CLUSTER_USERNAME)
const password = encodeURIComponent(process.env.CLUSTER_PASS)
const uri = `mongodb+srv://${username}:${password}@cluster0.ivqjc5p.mongodb.net/?retryWrites=true&w=majority`


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas', error);
  }
}


connectToDatabase().catch(console.dir);

// Routes for handling database operations
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

app.post('/api/products', async (req, res) => {
  const database = client.db('react-product');
  const collection = database.collection('products');
  const formData = req.body

  try {
    const result = await collection.insertOne(formData);
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error reading data from MongoDB', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  const productId = new ObjectId(req.params.id);
  console.log(productId)
  const database = client.db('react-product');
  const collection = database.collection('products');

  try {
    const result = await collection.findOne({ "_id": productId });
    console.log(result)
    res.json(result);
  } catch (error) {
    console.error('Error reading data from MongoDB', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const productId = new ObjectId(req.params.id);
  const database = client.db('react-product');
  const collection = database.collection('products');

  try {
    const result = await collection.deleteOne({ "_id": productId });
    res.json(result);
  } catch (error) {
    console.error('Error reading data from MongoDB', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});