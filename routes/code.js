module.exports = function(conn){
    const express = require('express');
    const db = require('../module/db_query');
    const router = express.Router();  //router하는 객체를 추출

    //중 카테고리 settting
    router.get('/middlecategory/:sex/:key', function(req,res){
      const sex = req.params.sex;
      const key = req.params.key;
      let sql = ``;
      if(sex == 0){
        sql = `select *
                from luxury.code
                where major_key = ?
                and descript like '%여성%'
                union all
                select *
                from luxury.code
                where major_key = ?
                and minor_key in (13,14,45)
                order by rand() limit 1`
      } else {
        sql  =  `select *
                from luxury.code
                where major_key = ?
                and descript like '%남성%'
                union all
                select *
                from luxury.code
                where major_key = ?
                and minor_key in (13,14,45)
                order by rand() limit 1`
      }
     let select_query = db.query(conn, sql, [key, key]);
     select_query.then((data)=>{
       if(!data){
         res.json(500);
       } else {
         res.json(data);
       }
     })
    })
    //카테고리 set
    router.get('/:category', function(req, res){
      const category = req.params.category;

      var sql =`select major_key, minor_key, descript, sub_descript
                  from luxury.code
                  where major_key = ?
                  and minor_key > -1`;
      //category가 전체일때 부 카테고리 조회 (상품조회 시)
      if(category == 99){
        sql = `select major_key, minor_key, descript, sub_descript
                    from luxury.code
                    where major_key between 11 and ?
                    and minor_key > -1`;
      }
      let select_query = db.query(conn, sql, category);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          res.json(data);
        }
      })
    })
    // home 브랜드 남 녀
    router.get('/brandsex/:category/:sex', function(req, res){
      const category = req.params.category;
      const sex = req.params.sex;
      var sql = ``;
      var range = 11;

      //전체일때
      if(category != 50){
        range = category;
      }

      if(sex == 0){
        sql =` select *
                from luxury.code
                where major_key between ? and ?
                and descript like '%여성%'
                union all
                select *
                from luxury.code
                where major_key between ? and ?
                and minor_key in (13,14,45)
                order by 1`
      } else {
        sql = `select *
                from luxury.code
                where major_key between ? and ?
                and descript like '%남성%'
                union all
                select *
                from luxury.code
                where major_key between ? and ?
                and minor_key in (13,14,45)
                order by 1`
      }

      let select_query = db.query(conn, sql, [range,category,range,category]);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          res.json(data);
        }
      })
    })
    // home 브랜드 남 녀
    router.post('/searchcode/:sex', function(req, res){
      //대카테고리만 체크
      var category_large = req.body.category_large;
      var sex = req.params.sex;
      var sql = ``;
      var range = 0;
      //category_large 가 없을경우
      //전체
      if(sex == 0){
        //만약 대 카테고리가 없을 경우에는
        sql =`select *
                from luxury.code
                where major_key in (?)
                and descript like '%여성%'
                order by 1`
      } else if(sex == 1){
        sql = `select *
                from luxury.code
                where major_key in (?)
                and descript like '%남성%'
                order by 1`
      } else {
        sql = `select *
               from luxury.code
               where major_key in (?)
               order by 1`
      }
      let select_query = db.query(conn, sql, [category_large]);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          res.json(data);
        }
      })
    })
    //브랜드 리스트
    router.get('/forum/:major_key', function(req, res){
      const major_key = req.params.major_key;

      var sql =`select major_key, minor_key, descript, sub_descript
                  from luxury.code
                  where major_key = ?
                  and minor_key > -1`;
      let select_query = db.query(conn, sql, major_key);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          res.json(data);
        }
      })
    })

    //브랜드 리스트
    router.get('/homebrand/:major_key', function(req, res){
      const major_key = req.params.major_key;

      var sql =`select major_key, minor_key, descript, sub_descript
                  from luxury.code
                  where major_key = ?
                  and minor_key > -1
                  and home_yn = 'Y'
                  order by rand()`;
      let select_query = db.query(conn, sql, major_key);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          res.json(data);
        }
      })
    })
    //브랜드네임
    router.get('/brand/:minor_key', function(req, res){
      const minor_key = req.params.minor_key;

      var sql =`select major_key, minor_key, descript, sub_descript
                  from luxury.code
                  where major_key = 1
                  and minor_key > -1
                  and minor_key = ?`;
      let select_query = db.query(conn, sql, minor_key);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          res.json(data);
        }
      })
    })
    //상품 품절 사유 - 품절 신고 남발시 적중
    router.get('/reason/:major_key', function(req, res){
      const major_key = req.params.major_key;

      var sql =`select major_key, minor_key, descript, sub_descript
                  from luxury.code
                  where major_key = ?`;
      let select_query = db.query(conn, sql, major_key);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          res.json(data);
        }
      })
    })

    //상품 품절 사유 - 품절 신고 남발시 적중
    router.get('/filter/:major_key', function(req, res){
      const major_key = req.params.major_key;

      var sql =`select major_key, minor_key, descript, sub_descript
                  from luxury.code
                  where major_key = ?`;
      let select_query = db.query(conn, sql, major_key);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          res.json(data);
        }
      })
    })
    //상품 품절 사유 - 품절 신고 남발시 적중
    router.post('/search', function(req, res){

      var sql =`select *
                from luxury.code
                where major_key in (1,2,11,21,31,41,51,61,71,121,7778)`;
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
    router.post('/searchbrands', function(req, res){

      var sql =`select *
                from luxury.code
                where major_key in (7778)`;
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
