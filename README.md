# dictionary-prototype-kettle

A basic Dictionary and Translation Service made using [Kettle](https://github.com/fluid-project/kettle) which is an [Infusion](https://docs.fluidproject.org/infusion/development/index.html) server-side framework.\
Can be tried live [here](http://139.59.81.132/fluid)\
Read the documentation for the API [here](https://app.swaggerhub.com/apis/kunal4/dictionary-prototype/1.0.0) (made using Swagger).

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
Currently, the available end points are\
**GET** `/definition/{word}`\
**GET** `/definition/examples/{word}`\
**GET** `/translation/{form_lang}-{to_lang}`\
For example, `http://localhost:8081/translation/en-ru`

For any queries/suggestions/pointing out issues, contact me at `kunalmohta1818@gmail.com`
