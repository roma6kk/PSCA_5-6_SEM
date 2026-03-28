module.exports = [
  {
      path: '/api/users',
      method: 'get',
      controller: 'user',
      action: 'list'
  },
  {
      path: '/api/users/:id',
      method: 'get',
      controller: 'user',
      action: 'show'
  },
  {
      path: '/api/users',
      method: 'post',
      controller: 'user',
      action: 'create'
  },
  {
      path: '/api/users/:id',
      method: 'put',
      controller: 'user',
      action: 'update'
  },
  {
      path: '/api/users/:id',
      method: 'delete',
      controller: 'user',
      action: 'remove'
  }
];