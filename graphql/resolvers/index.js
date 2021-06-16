const postsResolvers = require("./posts");
const userResolvers = require("./users");
const commentsResolvers = require("./comments");

module.exports = {
  // Any query or mutation that returns post will trigger this code
  Post: {
    likeCount: (parent) => parent.likes.length,
    commentCount: (parent) => parent.comments.length,
  },
  Query: {
    ...postsResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...postsResolvers.Mutation,
    ...commentsResolvers.Mutation,
  },
  Subscription: {
    ...postsResolvers.Subscription,
  },
};
