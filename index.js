const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(cors());
app.use(express.json());
require("dotenv").config();
const jwt = require("jsonwebtoken")

app.get("/", (req, res) => {
    res.send("safis photography")
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ldps5dz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeaders = req.headers.authorization;
    if (!authHeaders) {
        return res.status(401).send({ message: "Unauthorized access" })
    }
    const token = authHeaders.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "forbidden access" })
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        const serviceCollection = client.db("safis-photography").collection("services");
        const ordersCollection = client.db("safis-photography").collection("user-review")
        // jwt token api 
        app.post("/jwt", (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })
            res.send({ token })
        })
        // home page limit api 
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
        // get data by id 
        app.get("/services/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query);
            res.send(service)
        });
        app.get("/user-review/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await ordersCollection.findOne(query);
            res.send(service)
        });
        app.get("/servicereviewbyid/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id)                                                                 
            const query = {service:id};
            const cursor = ordersCollection.find(query);
            const service = await cursor.sort({createAt:-1}).toArray();
            res.send(service)
        });
        // service add on database 
        app.post("/services", async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result)
        })
        // post data review from ui 
        app.post("/user-review", async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result)
        });
        app.get("/user-reviews",verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            // console.log("inside order api", decoded)
            if (decoded.email !== req.query.email) {
                res.status(403).send("Unauthorised access")
            }
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        });
        app.delete("/user-reviews/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await ordersCollection.deleteOne(query)
            res.send(result);
        });

        app.put("/user-reviews/:id", async (req, res) => {
            const id = req.params.id;
            const update = req.body;
            const options = {upsert: true}
            const updateReview = {
                $set: {
                    message: update.message,
                    rating: update.rating
                }
            }
            const query = { _id: ObjectId(id) }
            const result = await ordersCollection.updateOne(query, updateReview, options)
            res.send(result);
            console.log(result)
        });
    }
    finally {

    }
}
run().catch(err => console.error(err))

app.listen(port, () => {
    console.log(`safis photography ${port}`)
})