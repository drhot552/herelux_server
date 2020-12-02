//database 연결구조
const db = require('mysql2/promise');
//const config = require('../module/db_server').real;
const config = require('../module/db_server').real;


module.exports.conn= function(){
  const conn = db.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database

  });
  /* conn.connect(function(err) {
    if (err) {
      console.error('에러 connect:' + err.stack);
      return;
    } else {
      console.log('db connection success!');
    }
  }); */

  return conn;
}
