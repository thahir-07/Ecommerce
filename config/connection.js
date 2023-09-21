const MongoClient=require('mongodb').MongoClient
const state={
    db:null
}
const url="mongodb://127.0.0.1:27017";
//const url="mongodb+srv://abuthahircoorg07:9HCw6e5wqrgf9X9e@cluster0.aodwl7l.mongodb.net/?retryWrites=true&w=majority";;
const dbname="ecommerce"
const client = new MongoClient(url);

async function connect(done){
    try{
    await client.connect()  
    const db=client.db(dbname)
    state.db=db
    return done()


    }catch(err){
        return done(err)

    }

}
function get(){
    return state.db
}
module.exports={ connect,get}



//brototype code...............................
/*
const { MongoClient } = require("mongodb");

const state = {
  db: null,
};

// mongodb connection string
const url = "mongodb://127.0.0.1:27017";
// database name
const dbName = "envidata";

// create a new mongodb client object
const client = new MongoClient(url);

// function to establish mongodb connection
const connect = async (cb) => {
  try {
    // connecting to mongodb
    await client.connect();
    // setting up database name to the connected client
    const db = client.db(dbName);
    // setting up database name to the state
    state.db = db;
    // callback after connected
    return cb();
  } catch (err) {
    // callback when an error occurs
    return cb(err);
  }
};

// function to get the database instance
const get = () => state.db;

// exporting functions
module.exports = {
  connect,
  get,
};
*/