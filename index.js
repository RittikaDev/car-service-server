const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const res = require("express/lib/response");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1]; // bearere token <= this is what is written originally the split takes only the token and cuts out the bearer word
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Forbidden" });
    }
    console.log("decoded", decoded);
    req.decoded = decoded; //if then is no error it sends the decoded as a request
    //this is what decoded looks like
    // decoded { email: 'rittika.dev@gmail.com', iat: 1650821224, exp: 1650907624 }
    next(); //next is written when there is no error
  });
}

const port = process.env.PORT || 5000;

// geniusUser
// pj2zLIuf2xA5KjfR

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7fxty.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("carServices").collection("service"); // see in the database browse collection (tree view). The first one is db name and the second one is collection name
    const orderCollection = client.db("geniusCar").collection("order"); //collection for order

    // Auth
    app.post("/login", async (req, res) => {
      const user = req.body;
      //inside jwt.sign is a  payload that contains the info that you ant to store in the token
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d", //for how long the token is valid
      });
      res.send({ accessToken });
    });

    // Order Collection API
    //before entering the url it is going to the verifyJWT function to check whatever is written there
    app.get("/order", verifyJWT, async (req, res) => {
      //now from verifyJWt it sets the decoded here below
      const decodedEmail = req.decoded.email;
      const email = req.query.email; //the email gotten from input
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      } else {
        res.status(403).send({ message: "forbidden access" });
      }
      // res.send(orders);
    });
    // app.get("/order", verifyJWT, async (req, res) => {
    //

    // });
    app.post("/order", async (req, res) => {
      const order = req.body; //from order url added products are being sent to database
      const result = await orderCollection.insertOne(order);
      res.send(result);
      // without await will return null
    });
    // Services api
    //initially load all data
    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = await serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    // Dynamic load data
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }; // when you create a database on mongodb for each object it create a kind of like a header that looks like { _id: ObjectId(id) } where id is the id for each object, that is why we write this
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // post
    app.post("/service", async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });

    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running Car Service");
});

app.get("/hero", (req, res) => {
  res.send("Hero meets hero ku");
});

app.listen(port, () => {
  console.log(`Listener listening on port ${port}`);
});
