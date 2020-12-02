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

  //comment insert 리스트 조회 (닉네임이 잇을경우 없으면 랜덤으로 set)
  router.post('/write', upload.fields([{name:"image_1"}]),function(req, res){
    let talk_id = req.body.talk_id;
    let user_id = req.body.user_id;
    let descript = req.body.descript;
    let nickname = req.body.name;

    //자바스크립트 날짜 시간 set
    let reg_date = moment().format("YYYY-MM-DD");
    let reg_time = date.time();
    let datetime = reg_date + " " + reg_time;

    //check_flag 내글인지 확인 시
    let check_flag  = 0;
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
    let nickname_query = db.query(conn, sql_nickname);
    nickname_query.then((data)=>{
      if(!data){
        res.json(500);
      } else {
        //닉네임이 없으면 랜덤으로 부여
        if(!nickname){
          nickname = data[0].nickname;
        }
        const asyncsql = async()=>{
          //comment_id 다시 체크
          const commentid_sql = `select max(comment_id) comment_id
                                 from luxury.producttalkcomment
                                 where talk_id = ?`
          const insert_sql = `Insert into luxury.producttalkcomment(talk_id, comment_id, user_id, name, descript, talkcomment_like, reg_dttm, upd_dttm)
                              values (?,?,?,?,?,?,?,?)`;

          try{
            let comment_sql  = await db.query(conn, commentid_sql, talk_id);
            let comment_id = 0;
            if(comment_sql.length > 0){
              comment_id = comment_sql[0].comment_id + 1;
            } else {
              comment_id = 1;
            }
            let insert_result = await db.query(conn, insert_sql, [talk_id, comment_id, user_id, nickname, descript, 0, datetime, datetime])
            if(insert_sql){
              return true;
            } else {
              return false;
            }
          } catch {
            return false;
          }
        };
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
  router.get('/list/:talk_id', function(req, res){
     let talk_id = req.params.talk_id;

     const sql = `select *
                 from luxury.producttalkcomment
                 where talk_id = ?`;
     let select_query = db.query(conn, sql, talk_id);
     select_query.then((data)=>{
       if(!data){
         res.json(500);
       } else {
         res.json(data);
       }
     })
  })
  router.get('/likelist/:talk_id/:comment_id/:user_id/:product_id', function(req,res){
    let talk_id = req.params.talk_id;
    let comment_id = req.params.comment_id;
    let product_id = req.params.product_id;
    let user_id = req.params.user_id;


    //내가 이미 좋아요 누른건지 체크확인
    const select_sql = `select count(*) cnt
                        from luxury.producttalklike
                        where product_id = ?
                        and talk_id = ?
                        and user_id = ?
                        and comment_id = ?`;
    let select_query = db.query(conn, select_sql, [product_id, talk_id, user_id, comment_id]);
    select_query.then((data)=>{
      if(!data){
        res.json(500)
      } else{
        res.json(data);
      }
    })
  })
  router.get('/like/:talk_id/:comment_id/:user_id/:product_id', function(req,res){
    let talk_id = req.params.talk_id;
    let comment_id = req.params.comment_id;
    let product_id = req.params.product_id;
    let user_id = req.params.user_id;


    //내가 이미 좋아요 누른건지 체크확인
    const select_sql = `select count(*) cnt
                        from luxury.producttalklike
                        where product_id = ?
                        and talk_id = ?
                        and user_id = ?
                        and comment_id = ?`;
    //자바스크립트 날짜 시간 set
    let reg_date = moment().format("YYYY-MM-DD");
    let reg_time = date.time();
    let datetime = reg_date + " " + reg_time;

    let select_query = db.query(conn, select_sql, [product_id, talk_id, user_id, comment_id]);
    select_query.then((data)=>{
      if(!data){
        res.json(500)
      } else {
        if(data[0].cnt == 0){
          const insert_sql = `insert into luxury.producttalklike(product_id, talk_id, comment_id, user_id, upd_dttm, reg_dttm) values (?,?,?,?,?,?)`
          //좋아요는 계속 누를 수 있도록 일단 설정
          const update_sql = `update luxury.producttalkcomment set talkcomment_like = talkcomment_like + 1 where talk_id = ? and comment_id =?`;
          let insert_query = db.query(conn, insert_sql, [product_id, talk_id, comment_id, user_id, datetime, datetime])
          insert_query.then((data)=>{
            if(!data){
              res.json(500)
            } else {
              let update_query = db.query(conn, update_sql, [talk_id, comment_id]);
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
  router.get('/delete/:talk_id/:comment_id', function(req, res){
     let talk_id = req.params.talk_id;
     let comment_id = req.params.comment_id;

     const delete_sql = `delete
                 from luxury.producttalkcomment
                 where talk_id = ?
                 and comment_id = ?`;
     let delete_query = db.query(conn, delete_sql, [talk_id,comment_id]);
     delete_query.then((data)=>{
       if(!data){
         res.json(500);
       } else {
         const deletelike_sql = `delete
                     from luxury.producttalklike
                     where talk_id = ?
                     and comment_id = ?`;
         let deletelike_query = db.query(conn, deletelike_sql, [talk_id,comment_id]);
         deletelike_query.then((data)=>{
           if(!data){
             res.json(500)
           } else {
             res.json(data);
           }
         })
       }
     })
  })

  return router;
}
