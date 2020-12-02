module.exports = function(conn){
    const express = require('express');
    const db = require('../module/db_query');
    const router = express.Router();  //router하는 객체를 추출
    //브랜드 관 선택
    router.get('/brand/:brand_id/:page/:category/:key', function(req, res){
      var brand_id = req.params.brand_id;
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
                       and a.brand_name = ?
                       and a.category_large between ? and ?
                       order by a.id desc
                   ) a
                   where a.num > ? and a.num <= ?
                   `;
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
                       and a.brand_name = ?
                       and a.category_middle between ? and ?
                       order by a.id desc
                   ) a
                   where a.num > ? and a.num <= ?
                   `;
      }

      let select_query = db.query(conn, sql, [brand_id,range, key, startidx,lastidx]);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          res.json(data);
        }
      })
    })
    //카테고리 관련
    router.get('/category', function(req,res){
      const sql = `select *
                  from luxury.productimg a, (select c.descript, c.minor_key, max(a.id) id
                  							from luxury.product a, luxury.code c
                  							where c.major_key = 2
                  							and a.category_large = c.minor_key
                  							group by c.descript, c.minor_key
                  							order by c.minor_key) b
                  where a.product_id = b.id`;
      let select_query = db.query(conn, sql);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          res.json(data);
        }
      })
    })
    //추천검색어 관련
    router.get('/recommend',function(req,res){
      const sql = `select CONCAT(b.descript," ",c.descript) recommend
                    from luxury.product a, luxury.code b, luxury.code c
                    where b.major_key = 7778
                    and c.major_key = 2
                    and c.minor_key != 0
                    and a.brand_name = b.minor_key
                    and a.category_large = c.minor_key
                    group by brand_name, category_large
                    union all
                    select descript recommend
                    from luxury.code
                    where major_key in (2,7778,11,21,31,41,51,61,71,121)
                    and minor_key != 0
                    union all
                    select CONCAT(b.descript," ",c.descript) recommend
                    from luxury.product a, luxury.code b, luxury.code c
                    where b.major_key = 7778
                    and c.major_key in (11,21,31,41,51,61,71,121)
                    and a.brand_name = b.minor_key
                    and a.category_middle = c.minor_key
                    group by brand_name, category_middle
                    order by rand() limit 10`;
      let select_query = db.query(conn, sql);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          res.json(data);
        }
      })
    })
    //상품 품절 사유 - 품절 신고 남발시 적중
    router.get('/randombrands', function(req, res){
      var sql =`select *
                from luxury.code
                where major_key in (7778)
                order by rand() limit 10`;
      let select_query = db.query(conn, sql);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          res.json(data);
        }
      })
    })
    router.get('/code', function(req,res){
      const sql = `select * from luxury.code
                   where major_key in (1,11,21,31,41,51,61,71,121,2,7778)
                   order by major_key desc`;
      let select_query = db.query(conn, sql);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          res.json(data);
        }
      })
    })
    //검색 알고리즘 -> 필터 및
    router.post('/word/:sex/:category/:page/:type/:filter/:brand', function(req,res){
      var brand_name = [];
      var category_large = [];
      var category_middle = [];
      var page = req.params.page;
      var brand = req.params.sex;
      var category = req.params.category;
      var type = req.params.type;
      var filter = req.params.filter;
      var brand = req.params.brand;
      var idx = parseInt(page);
      var startidx = idx * 20;
      var lastidx = (idx + 1) * 20;

      //검색 구분
      for(var i =0; i<req.body.wordcatch.length; i++){
         if(req.body.wordcatch[i].code == "brand_name"){
            brand_name.push(req.body.wordcatch[i].minor_key)
          }
         else if(req.body.wordcatch[i].code == "category_large"){
            category_large.push(req.body.wordcatch[i].minor_key)
          }
         else{
           category_middle.push(req.body.wordcatch[i].minor_key)
          }
      }
      //만약 카테고리가 있으면 초기화
      if(category != 0){
        category_middle = [];
        category_large = [];
        category_middle.push(category);
      }
      if(brand != 0){
        brand_name = [];
        brand_name.push(brand);
      }
      //대 카테고리
      if(type == 0){
        //최근순
        if(filter == 0){
          if(brand_name.length > 0 && category_large.length > 0 && category_middle.length > 0){
            const sql =`select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and brand_name in (?)
                          	and (category_large in (?) or category_middle in (?))
                            order by a.id desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name,category_large, category_middle,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(brand_name.length > 0 && category_large.length > 0 && category_middle.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and brand_name in (?)
                          	and category_large in (?)
                            order by a.id desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name,category_large,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(brand_name.length > 0 && category_middle.length > 0 && category_large.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and brand_name in (?)
                          	and category_middle in (?)
                            order by a.id desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name, category_middle,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(brand_name.length > 0 && category_large.length == 0 && category_middle.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and brand_name in (?)
                            order by a.id desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(category_large.length > 0 && brand_name.length == 0 && category_middle.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and category_large in (?)
                            order by a.id desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [category_large,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(category_middle.length > 0 && brand_name.length == 0 && category_large.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and category_middle in (?)
                            order by a.id desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [category_middle,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
        }
        else if(filter == 1){
          if(brand_name.length > 0 && category_large.length > 0 && category_middle.length > 0){
            const sql =`select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and brand_name in (?)
                          	and (category_large in (?) or category_middle in (?))
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name,category_large, category_middle,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(brand_name.length > 0 && category_large.length > 0 && category_middle.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and brand_name in (?)
                          	and category_large in (?)
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name,category_large,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(brand_name.length > 0 && category_middle.length > 0 && category_large.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and brand_name in (?)
                          	and category_middle in (?)
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name, category_middle,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(brand_name.length > 0 && category_large.length == 0 && category_middle.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and brand_name in (?)
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(category_large.length > 0 && brand_name.length == 0 && category_middle.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and category_large in (?)
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [category_large,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(category_middle.length > 0 && brand_name.length == 0 && category_large.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and category_middle in (?)
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [category_middle,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
        }
        else if(filter == 2){
          if(brand_name.length > 0 && category_large.length > 0 && category_middle.length > 0){
            const sql =`select id, category_large, category_middle, brand_name, name, sub_name,
                              size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                            select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                                   a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                            from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                            where a.id = b.product_id
                            and brand_name in (?)
                            and (category_large in (?) or category_middle in (?))
                            order by a.count desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name,category_large, category_middle,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(brand_name.length > 0 && category_large.length > 0 && category_middle.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                              size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                            select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                                   a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                            from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                            where a.id = b.product_id
                            and brand_name in (?)
                            and category_large in (?)
                            order by a.count desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name,category_large,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(brand_name.length > 0 && category_middle.length > 0 && category_large.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                              size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                            select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                                   a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                            from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                            where a.id = b.product_id
                            and brand_name in (?)
                            and category_middle in (?)
                            order by a.count desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name, category_middle,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(brand_name.length > 0 && category_large.length == 0 && category_middle.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                              size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                            select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                                   a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                            from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                            where a.id = b.product_id
                            and brand_name in (?)
                            order by a.count desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(category_large.length > 0 && brand_name.length == 0 && category_middle.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                              size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                            select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                                   a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                            from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                            where a.id = b.product_id
                            and category_large in (?)
                            order by a.count desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [category_large,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(category_middle.length > 0 && brand_name.length == 0 && category_large.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                              size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                            select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                                   a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                            from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                            where a.id = b.product_id
                            and category_middle in (?)
                            order by a.count desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [category_middle,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
        }
        //가격이 낮은 순
        else if(filter == 3){
          if(brand_name.length > 0 && category_large.length > 0 && category_middle.length > 0){
            const sql =`select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and brand_name in (?)
                          	and (category_large in (?) or category_middle in (?))
                            order by cast(substring(replace(replace(price,'만원',''), '~',''),1,4) as SIGNED)
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name,category_large, category_middle,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(brand_name.length > 0 && category_large.length > 0 && category_middle.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and brand_name in (?)
                          	and category_large in (?)
                            order by cast(substring(replace(replace(price,'만원',''), '~',''),1,4) as SIGNED)
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name,category_large,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(brand_name.length > 0 && category_middle.length > 0 && category_large.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and brand_name in (?)
                          	and category_middle in (?)
                            order by cast(substring(replace(replace(price,'만원',''), '~',''),1,4) as SIGNED)
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name, category_middle,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(brand_name.length > 0 && category_large.length == 0 && category_middle.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and brand_name in (?)
                            order by cast(substring(replace(replace(price,'만원',''), '~',''),1,4) as SIGNED)
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(category_large.length > 0 && brand_name.length == 0 && category_middle.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and category_large in (?)
                            order by cast(substring(replace(replace(price,'만원',''), '~',''),1,4) as SIGNED)
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [category_large,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(category_middle.length > 0 && brand_name.length == 0 && category_large.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and category_middle in (?)
                            order by cast(substring(replace(replace(price,'만원',''), '~',''),1,4) as SIGNED)
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [category_middle,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
        }
        //가격이 높은 순
        else if(filter == 4){
          if(brand_name.length > 0 && category_large.length > 0 && category_middle.length > 0){
            const sql =`select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and brand_name in (?)
                          	and (category_large in (?) or category_middle in (?))
                            order by cast(substring(replace(replace(price,'만원',''), '~',''),1,4) as SIGNED) desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name,category_large, category_middle,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(brand_name.length > 0 && category_large.length > 0 && category_middle.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and brand_name in (?)
                          	and category_large in (?)
                            order by cast(substring(replace(replace(price,'만원',''), '~',''),1,4) as SIGNED) desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name,category_large,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(brand_name.length > 0 && category_middle.length > 0 && category_large.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and brand_name in (?)
                          	and category_middle in (?)
                            order by cast(substring(replace(replace(price,'만원',''), '~',''),1,4) as SIGNED) desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name, category_middle,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(brand_name.length > 0 && category_large.length == 0 && category_middle.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and brand_name in (?)
                            order by cast(substring(replace(replace(price,'만원',''), '~',''),1,4) as SIGNED) desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [brand_name,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(category_large.length > 0 && brand_name.length == 0 && category_middle.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and category_large in (?)
                            order by cast(substring(replace(replace(price,'만원',''), '~',''),1,4) as SIGNED) desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [category_large,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
          if(category_middle.length > 0 && brand_name.length == 0 && category_large.length == 0){
            const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
                          		size, color, star, count, reg_dttm, upd_dttm, url,price
                          from (
                          	select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                          	       a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                          	from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                          	where a.id = b.product_id
                          	and category_middle in (?)
                            order by cast(substring(replace(replace(price,'만원',''), '~',''),1,4) as SIGNED) desc
                          ) a
                          where a.num > ? and a.num <= ?`;
            let select_query = db.query(conn, sql, [category_middle,startidx,lastidx]);
            select_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                res.json(data);
              }
            })
          }
        }
      }
    })

    //검색 알고리즘
    router.post('/wordcnt/:category/:brand', function(req,res){
      var brand_name = [];
      var category_large = [];
      var category_middle = [];
      var category = req.params.category;
      var brand = req.params.brand;

      for(var i =0; i<req.body.wordcatch.length; i++){
         if(req.body.wordcatch[i].code == "brand_name"){
            brand_name.push(req.body.wordcatch[i].minor_key)
          }
         else if(req.body.wordcatch[i].code == "category_large"){
            category_large.push(req.body.wordcatch[i].minor_key)
          }
         else{
            category_middle.push(req.body.wordcatch[i].minor_key)
          }
      }

      if(category != 0){
        category_middle = [];
        category_large = [];
        category_middle.push(category);
      }
      if(brand != 0){
        brand_name = [];
        brand_name.push(brand);
      }
      if(brand_name.length > 0 && category_large.length > 0 && category_middle.length > 0){
        const sql =`select count(*) cnt
                    from luxury.product a, luxury.productimg b
                    where a.id = b.product_id
                    and brand_name in (?)
                    and (category_large in (?) or category_middle in (?))`;
        let select_query = db.query(conn, sql, [brand_name,category_large, category_middle]);
        select_query.then((data)=>{
          if(!data){
            res.json(500)
          } else {
            res.json(data);
          }
        })
      }
      if(brand_name.length > 0 && category_large.length > 0 && category_middle.length == 0){
        const sql = `select count(*) cnt
                      from luxury.product a, luxury.productimg b
                      where a.id = b.product_id
                      and brand_name in (?)
                      and category_large in (?)`;
        let select_query = db.query(conn, sql, [brand_name,category_large]);
        select_query.then((data)=>{
          if(!data){
            res.json(500)
          } else {
            res.json(data);
          }
        })
      }
      if(brand_name.length > 0 && category_middle.length > 0 && category_large.length == 0){
        const sql = `select count(*) cnt
                      from luxury.product a, luxury.productimg b
                      where a.id = b.product_id
                      and brand_name in (?)
                      and category_middle in (?)`;
        let select_query = db.query(conn, sql, [brand_name, category_middle]);
        select_query.then((data)=>{
          if(!data){
            res.json(500)
          } else {
            res.json(data);
          }
        })
      }
      if(brand_name.length > 0 && category_large.length == 0 && category_middle.length == 0){
        const sql = `select count(*) cnt
                      from luxury.product a, luxury.productimg b
                      where a.id = b.product_id
                      and brand_name in (?)`;
        let select_query = db.query(conn, sql, [brand_name]);
        select_query.then((data)=>{
          if(!data){
            res.json(500)
          } else {
            res.json(data);
          }
        })
      }
      if(category_large.length > 0 && brand_name.length == 0 && category_middle.length == 0){
        const sql = `select count(*) cnt
                      from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                      where a.id = b.product_id
                      and category_large in (?)`;
        let select_query = db.query(conn, sql, [category_large]);
        select_query.then((data)=>{
          if(!data){
            res.json(500)
          } else {
            res.json(data);
          }
        })
      }
      if(category_middle.length > 0 && brand_name.length == 0 && category_large.length == 0){
        const sql = `select count(*) cnt
                      from luxury.product a, luxury.productimg b
                      where a.id = b.product_id
                      and category_middle in (?)`;
        let select_query = db.query(conn, sql, [category_middle]);
        select_query.then((data)=>{
          if(!data){
            res.json(500)
          } else {
            res.json(data);
          }
        })
      }
    })

    //검색창에서 상품을 검색
    router.get('/product/:word/:page',function(req, res){
      let word = req.params.word;
      let page = req.params.page;
      var idx = parseInt(page);
      var startidx = idx * 20;
      var lastidx = (idx + 1) * 20;
      if(word == undefined){
        word = '%%';
      } else {
        word = '%' + word + '%';
      }

      const sql = `select id, category_large, category_middle, brand_name, name, sub_name,
		                      size, color, star, count, reg_dttm, upd_dttm, url,price
                  from (
                  	select @rownum:=@rownum+1 num, id, category_large, category_middle, brand_name, name, sub_name,
                  		size, color, star, count, reg_dttm, upd_dttm, url,price
                  	from (
                  		select a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                  		                          a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                  		                  from luxury.product a, luxury.productimg b
                  		                  where a.id = b.product_id
                  		                  and a.brand_name in (select minor_key
                  		                  					   from luxury.code
                  		                  					   where major_key in (1,7778)
                  		                 					   and descript like ?)
                  		UNION
                  		select a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                  		                          a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                  		                  from luxury.product a, luxury.productimg b
                  		                  where a.id = b.product_id
                  		                  and a.name like ?
                  		UNION
                  		select a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                  		                          a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                  		                  from luxury.product a, luxury.productimg b
                  		                  where a.id = b.product_id
                  		                  and a.category_large in (select minor_key
                  		                  					   from luxury.code
                  		                  					   where major_key = 2
                  		                 					   and descript like ?)
                  		UNION
                  		select a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                  		                          a.size, a.color, a.price, a.star, a.count, a.reg_dttm,  a.upd_dttm, b.url
                  		                  from luxury.product a, luxury.productimg b
                  		                  where a.id = b.product_id
                  		                  and a.category_middle in (select minor_key
                  		                  					   from luxury.code
                  		                  					   where major_key in (11,21,31,41,51,61,71,121)
                  		                 					   and descript like ?)
                  	) a, (select @rownum := 0) c
                    order by a.id desc
                  ) a
                  where a.num > ? and a.num <= ?

      `;
      let select_query = db.query(conn, sql, [word,word,word,word,startidx,lastidx]);
      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else {
          res.json(data);
        }
      })
    })

    return router;
}
