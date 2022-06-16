const Post = require("../../models/Post");
const User = require("../../models/User");
const { UserInputError, AuthenticationError } = require("apollo-server");
var badWords = require("badwords/array");
const checkAuth = require("../../util/check-auth");

const checkBad = async (body, user_id) => {
  // check if the body contains bad words
  try {
    const lower = body.toLowerCase();
    const lowerTrimmed = lower.trim();
    const badWordsFound = badWords.filter((word) =>
      lowerTrimmed.includes(word)
    );
    if (badWordsFound.length > 0) {
      const author = await User.findById(user_id);
      author.strikes += 1;
      await author.save();

      if (author.strikes < 3) {
        throw new UserInputError(
          `The following words are not allowed: ${badWordsFound.join(
            ", "
          )}. Strikes left: ${3 - author.strikes}`
        );
      }
      throw new UserInputError(
        `You have been banned for inappropriate behavior.`
      );
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = {
  Query: {
    async getPosts() {
      try {
        const posts = await Post.find().sort({ createdAt: -1 });
        return posts;
      } catch (err) {
        throw new Error(err);
      }
    },

    async getPost(_, { postId }) {
      try {
        const post = await Post.findById(postId);
        if (post) {
          return post;
        } else {
          throw new Error("Post not found");
        }
      } catch (err) {
        throw new Error(err);
      }
    },
  },
  Mutation: {
    async createPost(_, { body }, context) {
      const user = checkAuth(context);

      console.log(body);

      if (body.trim() === "") {
        throw new Error("Post body cannot be empty");
      }

      await checkBad(body, user.id);

      const newPost = new Post({
        body,
        user: user.id,
        username: user.username,
        createdAt: new Date().toISOString(),
      });

      const post = newPost.save();

      context.pubsub.publish("NEW_POST", {
        newPost: post,
      });

      return post;
    },

    async deletePost(_, { postId }, context) {
      const user = checkAuth(context);
      try {
        const post = await Post.findById(postId);
        if (user.username === post.username) {
          await post.delete();
          return "Post deleted successfully";
        } else {
          throw new AuthenticationError("Action not allowed");
        }
      } catch (err) {
        throw new Error(err);
      }
    },

    async likePost(_, { postId }, context) {
      const { username } = checkAuth(context);
      const post = await Post.findById(postId);

      if (post) {
        if (post.likes.find((like) => like.username === username)) {
          //Post already liked, unlike it
          post.likes = post.likes.filter((like) => like.username !== username);
        } else {
          //Not liked, like post
          post.likes.push({
            username,
            createdAt: new Date().toISOString(),
          });
        }

        await post.save();
        return post;
      } else {
        throw new UserInputError("Post not Found");
      }
    },
  },
  Subscription: {
    newPost: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator("NEW_POST"),
    },
  },
};
