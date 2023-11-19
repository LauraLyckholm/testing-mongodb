import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8082;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Middleware to handle error if service is down
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next();
  } else {
    res.status("503").json({ error: "Service unavailable" })
  }
})

// Creates the connection to Mongoose
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/animals";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Creates a model named Animal
const Animal = mongoose.model("Animal", {
  name: String,
  age: Number,
  isFurry: Boolean,
  breed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Breed"
  },
});

const Breed = mongoose.model("Breed", {
  breed: String
});

// One way of doing it.
// First deletes the objects then creates them, so that they don't multiply for each save
// Animal.deleteMany().then(() => {
//   new Animal({ name: "Sixten", age: 0, isFurry: true }).save();
//   new Animal({ name: "Alfons", age: 3, isFurry: true }).save();
// //   new Animal({ name: "Goldy the goldfish", age: 1, isFurry: false }).save();
// })

// An other way of doing it, plus adding an enviromental variable so that it doesn't restart on every save.
// if (process.env.RESET_DATABASE) {
const seedDatabase = async () => {
  await Animal.deleteMany();

  const cat = new Animal({ name: "Sixten", age: 0, isFurry: true });
  await cat.save();

  const dog = new Animal({ name: "Alfons", age: 3, isFurry: true });
  await dog.save();

  const fish = new Animal({ name: "Goldy the goldfish", age: 1, isFurry: false });
  await fish.save();

  await Breed.deleteMany();
  await new Breed({ breed: cat }).save();
}
seedDatabase();
// }


// Start defining your routes here
app.get("/", (req, res) => {
  Animal.find().then(animals => {
    res.json(animals)
  })
});

// Gets an animal based on the name in the param/url
app.get("/:name", async (req, res) => {
  try {
    await Animal.findOne({ name: req.params.name }).then(animal => {
      if (animal) {
        ``
        res.json(animal)
      } else {
        res.status(404).json({ error: "Animal not found" })
      }
    })
  } catch (err) {
    res.status(400).json({ error: "Invalid animal name" })
  }
})

app.get("/animals/cats", async (req, res) => {
  const cats = await Breed.find().populate("breed");
  res.json(cats)
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
