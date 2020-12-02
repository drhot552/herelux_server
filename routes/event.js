module.exports = function(conn){
    const express = require('express');
    const db = require('../module/db_query');
    const router = express.Router();  //router하는 객체를 추출

    //event API
    router.get('/', function(req, res){
      const sql = `
      	select brands_name,logoimgurl, url
      	from luxury.user
      	where brands_name in
                        		(select brands_name
                        		 from luxury.marketing
                        		 where use_yn = 'Y'
                        		 group by brands_name)
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
    router.get('/:brands_name', function(req, res){
      let brands_name = req.params.brands_name;
      const sql = `
        select img_url, direct_url, subtitle, brands_name, subject, event_start,event_end,event_day, content_type
        from luxury.marketing
        where use_yn = 'Y'
        and brands_name = ?
	      order by brand_event_id desc
      `;
      let select_query = db.query(conn, sql, brands_name);
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
