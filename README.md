# Fetch Resources

It’s a module that creates a resource object that lets you interact with RESTful server-side data sources.

Based on Angular ngResources.

## Requirements
* Fetch
* Lodash

## Examples

[Example File](./example.js)

```js

const FetchResources = require('./index.js');


////////////////////////////////////////////////////////////


//Fetch Resource initial config
const objConfig = {
  host: 'https://jsonplaceholder.typicode.com'
};


//Fetch Resource Instance
const objFetchResources = FetchResources(objConfig);


//Post Source
const objPostSource = objFetchResources.source('posts', {
  getById: {
    method: 'GET',
    endpoint: 'posts/:id',
    params: ['id']
  },
  getPostComments: {
    method: 'GET',
    endpoint: 'posts/:id/comments',
    params: ['id']
  }
});


////////////////////////////////////////////////////////////


// GET https://jsonplaceholder.typicode.com/posts HTTP/1.1
objPostSource.get().then((results) => {
  // success
  console.log(results);
})
.catch((error) => {
  // error
  console.log(error);
});


// GET https://jsonplaceholder.typicode.com/posts?userId=1 HTTP/1.1
objPostSource.get({ userId: 1 }).then((results) => {
  // success
  console.log(results);
})
.catch((error) => {
  // error
  console.log(error);
});


// POST https://jsonplaceholder.typicode.com/posts HTTP/1.1
const objPayload = {
  title: 'foo',
  body: 'bar',
  userId: 1
};

objPostSource.post(objPayload).then((results) => {
  // success
  console.log(results);
})
.catch((error) => {
  // error
  console.log(error);
});


// PUT https://jsonplaceholder.typicode.com/posts/1 HTTP/1.1
const objPayload = {
  id: 1, // This will be added to the URL
  title: 'foo2',
  body: 'bar',
  userId: 1
};

objPostSource.update(objPayload).then((results) => {
  // success
  console.log(results);
})
.catch((error) => {
  // error
  console.log(error);
});


// DELETE https://jsonplaceholder.typicode.com/posts/1 HTTP/1.1
const objPayload = {
  id: 1, // This will be added to the URL
};

objPostSource.remove(objPayload).then((results) => {
  // success
  console.log(results);
})
.catch((error) => {
  // error
  console.log(error);
});


// GET https://jsonplaceholder.typicode.com/posts/1 HTTP/1.1
const objPayload = {
  id: 1, // This will be added to the URL
};

objPostSource.getById(objPayload).then((results) => {
  // success
  console.log(results);
})
.catch((error) => {
  // error
  console.log(error);
});


// GET https://jsonplaceholder.typicode.com/posts/1/comments HTTP/1.1
const objPayload = {
  id: 1, // This will be added to the URL
};

objPostSource.getPostComments(objPayload).then((results) => {
  // success
  console.log(results);
})
.catch((error) => {
  // error
  console.log(error);
});
```
