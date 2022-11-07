const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
app.use(cors());
app.use(express.json());

require("dotenv").config();


app.get("/", (req, res) => {
    res.send("genius car running")
});



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ldps5dz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const serviceCollection = client.db("safis-photography").collection("services");
        app.get("/services-limit", async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.limit(3).toArray();
            res.send(services);
        })
        // get data from server to ui 
        app.get("/services", async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })
        // service add on database 
        app.post("/services", async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result)
        })
    }
    finally{

    }
} 
run().catch(err => console.error(err))

app.listen(port, () => {
    console.log(`genius car running on port ${port}`)
})