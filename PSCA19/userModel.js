const users = [
  { id: 1, name: "Ivan", role: "admin" },
  { id: 2, name: "Maria", role: "user" }
];

module.exports = {
  getAll: () => users,
  getById: (id) => users.find(u => u.id == id),
  create: (data) => {
      const newUser = { id: users.length + 1, ...data };
      users.push(newUser);
      return newUser;
  },
  update: (id, data) => {
      const index = users.findIndex(u => u.id == id);
      if (index === -1) {
          return null;
      }
      users[index] = { ...users[index], ...data, id: users[index].id };
      return users[index];
  },
  remove: (id) => {
      const index = users.findIndex(u => u.id == id);
      if (index === -1) {
          return null;
      }
      const [removedUser] = users.splice(index, 1);
      return removedUser;
  }
};