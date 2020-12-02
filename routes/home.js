module.exports = function(conn){
  const express = require('express');
  const db = require('../module/db_query');
  const router = express.Router();

  router.get('/brandproduct/:brand/:category/:page/:type/:sex/:filter',function(req, res){
    var brand = req.params.brand;
    var page = req.params.page;
    var category = req.params.category;
    var type = req.params.type;
    var sex = req.params.sex;
    var filter = req.params.filter;
    var sex_type = '';

    var idx = parseInt(page);
    var startidx = idx * 20;
    var lastidx = (idx + 1) * 20;
    var sql = ``;

    var range = 11;

    //전체일때
    if(category != 50){
      range = category;
    }
    //대카테고리
    if(type == 0){
      //여자
      if(sex == 0){
        sex_type = '%여성%'
      }//남자
      else {
        sex_type = '%남성%'
      }
      //filter 0 최신순
      if(filter == 0){
        sql = `select a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                           a.size, a.color, a.price, a.url
                     from
                     (
                       select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle,
                               a.brand_name, a.name, a.sub_name, a.size, a.color, a.price, b.url
                        from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                        where a.id = b.product_id
                        and a.brand_name = ?
                        and a.category_middle in (select minor_key
                                from luxury.code
                                where major_key between ? and ?
                                and descript like ?
                                union all
                                select minor_key
                                from luxury.code
                                where major_key between ? and ?
                                and minor_key in (13,14,45)
                                order by 1)
                        order by a.id desc
                     ) a
                     where a.num > ?  and a.num <= ?`
      }
      //filter 1 예전순
      else if (filter == 1) {
        sql = `select a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                           a.size, a.color, a.price, a.url
                     from
                     (
                       select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle,
                               a.brand_name, a.name, a.sub_name, a.size, a.color, a.price, b.url
                        from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                        where a.id = b.product_id
                        and a.brand_name = ?
                        and a.category_middle in (select minor_key
                                from luxury.code
                                where major_key between ? and ?
                                and descript like ?
                                union all
                                select minor_key
                                from luxury.code
                                where major_key between ? and ?
                                and minor_key in (13,14,45)
                                order by 1)
                     ) a
                     where a.num > ?  and a.num <= ?`

      } //filter 2 인기순
      else if(filter == 2){
        //나중에 하트 개발되면 시작
        sql = `select a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                           a.size, a.color, a.price, a.url
                     from
                     (
                       select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle,
                               a.brand_name, a.name, a.sub_name, a.size, a.color, a.price, b.url
                        from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                        where a.id = b.product_id
                        and a.brand_name = ?
                        and a.category_middle in (select minor_key
                                from luxury.code
                                where major_key between ? and ?
                                and descript like ?
                                union all
                                select minor_key
                                from luxury.code
                                where major_key between ? and ?
                                and minor_key in (13,14,45)
                                order by 1)
                        order by a.count desc
                     ) a
                     where a.num > ?  and a.num <= ?`
      } //filter 3 가격 낮은 순
      else if(filter == 3){
        sql = `select a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                           a.size, a.color, a.price, a.url
                     from
                     (
                       select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle,
                               a.brand_name, a.name, a.sub_name, a.size, a.color, a.price, b.url
                        from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                        where a.id = b.product_id
                        and a.brand_name = ?
                        and a.category_middle in (select minor_key
                                from luxury.code
                                where major_key between ? and ?
                                and descript like ?
                                union all
                                select minor_key
                                from luxury.code
                                where major_key between ? and ?
                                and minor_key in (13,14,45)
                                order by 1)
                        order by cast(substring(replace(replace(price,'만원',''), '~',''),1,4) as SIGNED)
                     ) a
                     where a.num > ?  and a.num <= ?`
      }
      // filter 4 가격 높은 순
      else if(filter == 4){
        sql = `select a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                           a.size, a.color, a.price, a.url
                     from
                     (
                       select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle,
                               a.brand_name, a.name, a.sub_name, a.size, a.color, a.price, b.url
                        from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                        where a.id = b.product_id
                        and a.brand_name = ?
                        and a.category_middle in (select minor_key
                                from luxury.code
                                where major_key between ? and ?
                                and descript like ?
                                union all
                                select minor_key
                                from luxury.code
                                where major_key between ? and ?
                                and minor_key in (13,14,45)
                                order by 1)
                        order by cast(substring(replace(replace(price,'만원',''), '~',''),1,4) as SIGNED) desc
                     ) a
                     where a.num > ?  and a.num <= ?`

      }
      let select_query = db.query(conn, sql, [brand,range,category,sex_type,range,category, startidx, lastidx]);
      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else {
          res.json(data);
        }
      })

    }
    //중카테고리 세팅
    else {
      //filter 0 최신순
      if(filter == 0){
        sql = `select a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                           a.size, a.color, a.price, a.url
                     from
                     (
                       select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle,
                               a.brand_name, a.name, a.sub_name, a.size, a.color, a.price, b.url
                        from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                        where a.id = b.product_id
                        and a.brand_name = ?
                        and a.category_middle between ? and ?
                        order by a.id desc
                     ) a
                     where a.num > ?  and a.num <= ?`;
      }
      // filter 1 예전순
      else if(filter == 1){
        sql = `select a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                           a.size, a.color, a.price, a.url
                     from
                     (
                       select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle,
                               a.brand_name, a.name, a.sub_name, a.size, a.color, a.price, b.url
                        from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                        where a.id = b.product_id
                        and a.brand_name = ?
                        and a.category_middle between ? and ?
                     ) a
                     where a.num > ?  and a.num <= ?`;
      }
      // filter 2 인기순 하트 만들어지면 그때 개발
      else if(filter == 2){
        sql = `select a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                           a.size, a.color, a.price, a.url
                     from
                     (
                       select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle,
                               a.brand_name, a.name, a.sub_name, a.size, a.color, a.price, b.url
                        from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                        where a.id = b.product_id
                        and a.brand_name = ?
                        and a.category_middle between ? and ?
                        order by a.count desc
                     ) a
                     where a.num > ?  and a.num <= ?`;
      }
      // filter 3 가격 낮은순
      else if(filter == 3){
        sql = `select a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                           a.size, a.color, a.price, a.url
                     from
                     (
                       select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle,
                               a.brand_name, a.name, a.sub_name, a.size, a.color, a.price, b.url
                        from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                        where a.id = b.product_id
                        and a.brand_name = ?
                        and a.category_middle between ? and ?
                        order by cast(substring(replace(replace(price,'만원',''), '~',''),1,4) as SIGNED)
                     ) a
                     where a.num > ?  and a.num <= ?`;
      } else if(filter == 4){
        sql = `select a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                           a.size, a.color, a.price, a.url
                     from
                     (
                       select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle,
                               a.brand_name, a.name, a.sub_name, a.size, a.color, a.price, b.url
                        from luxury.product a, luxury.productimg b, (select @rownum := 0) c
                        where a.id = b.product_id
                        and a.brand_name = ?
                        and a.category_middle between ? and ?
                        order by cast(substring(replace(replace(price,'만원',''), '~',''),1,4) as SIGNED) desc
                     ) a
                     where a.num > ?  and a.num <= ?`;
      }

     let select_query = db.query(conn, sql, [brand,range,category, startidx, lastidx]);
     select_query.then((data)=>{
       if(!data){
         res.json(500)
       } else {
         res.json(data);
       }
     })
    }

  })

  /* 중카테고리 두개 setting */
  router.get('/categoryproduct/:middlecategory',function(req, res){
    const middlecategory = req.params.middlecategory;

    const sql = `select *
                 from luxury.product a, luxury.productimg b
                 where a.id = b.product_id
                 and a.category_middle = ?
                 order by rand() limit 15`;
    let select_query = db.query(conn, sql, middlecategory);
    select_query.then((data)=>{
      if(!data){
        res.json(500)
      } else {
        res.json(data);
      }
    })
  })
  /*총 상품 개수*/
  router.get('/hereluxcnt', function(req, res){
    const sql = `select count(*) cnt
                 from luxury.product
                  union all
                 select count(*) cnt
                  from luxury.code
                  where major_key = 1`;
     let select_query = db.query(conn, sql);
     select_query.then((data)=>{
       if(!data){
         res.json(500);
       } else {
         res.json(data);
       }
     })
  });
  /* herrelux 총 상품 랜덤 데이터 기준*/
  router.get('/productrandom', function(req, res){
    const sql = `select *
                 from luxury.product a, luxury.productimg b
                 where a.id = b.product_id
                 order by rand() limit 15`;
     let select_query = db.query(conn, sql);
     select_query.then((data)=>{
       if(!data){
         res.json(500);
       } else {
         res.json(data);
       }
     })
  });
  /*랜덤 브랜드 기준*/
  router.get('/brandrandom/:id', function(req, res){
    let id  = req.params.id;

    const sql = `select *
                  from luxury.code
                  where major_key = 1
                  and minor_key = ?`;
     let select_query = db.query(conn, sql, [id]);
     select_query.then((data)=>{
       if(!data){
         res.json(500);
       } else {
         res.json(data);
       }
     })
  });
  /*랜덤 브랜드 기준*/
  router.get('/brandfetch/:id', function(req, res){
    let id  = req.params.id;

    const sql = `select *
                 from luxury.product a, luxury.productimg b
                 where a.id = b.product_id
                 and a.brand_name = ?
                 order by rand() limit 15`;
     let select_query = db.query(conn, sql, [id]);
     select_query.then((data)=>{
       if(!data){
         res.json(500);
       } else {
         res.json(data);
       }
     })
  });
  /*랜덤카테고리 set 개수*/
  router.get('/eventproduct/:event_id', function(req, res){
    var event_id = req.params.event_id;

    const sql = `select *
                 from luxury.productmarketing
                 where event_id = ?`;
     let select_query = db.query(conn, sql, event_id);
     select_query.then((data)=>{
       if(!data){
         res.json(500);
       } else {
         res.json(data);
       }
     })
  });
  /*랜덤카테고리 set 개수*/
  router.get('/category', function(req, res){
    const sql = `select *
                 from luxury.code
                 where major_key = 2
                 and minor_key != 0
                 order by rand() limit 3`;
     let select_query = db.query(conn, sql);
     select_query.then((data)=>{
       if(!data){
         res.json(500);
       } else {
         res.json(data);
       }
     })
  });
  /*랜덤카테고리 set 개수*/
  router.get('/categoryfetch/:id', function(req, res){
    let id  = req.params.id;

    const sql = `select *
                 from (
  	                select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
  	               		 a.size, a.color, a.price, round(a.star/a.count,2) avg, b.url
  	                from luxury.product a, luxury.productimg b, (select @rownum := 0) c
  	                where a.category_large = ?
  	                and a.id = b.product_id
  	                order by round(a.star/a.count,2) desc
                 ) a
                 where a.num > 0 and a.num <= 3`;
     let select_query = db.query(conn, sql, [id]);
     select_query.then((data)=>{
       if(!data){
         res.json(500);
       } else {
         res.json(data);
       }
     })
  });

  /*신상품 set 개수*/
  router.get('/newproduct', function(req, res){
    const sql = `select *
                  from (
                  select @rownum:=@rownum+1 num, a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                                    	               		 a.size, a.color, a.price, a.avg, a.url
                                  from (
                                  select a.id, a.category_large, a.category_middle, a.brand_name, a.name, a.sub_name,
                                    	               		 a.size, a.color, a.price, round(a.star/a.count,2) avg, b.url
                                                   from luxury.product a, luxury.productimg b
                                                   where a.id = b.product_id
                                                  order by a.reg_dttm desc
                                        ) a, (select @rownum := 0) c
                  ) a
                  where a.num > 0 and a.num <= 15`;
     let select_query = db.query(conn, sql);
     select_query.then((data)=>{
       if(!data){
         res.json(500);
       } else {
         res.json(data);
       }
     })
  });
  /* Event set 개수*/
  router.get('/eventday', function(req, res){
    const sql = `select *
          			 from luxury.marketing a, (select brands_name, max(brand_event_id) brand_event_id
                       from luxury.marketing
            			 group by brands_name) b, luxury.user c
          			 where a.brands_name = b.brands_name
          			 and a.brand_event_id = b.brand_event_id
          			 and a.brands_name = c.brands_name
                 and a.brands_name != 'HERELUX'
          			 order by rand()`;
     let select_query = db.query(conn, sql);
     select_query.then((data)=>{
       if(!data){
         res.json(500);
       } else {
         res.json(data);
       }
     })
  });
  return router;
}
