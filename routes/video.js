module.exports = function(conn){
    const express = require('express');
    const db = require('../module/db_query');
    const router = express.Router();  //router하는 객체를 추출

    //event API
    router.get('/', function(req, res){

      const sql = `
      select a.id_seq id, a.videourl videourl, a.subject subject, a.price price
	     ,url
      from luxury.video a, luxury.marketing b
      where a.videourl = b.direct_url
      order by id_seq
      `;
      let select_query = db.query(conn, sql);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          res.json(data);
        }
      })
    })

    return router;
}
