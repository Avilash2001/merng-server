const { ApolloServer, PubSub } = require("apollo-server");
const mongoose = require("mongoose");

const { MONGO_URL } = require("./config.js");
const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");

const pubsub = new PubSub();

const PORT = process.env.port || 5000;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  //to access the request body in any request paramaetr in mutation
  context: ({ req }) => ({ req, pubsub }),
});

mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected!");
    return server.listen({
      port: PORT,
    });
  })

  .then((res) => {
    console.log(`Server running at ${res.url}!`);
  })
  .catch((err) => {
    console.log(err);
  });
