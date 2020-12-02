module.exports = function(conn){
    const express = require('express');
    const router = express.Router();  //router하는 객체를 추출
    const db = require('../module/db_query');
    const multer = require("multer");
    const multerS3 = require('multer-s3-transform');
    const moment  = require("moment");
    const sharp = require('sharp');
    const validate = require('../module/validate');
    const date = require('../module/date');
    /* AWS 이미지 처리 부분 */
    const AWS = require("aws-sdk");
    AWS.config.region = 'ap-northeast-2';

    var imgname="";
    var brands_name="";
    const maxSize = 2 * 1024 * 1024;

    //bucket name 운영
    const bucketname  = 'hereluxurytalk';
    //bucket name 개발
    //const bucketname  = 'luxuryboard';
    let s3 = new AWS.S3({params: {Bucket:bucketname}});

    //이미지 업로드 필드 두개
    var upload = multer({
      storage: multerS3({
         s3: s3,
         dirname: '/' + brands_name,
         bucket: bucketname,
         cacheControl: 'max-age=31536000',
         acl: 'public-read-write',
         limits: {
            fileSize: maxSize,
            files: 2
         },
         ContentType:'',
         storageClass: 'REDUCED_REDUNDANCY',
         shouldTransform: function (req, file, cb) {
             cb(null, /^image/i.test(file.mimetype))
         },
         transforms: [{
               key: function (req, file, cb) {
                   //let extension = path.extname(file.originalname);
                   //imgname = file.originalname;
                   imgname = moment().format("YYYY-MM-DD") + moment().hours() + "-"  + moment().minute() + "-"  + file.originalname;
                   //console.log("imgname: " + imgname);
                   cb(null, imgname);
               },
               transform: function(req, file, cb) {
                 //Perform desired transformations
                 cb(null, sharp()
                          .jpeg({ quality: 60, force: false })
                          .png({ compressionLevel: 9, force: false })
                          );
               }
         }]
       })
     });

    router.get('/nickname/:talk_id/:user_id', function(req,res){
      let talk_id = req.params.talk_id;
      let user_id = req.params.user_id;

      const sql = `select name
                   from luxury.producttalk
                   where talk_id = ?
                   and userid = ?
                   union
                   select name
                   from luxury.producttalkcomment
                   where talk_id = ?
                   and user_id = ?`;

      let select_query = db.query(conn, sql, [talk_id, user_id, talk_id, user_id])
      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else {
          res.json(data)
        }
      })
    })


    router.post('/write', upload.fields([{name:"image_1"}]),function(req,res){
      let imgFile = req.files;
      let product_name = req.body.product_name;
      let nickname = req.body.name;

      let product_id = req.body.product_id;
      let brand_name = req.body.brand_name;
      let category_large = req.body.category_large_name;
      let category_middle = req.body.category_middle_name;
      let userid = req.body.userid;
      let descript = req.body.descript;

      //자바스크립트 날짜 시간 set
      let reg_date = moment().format("YYYY-MM-DD");
      let reg_time = date.time();
      let datetime = reg_date + " " + reg_time;

      //imagurl에 대한 max값 set
      const sql_idx = `select max(talk_id) talk_id from luxury.producttalk`;
      let select_query  = db.query(conn, sql_idx);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          //동기쿼리 부분처리
          const asyncsql = async()=> {
            try{
              let talk_id = data[0].talk_id + 1;
              let return_flag = false;
              const sql_nickname = `select concat(a.descript, b.descript) nickname
                                    from
                                    (
                                        select *
                                        from luxury.code
                                        where major_key = 7777
                                        order by rand() limit 1
                                    ) a,
                                    (
                                        select *
                                        from luxury.code
                                        where major_key = 7778
                                        order by rand() limit 1
                                    ) b`;
              let nickname_query = await db.query(conn, sql_nickname);
              if(nickname_query){
                if(nickname == ""){
                  nickname  = nickname_query[0].nickname;
                }
                const sql_insert = `Insert into luxury.producttalk(talk_id,product_id,userid,name,product_name,brand_name,category_large,category_middle,descript,talk_like,upd_dttm,reg_dttm)
                             values (?,?,?,?,?,?,?,?,?,?,?,?)`;
                let insert_query = await db.query(conn, sql_insert, [talk_id,product_id,userid,nickname,product_name,brand_name,category_large,category_middle,descript,0,datetime,datetime]);
                if(insert_query){
                  if(imgFile.image_1 == null){
                    return true;
                  }
                  const sql_img = `Insert into luxury.producttalkimg(talk_id, seq, userid, url, reg_dttm, upd_dttm)
                                   values (?,?,?,?,?,?)`;
                   let values_2 = [];

                   let i = 0 ;

                   //이미지 두개로 set
                   if(imgFile.image_1 != null ){
                     let imgValues = [];
                     imgValues.push(talk_id)
                     imgValues.push(i)
                     imgValues.push(userid)
                     imgValues.push(imgFile.image_1[0].transforms[0].location)
                     imgValues.push(datetime)
                     imgValues.push(datetime)

                     i++;
                     values_2.push(imgValues)
                   }
                   for(var k = 0; k < values_2.length; k++){
                     let insert_img = await db.query(conn, sql_img, values_2[k]);
                     if(insert_img){
                       return_flag = true;
                     }
                   }
                }
              }
            } catch {
              return false;
            }
          }
          //동기 쿼리 실행
          let asyncresult = asyncsql();
          asyncresult.then((row)=>{
             if(row){
               res.json(200)
             } else {
               res.json(500)
             }
          });
        }
      })
    });
    router.get('/talkid/:product_id',function(req,res){
      let product_id = req.params.product_id;

      if(product_id > 0){
        const sql_id = `select name
                        from luxury.producttalk
                        where product_id = ?`;
        let select_query = db.query(conn, sql_id, [product_id]);
        select_query.then((data)=>{
          if(!data){
            res.json(500);
          } else {
            res.json(data);
          }
        })
      }
    })
    router.get('/list/:product_id/:product_name/:brand_name/:category_large/:category_middle', function(req, res){
      let product_name = req.params.product_name
      let brand_name = req.params.brand_name
      let category_large = req.params.category_large
      let category_middle = req.params.category_middle
      let product_id = req.params.product_id

      let sql_descript = ``;

      if(product_id > 0){
        const sql_all = `select a.*, b.url img_url
                                               from luxury.producttalk a left outer join luxury.producttalkimg b
                                               on a.talk_id = b.talk_id
                                               where a.product_id = ?
                                               order by reg_dttm desc`
         let select_query = db.query(conn, sql_all, [product_id, product_id]);
         select_query.then((data)=>{
           if(!data){
             res.json(500);
           } else {
             res.json(data);
           }
         })
      }
      else {
        /*
        let sql_descript = `select *
                            from (select a.*, b.url img_url
                                                 from luxury.producttalk a left outer join luxury.producttalkimg b
                                                 on a.talk_id = b.talk_id) a, (select a.product_id, count(b.comment_id) comment_id
                            from luxury.producttalk a left outer join luxury.producttalkcomment b
                            on a.talk_id = b.talk_id
                            group by a.product_id, b.comment_id) b
                            where a.product_id = b.product_id`

        let query_arry = new Array();

        if(product_name != null){
          sql_descript = sql_descript + `and a.product_name = ?`
          query_arry.push(product_name);
        } else if (brand_name != null){
          sql_descript = sql_descript + ` and a.brand_name = ?`
          query_arry.push(brand_name);
        } else if (category_large != null){
          sql_descript = sql_descript + ` and a.category_large = ?`
          query_arry.push(category_large);
        } else if (category_middle != null){
          sql_descript = sql_descript + ` and a.category_middle = ?`
          query_arry.push(category_middle);
        }

        sql_descript = sql_descript + `order by reg_dttm desc`

        console.log(query_arry);

         let select_query = db.query(conn, sql_descript, query_arry);
         select_query.then((data)=>{
           if(!data){
             res.json(500);
           } else {
             res.json(data);
           }
         })
        */
      }

    });
    router.get('/likelist/:talk_id/:user_id/:product_id', function(req,res){
      let product_id = req.params.product_id;
      let talk_id = req.params.talk_id;
      let user_id = req.params.user_id;

      const select_sql = `select count(*) cnt
                          from luxury.producttalklike
                          where product_id = ?
                          and talk_id = ?
                          and user_id = ?
                          and comment_id = 0`;
                          
      let select_query = db.query(conn, select_sql, [product_id, talk_id, user_id]);
      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else{
          res.json(data);
        }
      })
    })
    router.get('/like/:talk_id/:user_id/:product_id', function(req,res){
      let talk_id = req.params.talk_id;
      let product_id = req.params.product_id;
      let user_id = req.params.user_id;

      //내가 이미 좋아요 누른건지 체크확인
      const select_sql = `select count(*) cnt
                          from luxury.producttalklike
                          where product_id = ?
                          and talk_id = ?
                          and user_id = ?
                          and comment_id = 0`;
      //자바스크립트 날짜 시간 set
      let reg_date = moment().format("YYYY-MM-DD");
      let reg_time = date.time();
      let datetime = reg_date + " " + reg_time;

      let select_query = db.query(conn, select_sql, [product_id, talk_id, user_id]);
      select_query.then((data)=>{
        if(!data){
          res.json(500)
        } else {
          if(data[0].cnt == 0){
            const insert_sql = `insert into luxury.producttalklike(product_id, talk_id, comment_id, user_id, upd_dttm, reg_dttm) values (?,?,?,?,?,?)`
            //좋아요는 계속 누를 수 있도록 일단 설정
            const update_sql = `update luxury.producttalk set talk_like = talk_like + 1 where talk_id = ?`;
            let insert_query = db.query(conn, insert_sql, [product_id, talk_id, 0, user_id, datetime, datetime])
            insert_query.then((data)=>{
              if(!data){
                res.json(500)
              } else {
                let update_query = db.query(conn, update_sql, [talk_id]);
                update_query.then((data)=>{
                  if(!data){
                    res.json(500)
                  } else {
                    res.json(200)
                  }
                })
              }
            })
          } else {
            res.json(300)
          }
        }
      })



    })
    //board 게시판 삭제
    router.get('/delete/:talk_id',function(req,res){
      //게시판 및 댓글 삭제
      //사진삭제
      let talk_id = req.params.talk_id;
      var imgName = '';
      //삭제할 이미지를 먼저 select 한다.
      const sql = `select url from luxury.producttalkimg where talk_id = ?`;
      let select_query = db.query(conn, sql, [talk_id]);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        }
        else {
          //두개 이미지 삭제
          for(var i = 0; i < data.length; i++) {
            if( data[i].imgurl != null ){
                imgName =  data[i].url.split('/');
                var params = {
                    Bucket: bucketname,
                    Key: imgName[3]
                };

                s3.deleteObject(params, function(err, data){
                  if(err){
                      console.log('s3.deleteObject err: ' + err);
                      res.json(500);
                      throw err;
                  }
                });
            }
          }
          const asyncsql = async()=>{
            let talk_sql = `delete from luxury.producttalk where talk_id = ?;`;
            let talkimg_sql = `delete from luxury.producttalkimg where talk_id = ?;`;
            let talkcomment_sql = `delete from luxury.producttalkcomment where talk_id = ?;`;
            let talkcommentlike_sql = `delete from luxury.producttalklike where talk_id = ?;`;
            try {
              let talk_query  = await db.query(conn, talk_sql, talk_id);
              let talkimg_query = await db.query(conn, talkimg_sql, talk_id);
              let talkcomment_query = await db.query(conn, talkcomment_sql, talk_id);
              let talkcommentlike_query = await db.query(conn, talkcommentlike_sql, talk_id)
              return true;
            } catch {
              return  false;
            }
          }
          let asyncresult = asyncsql();
          asyncresult.then((row)=>{
             if(row){
               res.json(200)
             } else {
               res.json(500)
             }
          });
        }
      })
    })
    return router;

}
