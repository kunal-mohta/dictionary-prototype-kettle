# dictionary-prototype-kettle

Same functioning as [dictionary-prototype](https://github.com/kunal-mohta/dictionary-prototype), but made using [Kettle](https://github.com/fluid-project/kettle) which is an [Infusion](https://docs.fluidproject.org/infusion/development/index.html) server-side framework.

### How to use locally
#### Clone the Repository
Run
```
git clone https://github.com/kunal-mohta/dictionary-prototype.git
```
#### Install dependency packages
Run
```
cd dictionary-prototype-kettle
npm install
```
#### Start the server
Run
```
npm start
```
#### Done!
Server will start listening at `http://localhost:8081/`
Start making requests to this URL

#### Running Tests
Run
```
npm test
```
The tests written will be run

### Requests
Currently, the only available end point is\
**GET** `/definition/{word}`
which means when running locally, the required URL is `http://localhost:8081/definition/{word}`

### Responses
The standard format of the JSON response is
```
"statusCode": Number,
"responseMessage": String,
"jsonDefinitions": Array
```
More specifically..
```
"statusCode": {code},
"responseMessage": {message},
"jsonDefinitions": [
  {
    "definitions" : [],
    "examples" : []
  },
  {
    "definitions" : [],
    "examples" : []
  },
  ...
]
```

For any queries/suggestions/pointing out issues, contact me at `kunalmohta1818@gmail.com`
