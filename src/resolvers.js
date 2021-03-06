const bcrypt = require("bcryptjs");
const { AuthenticationError } = require("apollo-server-express");

const resolvers = {
  Query: {
    helloWorld: () => `Hello world wahaaaaa! what a day!`,
    users: (parent, args, context, info) => {
      console.log(context);

      return context.prisma.user.findMany();
    },
    user: (parent, args, context, info) => {
      return context.prisma.user.findOne({
        where: { id: parseInt(args.userId) },
      });
    },
    todos: async (parent, args, context, info) => {
      if (!context.isAuthenticated()) {
        throw new AuthenticationError("Must be logged in to do that!");
      }
      const user = await context.getUser();
      console.log("userId: ", user.id);
      return context.prisma.todo.findMany({
        where: { userId: parseInt(user.id) },
      });
    },
    me: (parent, args, context, info) => {
      if (context.getUser()) {
        return context.getUser();
      }
    },
  },
  Mutation: {
    signup: async (parent, args, context, info) => {
      const password = await bcrypt.hash(args.password, 10);

      console.log(password);

      await context.prisma.user.create({
        data: {
          firstName: args.firstName,
          email: args.email,
          age: args.age,
          password,
        },
      });

      const { user } = await context.authenticate("graphql-local", {
        email: args.email,
        password: args.password,
      });

      context.login(user);

      return user;
    },
    login: async (parent, { email, password }, context, info) => {
      console.log("login one");

      const { user } = await context.authenticate("graphql-local", {
        email,
        password,
      });

      console.log("in resolver: ", user);

      context.login(user);

      return user;
    },
    logout: (parent, args, context, info) => {
      console.log(context);
      context.logout();
    },
    deleteUser: async (parent, args, context, info) => {
      await context.prisma.todo.deleteMany({
        where: { userId: parseInt(args.userId) },
      });

      return context.prisma.user.delete({
        where: { id: parseInt(args.userId) },
      });
    },
    updateUser: (_, args, context) => {
      return context.prisma.user.update({
        where: {
          id: parseInt(args.userId),
        },
        data: {
          firstName: args.input.firstName,
          email: args.input.email,
          age: args.input.age,
        },
      });
    },
    createTodo: (parent, args, context, info) => {
      if (!context.isAuthenticated()) {
        throw new AuthenticationError("Must be logged in to do that");
      }
      return context.prisma.todo.create({
        data: {
          name: args.name,
          isComplete: args.isComplete,
          user: { connect: { id: parseInt(args.userId) } },
        },
      });
    },
    deleteTodo: (parent, args, context, info) => {
      return context.prisma.todo.delete({
        where: { id: parseInt(args.todoId) },
      });
    },
    updateTodo: (_, args, context) => {
      return context.prisma.todo.update({
        where: {
          id: parseInt(args.todoId),
        },
        data: {
          name: args.name,
          isComplete: args.isComplete,
        },
      });
    },
    resetTodos: (parent, args, context, info) => {
      let todosToReset = args.todoIds.map((id) => {
        return parseInt(id);
      });
      return context.prisma.todo.updateMany({
        where: {
          id: {
            in: todosToReset,
          },
        },
        data: {
          isComplete: false,
        },
      });
    },
    deleteTodos: (parent, args, context, info) => {
      let newIds = args.todoIds.map((id) => {
        return parseInt(id);
      });
      return context.prisma.todo.deleteMany({
        where: {
          id: {
            in: newIds,
          },
        },
      });
    },
  },
  User: {
    id: (parent) => parent.id,
    firstName: (parent) => {
      return parent.firstName;
    },
    email: (parent) => parent.email,
    age: (parent) => {
      return parent.age;
    },
    todos: (parent, args, context) => {
      return context.prisma.todo.findMany({
        where: { userId: parent.id },
      });
    },
  },
  Todo: {
    user: (parent, _, context) => {
      return context.prisma.user.findOne({
        where: { id: parent.userId },
      });
    },
  },
};

module.exports = {
  resolvers,
};
