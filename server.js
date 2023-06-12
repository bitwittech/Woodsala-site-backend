const express = require('express');
const app = express();
// const port = process.env.PORT || 0; // for dynemically chaging the port
const port = process.env.PORT || 8000;
const bodyParser = require('body-parser')
const path = require('path')
const mongo = require('./database/dbConfig');
const cors = require('cors')

// middleware to parse the body 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors())

// public path
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', './src/public');

//set up the view engine 
app.set('view engine', 'pug')
app.set('views', 'views')


// set uploads as static

app.use('/upload', express.static(path.join(__dirname, 'upload')));

// put the site on maintenance 
// app.use((req, res, next) => res.render('maintenance'));

// requiring the routes
app.use('/api/', require('./server/routes/routes'))
app.use('/app/', require('./server/routes/routes_app'))

app.use(express.static("frontend/build"));

// for local only 
// app.get("*", (req, res) => {
//   res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
// })


app.listen(port, () => {
  // console.log('Server is running at port',port);
  // // console.log(app.address());
})
