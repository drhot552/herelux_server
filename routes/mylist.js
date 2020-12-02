module.exports = function(conn){
    const express = require('express');
    const moment  = require("moment");
    const date = require('../module/date');
    const db = require('../module/db_query');
    const router = express.Router();  //router하는 객체를 추출

    router.get('/product/:userid/:page', function(req, res){
      var userid = req.params.userid;
      var page = req.params.page;

      var idx = parseInt(page);
      var startidx = idx * 20;
      var lastidx = (idx + 1) * 20;
      var range = 0;
      const sql = `
                select id, user_id, name, size, color, price,star,url
                from
                (
                  select @rownum:=@rownum+1 num, a.id id, b.user_id, a.name, a.size, a.color, a.price, a.star, c.url
                        from luxury.product a, luxury.productlove b, luxury.productimg c, (select @rownum := 0) d
                        where b.user_id = ?
                        and a.id = b.product_id
                        and a.id = c.product_id
                ) a
                where a.num > ? and a.num <= ?`;

      let select_query = db.query(conn, sql, [userid,startidx,lastidx]);
      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else{
          console.log(data);
          res.json(data);
        }
      })

    })

    router.get('/talk/:userid/:page', function(req, res){
      var userid = req.params.userid;
      var page = req.params.page;

      var idx = parseInt(page);
      var startidx = idx * 20;
      var lastidx = (idx + 1) * 20;
      var range = 0;
      const sql = `
                  select talk_id, product_id, userid, name, product_name, brand_name, category_large,
                         category_middle, descript, talk_like, upd_dttm, reg_dttm, img_url
                  from
                  (
                    select  @rownum:=@rownum+1 num, a.talk_id, a.product_id, a.userid, a.name, a.product_name, a.brand_name, a.category_large,
                     a.category_middle, a.descript, a.talk_like, a.upd_dttm, a.reg_dttm, b.url img_url
                     from (select @rownum := 0) c, luxury.producttalk a left outer join luxury.producttalkimg b
                     on a.talk_id = b.talk_id
                     where a.userid = ?
                     order by reg_dttm desc
                  ) a
                  where a.num > ? and a.num <= ?`;

      let select_query = db.query(conn, sql, [userid,startidx,lastidx]);
      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else{
          res.json(data);
        }
      })
    })
    router.get('/talklike/:userid/:page', function(req, res){
      var userid = req.params.userid;
      var page = req.params.page;

      var idx = parseInt(page);
      var startidx = idx * 20;
      var lastidx = (idx + 1) * 20;
      var range = 0;
      const sql = `
                  select talk_id, product_id, userid, name, product_name, brand_name, category_large,
                           category_middle, descript, talk_like, upd_dttm, reg_dttm, img_url
                    from
                    (
                      select  @rownum:=@rownum+1 num, a.talk_id, a.product_id, a.userid, a.name, a.product_name, a.brand_name, a.category_large,
                       a.category_middle, a.descript, a.talk_like, a.upd_dttm, a.reg_dttm, b.url img_url
                       from (select @rownum := 0) c, (select b.*
                                     from luxury.producttalklike a, luxury.producttalk b
                                     where a.talk_id = b.talk_id
                                     and a.user_id = ?) a left outer join luxury.producttalkimg b
                       on a.talk_id = b.talk_id
                       order by reg_dttm desc
                    ) a
                    where a.num >? and a.num <= ?`;

      let select_query = db.query(conn, sql, [userid,startidx,lastidx]);
      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else{
          res.json(data);
        }
      })
    })
    router.get('/talkdown/:userid/:page', function(req, res){
      var userid = req.params.userid;
      var page = req.params.page;

      var idx = parseInt(page);
      var startidx = idx * 20;
      var lastidx = (idx + 1) * 20;
      var range = 0;
      const sql = `
                  select talk_id, product_id, userid, name, product_name, brand_name, category_large,
                         category_middle, descript, talk_like, upd_dttm, reg_dttm, img_url
                  from
                  (
                    select  @rownum:=@rownum+1 num, a.talk_id, a.product_id, a.userid, a.name, a.product_name, a.brand_name, a.category_large,
                     a.category_middle, a.descript, a.talk_like, a.upd_dttm, a.reg_dttm, b.url img_url
                     from (select @rownum := 0) c, (select b.*
                                    from luxury.producttalkcomment a, luxury.producttalk b
                                    where a.talk_id = b.talk_id
                                    and a.user_id = ?) a left outer join luxury.producttalkimg b
                     on a.talk_id = b.talk_id
                     order by reg_dttm desc
                  ) a
                  where a.num >? and a.num <= ?`;

      let select_query = db.query(conn, sql, [userid,startidx,lastidx]);
      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else{
          res.json(data);
        }
      })
    })
 return router;
}
