module.exports = function(conn){
  const express = require('express');
  const moment  = require("moment");
  const db = require('../module/db_query');
  const router = express.Router();  //router하는 객체를 추출

  //plan 이벤트
  router.post('/',function(req,res){
    var sql = `select *
               from luxury.marketing a, luxury.user b
               where a.brands_name = 'HERELUX'
               and a.brands_name = b.brands_name
               order by 1 desc`;
    let select_query = db.query(conn, sql);
    select_query.then((data)=>{
      if(!data){
        res.json(500);
      } else {
        res.json(data);
      }
    })

  });
  //
  router.get('/product/:eventId', function(req,res){
    var eventId = req.params.eventId;

    var sql = `select *
               from luxury.productplan a, luxury.product b, luxury.productimg c
               where a.event_id = ?
               and a.product_id = b.id
               and a.product_id = c.product_id`;

    let select_query = db.query(conn, sql, eventId);
    select_query.then((data=>{
      if(!data){
        res.json(500);
      } else {
        res.json(data);
      }
    }))
  })
  return router;
}
