module.exports = function(conn){
  const express = require('express');
  const db = require('../module/db_query');
  const router = express.Router();

  router.get('/board/:userid', function(req, res){
    var userid = req.params.userid;

    if(userid != null){
      const sql = `select board_idx, userid
                   from luxury.board
                   where userid = ?
                   and check_flag = 0
                   union
                   select board_idx, userid
                   from luxury.comment
                   where userid = ?
                   and check_flag = 0`;
      let select_query = db.query(conn, sql, [userid,userid]);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          res.json(data);
        }
      })
    } else {
      res.json(200);
    }

  });
  router.get('/boardcheck/:userid/:board_id', function(req, res){
    var userid = req.params.userid;
    var board_id = req.params.board_id;
    const sql = `update luxury.board
                 set check_flag = 1
                 where board_idx = ?
                 and userid = ?`;
   let select_query = db.query(conn, sql, [board_id, userid]);
   select_query.then((data)=>{
     if(!data){
       res.json(500);
     } else {
       const update_sql =  `update luxury.comment
                              set check_flag = 1
                              where board_idx = ?
                              and userid = ?`;
       let update_query = db.query(conn, update_sql, [board_id, userid])
       update_query.then((data)=>{
         if(!data){
           res.json(500);
         } else {
           res.json(200);
         }
       })
     }
   })
  });
  //총 게시글, 카운트 수, 선호브랜드
  router.get('/myinfo/:userid', function(req,res){
    var userid = req.params.userid;

    const sql = `select '선호브랜드' as type, 0 as cnt, max(c.descript) as name, max(c.sub_descript) as sub_name
                 from
                 (
                 	select brand_name,id, sum(a.count) cnt
	                   from luxury.productcnt a, luxury.product b
	                   where userid = ?
	                   and a.product_id = b.id
	                   group by brand_name
                 ) a, luxury.code c
                 where a.cnt in (select max(a.cnt) cnt
                 from (
	                 select brand_name, sum(a.count) cnt
	                   from luxury.productcnt a, luxury.product b
	                   where userid = ?
	                   and a.product_id = b.id
	                   group by brand_name
                 ) a)
                 and a.brand_name = c.minor_key
                 and c.major_key = 1
                union all
                select '게시글' as type ,count(*) cnt, '' as name, '' as sub_name
                   from luxury.board
                   where userid = ?
                 union all
                   select '평가수' as type ,count(*) cnt, '' as name, '' as sub_name
                   from luxury.productlist
                   where userid = ?
                   `;
     let select_query = db.query(conn, sql, [userid, userid, userid, userid]);
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
