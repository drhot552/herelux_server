module.exports = function(conn){
    const express = require('express');
    const moment  = require("moment");
    const date = require('../module/date');
    const db = require('../module/db_query');
    const router = express.Router();  //router하는 객체를 추출


    router.post('/productout',function(req,res){
      var id = req.body.id;
      var user = req.body.user;
      var url = req.body.url;
      var shopping_mall = req.body.shoppingmall;
      var descript = req.body.descript;

      //해당 아이디로 신고한 내역이 있는지 확인
      const sql = `select count(*) cnt
                   from luxury.productout
                   where product_id = ?
                   and userid = ?
                   and shopping_mall = ?`;
     let select_query = db.query(conn, sql, [id, user, shopping_mall]);
     select_query.then((data)=>{
       if(!data){
         res.json(500);
       } else {
         if(data[0].cnt == 0){
           const sql_insert = `insert into luxury.productout(product_id, userid, shopping_mall, url, descript, reg_dttm, upd_dttm)
                               values (?,?,?,?,?,?,?)`
           //자바스크립트 날짜 시간 set
           let reg_date = moment().format("YYYY-MM-DD");
           let reg_time = date.time();
           let reg_dttm = reg_date + " " + reg_time

           let insert_query = db.query(conn, sql_insert, [id,user,shopping_mall,url,descript,reg_dttm,reg_dttm])
           insert_query.then((data)=>{
             if(!data){
               res.json(500)
             } else {
               res.json(200)
             }
           })
         } else {
           //신고한 내역이 있을 경우.
           res.json(300)
         }
       }
     })

    })
    router.get('/allproduct/:page/:category/:key', function(req, res){
      var page = req.params.page;
      var category = req.params.category;
      var key = req.params.key;

      var idx = parseInt(page);
      var startidx = idx * 20;
      var lastidx = (idx + 1) * 20;

      var range = 0;
      var sql = ``;
      //전체
      if(key != 99){
        range = key;
      }
      if(category == 1){
        sql = `select id, category_large, category_middle, brand_name, name, sub_name, descript,
                           size, color, price, url, descript
                   from
                   (
                       select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle,
                          a.brand_name, a.name, a.sub_name, a.size, a.color, a.price, b.url, d.descript
                       from luxury.product a, luxury.productimg b, (select @rownum := 0) c, luxury.code d
                       where a.id = b.product_id
                       and d.major_key = 1
                       and a.brand_name = d.minor_key
                       and a.category_large between ? and ?
                   ) a
                   where a.num > ? and a.num <= ?`;
      }
      else if(category == 2){
        sql = `select id, category_large, category_middle, brand_name, name, sub_name, descript,
                           size, color, price, url, descript
                   from
                   (
                       select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle,
                          a.brand_name, a.name, a.sub_name, a.size, a.color, a.price, b.url, d.descript
                       from luxury.product a, luxury.productimg b, (select @rownum := 0) c, luxury.code d
                       where a.id = b.product_id
                       and d.major_key = 1
                       and a.brand_name = d.minor_key
                       and a.category_middle between ? and ?
                   ) a
                   where a.num > ? and a.num <= ?`;
      }

      let select_query = db.query(conn, sql, [range, key, startidx,lastidx]);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          res.json(data);
        }
      })
    })

    //favorite 랜덤으로
    router.get('/:user', function(req, res){
      let user = req.params.user;
      //code b-> 대카테고리, code c->중카테고리
      const sql = `
      select id, name, category_large, b.descript category_large_name, category_middle, size, color, price
            from luxury.product a, luxury.code b
            where id not in (select id from luxury.productlist where userid = ?)
            and b.major_key = 1
            and a.category_large = b.minor_key
            order by rand() limit 1
            `;
      let select_query = db.query(conn, sql, user);
      select_query.then((data)=>{
        if(!data){
          res.json(501)
        } else{
          res.json(data);
        }
      })
    })
    //product imageget
    router.get('/image/:id', function(req, res){
      var product_id = req.params.id;
      const sql = `
        select url, source
        from luxury.productimg
        where product_id = ?
      `;
      let select_query = db.query(conn, sql, product_id);
      select_query.then((data)=>{
        if(!data){
          res.json(501)
        } else{
          res.json(data);
        }
      })
    })
    //똑같은 브랜드 및 카테고리 select
    router.get('/samebrand/:brand',function(req,res){
      let brand = req.params.brand;

      const sql = `select *
                   from luxury.product a, luxury.productimg b
                   where a.brand_name = ?
                   and a.id = b.product_id
                   order by rand() limit 10`;

     let select_query = db.query(conn, sql, brand);
     select_query.then((data)=>{
       if(!data){
         res.json(501)
       } else{
         res.json(data);
       }
     })
    })
    router.get('/samecategory/:category/:category_type', function(req,res){
      let category = req.params.category
      let category_type = req.params.category_type
      let sql = '';
      //large
      if(category_type == 1){
        sql = `select *
               from luxury.product a, luxury.productimg b
               where a.id = b.product_id
               and a.category_large = ?
               order by rand() limit 10`;
      }
      else {
        sql = `select *
               from luxury.product a, luxury.productimg b
               where a.id = b.product_id
               and a.category_middle = ?
               order by rand() limit 10`;
      }
     let select_query = db.query(conn, sql, category);
     select_query.then((data)=>{
       if(!data){
         res.json(501)
       } else{
         res.json(data);
       }
     })
    })
    //상품상세 detail
    router.get('/detail/:id', function(req,res){
      let id = req.params.id;

      const sql = ` select id, a.category_large, c.descript as category_large_name, a.sub_name sub_name, a.brand_name,
                           e.descript as brand_name_descript,
                           category_middle,
                           d.descript category_middle_name, name,
                           size, color, price, star, url, count, SUBSTRING(a.reg_dttm,1,10) reg_dttm
        					  from luxury.product a, luxury.productimg b, luxury.code c, luxury.code d, luxury.code e
        					  where a.id = b.product_id
        					  and c.major_key = 2
        					  and a.category_large = c.minor_key
                    and d.major_key = a.category_large * 10 + 1
        					  and a.category_middle = d.minor_key
                    and e.major_key = 1
                    and a.brand_name = e.minor_key
        					  and a.id = ?
                    `;
      let select_query = db.query(conn, sql, id);
      select_query.then((data)=>{
        if(!data){
          res.json(501)
        } else{
          res.json(data);
        }
      })
    })
    //상품 category select
    router.get('/ranking/:category/:key/:page', function(req,res){
      var key = req.params.key;
      var page = req.params.page;
      var category = req.params.category;
      var idx = parseInt(page);
      var startidx = idx * 20;
      var lastidx = 99;
      var range = 0;
      var sql = '';

      //전체일때
      if(key != 99){
        range = key;
      }
      //대 카테고리
      if(category == 1)
      {
        sql = `select id, descript as category_large_name, name, size, color, avg, url
                      from (
              						select @rownum:=@rownum+1 num, id, descript, name, size, color, avg, url
              						from (
              							select  a.id id, c.descript, a.name, a.size, a.color, a.price, round(a.star/a.count,2) avg, b.url
              							from luxury.product a, luxury.productimg b, luxury.code c, (select @rownum := 0) d
              							where a.id = b.product_id
                            and c.major_key = 1
                            and a.category_large = c.minor_key
                            and a.category_large between ? and ?
                            and a.star > 0
              							order by round(a.star/a.count,2) desc
              						) a
                      ) b
                      where b.num > ? and b.num <= ?
                    `;
      }
      //중카테고리
      else if(category == 2){
        sql =  `select id, descript as category_large_name, name, size, color, avg, url
                      from (
              						select @rownum:=@rownum+1 num, id, descript, name, size, color, avg, url
              						from (
              							select  a.id id, c.descript, a.name, a.size, a.color, a.price, round(a.star/a.count,2) avg, b.url
              							from luxury.product a, luxury.productimg b, luxury.code c, (select @rownum := 0) d
              							where a.id = b.product_id
                            and c.major_key = 1
                            and a.category_large = c.minor_key
                            and a.category_middle between ? and ?
                            and a.star > 0
              							order by round(a.star/a.count,2) desc
              						) a
                      ) b
                      where b.num > ? and b.num <= ?
                    `;
      }
      else {
        res.json(501);
      }
      let select_query = db.query(conn, sql, [range,key,startidx,lastidx]);
      select_query.then((data)=>{
        if(!data){
          res.json(501)
        } else{
          res.json(data);
        }
      })

    })
    //product detail
    router.get('/detailbrand/:product_id', function(req, res){
      var product_id  = req.params.product_id;

      const sql = `select a.product_id, a.url, a.shopping_mall, a.price, b.logoimgurl, a.price_symbol, a.stock
                   from luxury.productmall a, luxury.user b
                   where a.product_id = ?
                   and a.shopping_mall = b.index
                   and a.shopping_mall != 19`;

       let select_query = db.query(conn, sql, [product_id]);
       select_query.then((data)=>{
         if(!data){
           res.json(500)
         } else{
           res.json(data);
         }
       })
    })
    router.get('/productlovechk/:product_id/:user_id',function(req,res){
      var product_id = req.params.product_id;
      var userid = req.params.user_id;
      const sql  = `select *
                    from luxury.productlove
                    where product_id = ?
                    and user_id = ?`;

      let select_query = db.query(conn, sql, [product_id, userid])
      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else {
          res.json(data)
        }
      })
    });
    router.get('/productview/:product_id',function(req,res){
      var product_id = req.params.product_id;
      const sql = `update luxury.product set count = count + 1 where id = ?`;

      let update_query = db.query(conn, sql, [product_id]);
      update_query.then((data)=>{
        if(!data){
          res.json(500)
        } else {
          res.json(200)
        }
      })
    });
    router.get('/productlove/:user_id/:product_id',function(req,res){
      var product_id = req.params.product_id;
      var userid = req.params.user_id;
      //내가 선택한 상품인지 아닌지 체크
      const sql  = `select count(*) cnt
                    from luxury.productlove
                    where product_id = ?
                    and user_id = ?`;
      var select_query = db.query(conn, sql, [product_id, userid]);
      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else {
          let product_date = moment().format("YYYY-MM-DD");
          let product_time = date.time();

          if(data[0].cnt == 0) {
            const  sql_insert = `insert into  luxury.productlove(product_id, user_id, reg_date, reg_time)
                                values (?,?,?,?)`;
            let insert_query = db.query(conn, sql_insert, [product_id, userid, product_date, product_time]);
            insert_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(200);
              }
            });
          } else {
            const sql_delete = `delete from luxury.productlove where product_id = ? and user_id = ?`;
            let delete_query = db.query(conn, sql_delete, [product_id, userid]);
            delete_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(200)
              }
            })
          }
        }
      })
    });
    //상품의 하트를 클릭했을때
    router.get('/productcnt/:userid/:product_id', function(req, res){
      var product_id = req.params.product_id;
      var userid = req.params.userid;
      //내가 선택한 상품인지 아닌지 체크
      const sql  = `select count(*) cnt
                    from luxury.productcnt
                    where product_id = ?
                    and userid = ?`;

      let select_query = db.query(conn, sql, [product_id, userid]);
      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else{
          let product_date = moment().format("YYYY-MM-DD");
          let product_time = date.time();

          if(data[0].cnt == 0) {
            const  sql_insert = `insert into  luxury.productcnt(product_id, userid, count, reg_date, reg_time)
                                values (?,?,?,?,?)`;
            let insert_query = db.query(conn, sql_insert, [product_id, userid, 1, product_date, product_time]);
            insert_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(200);
              }
            });
          } else {
            const sql_update = `update luxury.productcnt
                                set count = count + 1, upd_date = ? , upd_time = ?
                                where product_id = ?
                                and userid = ? `;
            let update_query = db.query(conn, sql_update, [product_date, product_time, product_id, userid]);
            update_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(200);
              }
            })
          }
        }
      })
    })
    router.get('/productrecommend/:category_middle', function(req,res){
      var category_middle = req.params.category_middle;

      const sql = `select a.id, a.category_large, a.category_middle, a.brand_name, b.url
                    from luxury.product a, luxury.productimg b
                    where a.id  = b.product_id
                    and a.category_middle = ?
                    order by rand() limit 4`;
      const select_query = db.query(conn, sql, [category_middle]);
      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else {
          res.json(data)
        }
      })
    })
    router.post('/mylistrecommend', function(req,res){

      const sql = `select a.id, a.category_large, a.category_middle, a.brand_name, b.url
                    from luxury.product a, luxury.productimg b
                    where a.id  = b.product_id
                    order by rand() limit 4`;
      const select_query = db.query(conn, sql);
      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else {
          console.log(data);
          res.json(data)
        }
      })
    })
    router.post('/list', function(req, res){
      var id = req.body.id;
      var user = req.body.user;
      var rating = req.body.rating;
      //insert 후 select
      const sql = `Insert into luxury.productlist(id,userid,star) values (?,?,?)`
      const insert_query = db.query(conn, sql, [id,user,rating]);
      insert_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          const sql_update = `update luxury.product
                              set star =  star + ?, count = count + 1
                              where id = ?`;
          const update_query = db.query(conn, sql_update, [rating,id]);
          update_query.then((data)=>{
            if(!data){
              res.json(502)
            } else {
              const sql_select = `select a.id, a.name, b.descript, a.category_middle, a.size, a.color, a.price, c.url, c.source
                                  from luxury.product a, luxury.productimg c, luxury.code b
                                  where a.id not in (select id from  luxury.productlist where userid = ?)
                                  and a.id = c.product_id
                                  and a.category_large = b.minor_key
                                  and b.major_key = 1
                                  order by rand() limit 1`;
              const select_query = db.query(conn, sql_select, user);
              select_query.then((data)=>{
                if(!data){
                  //select error
                  res.json(501);
                } else {
                  res.json(data);
                }
              })
            }
          });
        }
      })
    })
    return router;
}
