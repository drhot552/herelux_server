module.exports = function(conn){
    const express = require('express');
    const router = express.Router();  //router하는 객체를 추출
    const multer = require("multer");
    const multerS3 = require('multer-s3-transform');
    const moment  = require("moment");
    const mysql = require('mysql');
    const sharp = require('sharp');
    const validate = require('../module/validate');
    const date = require('../module/date');
    const db = require('../module/db_query');

    /* AWS 이미지 처리 부분 */
    const AWS = require("aws-sdk");
    AWS.config.region = 'ap-northeast-2';

    var imgname="";
    var brands_name="";
    const maxSize = 2 * 1024 * 1024;

    //bucket name 운영
    const bucketname  = 'hereluxuryboard';
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
             console.log("transforms key123333");
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
    //board mylist 리스트 조회
    router.get('/mylist/:id/:boardtype/:page', function(req,res){
      let userid = req.params.id;
      let boardtype = req.params.boardtype;
      let page = req.params.page;
      let idx = parseInt(page);
      let startidx = idx * 20;
      let lastidx = (idx + 1) * 20;
      let range = 0;
      let sql = '';

      if (boardtype == 0) {
        sql = `select a.num, a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum,
		                  a.views, a.reg_date, a.reg_time, a.upd_date, a.upd_time, a.forum
                from
                (
                	 select @rownum:=@rownum+1 num, a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum,
                		a.views, a.reg_date, a.reg_time, a.upd_date, a.upd_time, c.descript forum
                                		from luxury.board a, (select @rownum := 0) b, luxury.code c
                                		where a.board_idx in (
                                								select board_idx
                                								from luxury.board
                                								where userid = ?
                                								and boardtype between ? and 99
                                								union all
                                								select b.board_idx
                                								from luxury.comment a, luxury.board b
                                								where a.userid = ?
                                								and a.board_idx = b.board_idx
                                								and b.boardtype between ? and 99
                                								group by b.board_idx
                                								union all
                                								select a.board_idx
                                								from luxury.commentdown a, luxury.board b
                                								where a.userid = ?
                                								and a.board_idx = b.board_idx
                                								and b.boardtype between ? and 99
                                								group by a.board_idx)
                                		and a.boardtype = c.major_key
                                		and a.boardforum = c.minor_key
                                		order by a.check_flag asc, a.board_idx desc
                ) a
                where a.num > ? and a.num <= ?`;
      }
      else if (boardtype < 3){
        sql = `select a.num, a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum,
		                  a.views, a.reg_date, a.reg_time, a.upd_date, a.upd_time, a.forum
                from
                (
                	 select @rownum:=@rownum+1 num, a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum,
                		a.views, a.reg_date, a.reg_time, a.upd_date, a.upd_time, c.descript forum
                                		from luxury.board a, (select @rownum := 0) b, luxury.code c
                                		where a.board_idx in (
                                								select board_idx
                                								from luxury.board
                                								where userid = ?
                                								and boardtype = ?
                                								union all
                                								select b.board_idx
                                								from luxury.comment a, luxury.board b
                                								where a.userid = ?
                                								and a.board_idx = b.board_idx
                                								and b.boardtype = ?
                                								group by b.board_idx
                                								union all
                                								select a.board_idx
                                								from luxury.commentdown a, luxury.board b
                                								where a.userid = ?
                                								and a.board_idx = b.board_idx
                                								and b.boardtype = ?
                                								group by a.board_idx)
                                		and a.boardtype = c.major_key
                                		and a.boardforum = c.minor_key
                                		order by a.check_flag asc, a.board_idx desc
                ) a
                where a.num > ? and a.num <= ?`
      }
      else {
        sql = `select a.num, a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum,
		                  a.views, a.reg_date, a.reg_time, a.upd_date, a.upd_time
                from
                (
                	 select @rownum:=@rownum+1 num, a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum,
                		a.views, a.reg_date, a.reg_time, a.upd_date, a.upd_time
                                		from luxury.board a, (select @rownum := 0) b
                                		where a.board_idx in (
                                								select board_idx
                                								from luxury.board
                                								where userid = ?
                                								and boardtype = ?
                                								union all
                                								select b.board_idx
                                								from luxury.comment a, luxury.board b
                                								where a.userid = ?
                                								and a.board_idx = b.board_idx
                                								and b.boardtype = ?
                                								group by b.board_idx
                                								union all
                                								select a.board_idx
                                								from luxury.commentdown a, luxury.board b
                                								where a.userid = ?
                                								and a.board_idx = b.board_idx
                                								and b.boardtype = ?
                                								group by a.board_idx)
                                		order by a.check_flag asc, a.board_idx desc
                ) a
                where a.num > ? and a.num <= ?`;
      }
      let select_query = db.query(conn, sql, [userid,boardtype,userid,boardtype,userid,boardtype, startidx, lastidx]);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        }
        else {
          res.json(data);
        }
      })
    })
    //board 게시판 리스트 조회
    router.get('/list/:boardtype/:page', function(req, res){
      let boardtype = req.params.boardtype;
      let page = req.params.page;
      let idx = parseInt(page);
      let startidx = idx * 20;
      let lastidx = (idx + 1) * 20;
      let range = 0;
      let sql = '';

      //브랜드 포럼
      // boardtype = 0 전체
      if (boardtype == 0) {
        //이미지 set
        sql = `select b.board_idx, b.userid, b.name, b.subject, b.descript, b.boardtype, b.boardforum, b.views,
                           b.reg_date, b.reg_time, b.upd_date, b.upd_time, b.forum, b.comment, b.img_cnt, b.imgurl
                  from
                    (
                       select @rownum:=@rownum+1 num, a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum, a.views,
                           a.reg_date, a.reg_time, a.upd_date, a.upd_time, a.forum, a.comment, a.img_cnt, a.imgurl
                       from (
                           select a.board_idx, userid, name, subject, a.descript, boardtype, boardforum, views,
                               reg_date, reg_time, upd_date, upd_time, b.descript forum, c.comment + d.comment comment, e.img_cnt, e.imgurl
                           from luxury.board a, luxury.code b, (select @rownum := 0) f, (select b.board_idx board_idx, count(a.board_idx) comment
                                                         from luxury.board b left outer join luxury.comment a
                                                         on  b.board_idx = a.board_idx
                                                         where b.boardtype between ? and 99
                                                         group by b.board_idx) c,
                              (select b.board_idx board_idx, count(a.board_idx) comment
                              from luxury.board b left outer join luxury.commentdown a
                              on  b.board_idx = a.board_idx
                              where b.boardtype between ? and 99
                              group by b.board_idx) d,
                              (select a.board_idx board_idx, count(b.idx) img_cnt, max(b.imgurl) imgurl
                                from luxury.board a left outer join luxury.boardimg b
                                on a.board_idx = b.idx
                                where a.boardtype between ? and 99
                               group by a.board_idx) e
                           where a.boardtype between ? and 99
                           and a.boardforum = b.minor_key
                           and a.board_idx = c.board_idx
                           and a.board_idx = d.board_idx
                           and a.board_idx = e.board_idx
                           and a.boardtype = b.major_key
                           order by a.board_idx desc
                       ) a
                     ) b
                     where b.num > ? and b.num <= ?`;
      }
      else if(boardtype < 3){
         sql = `select b.board_idx, b.userid, b.name, b.subject, b.descript, b.boardtype, b.boardforum, b.views,
              							b.reg_date, b.reg_time, b.upd_date, b.upd_time, b.forum, b.comment, b.img_cnt, b.imgurl
              		 from
                     (
            						select @rownum:=@rownum+1 num, a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum, a.views,
            								a.reg_date, a.reg_time, a.upd_date, a.upd_time, a.forum, a.comment, a.img_cnt, a.imgurl
            						from (
              							select a.board_idx, userid, name, subject, a.descript, boardtype, boardforum, views,
              								  reg_date, reg_time, upd_date, upd_time, b.descript forum, c.comment + d.comment comment, e.img_cnt, e.imgurl
              							from luxury.board a, luxury.code b, (select @rownum := 0) f, (select b.board_idx board_idx, count(a.board_idx) comment
              																						from luxury.board b left outer join luxury.comment a
              																						on  b.board_idx = a.board_idx
              																						where b.boardtype = ?
              																						group by b.board_idx) c,
              								 (select b.board_idx board_idx, count(a.board_idx) comment
      												 from luxury.board b left outer join luxury.commentdown a
      												 on  b.board_idx = a.board_idx
      												 where b.boardtype = ?
      												 group by b.board_idx) d,
                               (select a.board_idx board_idx, count(b.idx) img_cnt, max(b.imgurl) imgurl
                                 from luxury.board a left outer join luxury.boardimg b
                                 on a.board_idx = b.idx
                                 where a.boardtype = ?
                                group by a.board_idx) e
              							where a.boardtype = ?
              							and a.boardforum = b.minor_key
              							and a.board_idx = c.board_idx
              							and a.board_idx = d.board_idx
                            and a.board_idx = e.board_idx
              							and a.boardtype = b.major_key
              							order by a.board_idx desc
          						  ) a
                      ) b
                      where b.num > ? and b.num <= ?
                      `;
      }
      else{
        sql = `select b.board_idx, b.userid, b.name, b.subject, b.descript, b.boardtype, b.boardforum, b.views,
              							b.reg_date, b.reg_time, b.upd_date, b.upd_time, b.comment, b.img_cnt, b.imgurl
              		 from
                     (
            						select @rownum:=@rownum+1 num, a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum, a.views,
            								a.reg_date, a.reg_time, a.upd_date, a.upd_time, a.comment, a.img_cnt, a.imgurl
            						from (
              							select a.board_idx, userid, name, subject, a.descript, boardtype, boardforum, views,
              								  reg_date, reg_time, upd_date, upd_time, c.comment, e.img_cnt, e.imgurl
              							from luxury.board a, (select @rownum := 0) f, (select b.board_idx board_idx, count(a.board_idx) comment
              																						from luxury.board b left outer join luxury.comment a
              																						on  b.board_idx = a.board_idx
              																						where b.boardtype = ?
              																						group by b.board_idx) c,
              								 (select b.board_idx board_idx, count(a.board_idx) comment
      												 from luxury.board b left outer join luxury.commentdown a
      												 on  b.board_idx = a.board_idx
      												 where b.boardtype = ?
      												 group by b.board_idx) d,
                               (select a.board_idx board_idx, count(b.idx) img_cnt, max(b.imgurl) imgurl
                                 from luxury.board a left outer join luxury.boardimg b
                                 on a.board_idx = b.idx
                                 where a.boardtype = ?
                                group by a.board_idx) e
              							where a.boardtype = ?
              							and a.board_idx = c.board_idx
              							and a.board_idx = d.board_idx
                            and a.board_idx = e.board_idx
              							order by a.board_idx desc
          						  ) a
                      ) b
                      where b.num > ? and b.num <= ?`;
      }
      let select_query = db.query(conn, sql, [boardtype,boardtype,boardtype,boardtype,startidx, lastidx]);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        }
        else {
          res.json(data);
        }
      })
    })
    //게시판 이미지 및 url 조회
    router.get('/etc/:board_idx/:etc_type', function(req,res){
      let board_idx = req.params.board_idx;
      let etc_type = req.params.etc_type;
      let sql = '';

      // board img
      if(etc_type == 1)
      {
        sql = `select *
               from luxury.boardimg
               where idx = ?`
      }
      else{
        sql = `select *
              from luxury.boardurl
              where board_idx = ?`;
      }
      let select_query = db.query(conn, sql, [board_idx]);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        }
        else{
          res.json(data);
        }
      })
    })

    //게시판 건별 조회
    router.get('/select/:board_idx/:board_type', function(req,res){
      let board_idx = req.params.board_idx;
      let board_type = req.params.board_type;
      let sql = '';

      //업데이트 후 에 조회
      let update_sql = 'update luxury.board set views = views + 1 where board_idx = ?'

      if(board_type < 2)
      {
        sql = `select board_idx, userid, name, subject, a.descript descript, boardtype, boardforum, views,
                            reg_date, reg_time, upd_date, upd_time, imgurl,b.descript brand, boardurl
                     from
                      (
                        select a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum, a.views,
                               a.reg_date, a.reg_time, a.upd_date, a.upd_time, a.imgurl, b.boardurl
                           from (
                           	select a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum, a.views,
                                     a.reg_date, a.reg_time, a.upd_date, a.upd_time, b.imgurl
                              from luxury.board a left outer join luxury.boardimg b
                              on a.board_idx = b.idx
                              where a.board_idx = ?
                           ) a left outer join luxury.boardurl b
                           on a.board_idx = b.board_idx
                      ) a, luxury.code b
                      where a.boardtype = b.major_key
                      and a.boardforum = b.minor_key`
      }
      else{
        sql = ` select a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum, a.views,
                       a.reg_date, a.reg_time, a.upd_date, a.upd_time, a.imgurl, b.boardurl
                from (
                select a.board_idx, a.userid, a.name, a.subject, a.descript, a.boardtype, a.boardforum, a.views,
                         a.reg_date, a.reg_time, a.upd_date, a.upd_time, b.imgurl
                  from luxury.board a left outer join luxury.boardimg b
                  on a.board_idx = b.idx
                  where a.board_idx = ?
               ) a left outer join luxury.boardurl b
               on a.board_idx = b.board_idx`;
      }
      let update_query = db.query(conn, update_sql, [board_idx]);
      update_query.then((data)=>{
        if(!data){
          res.json(500);
        }
        else {
          let select_query = db.query(conn, sql, [board_idx]);
          select_query.then((data)=>{
            if(!data){
              res.json(500);
            }
            else{
              res.json(data);
            }
          })
        }
      })
    })
    //board 게시판 삭제
    router.get('/delete/:board_idx',function(req,res){
      //게시판 및 댓글 삭제
      //사진삭제
      let board_idx = req.params.board_idx;
      var imgName = '';
      //삭제할 이미지를 먼저 select 한다.
      let sql = `select imgurl from luxury.boardimg where idx = ?`;
      let select_query = db.query(conn, sql, [board_idx]);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        }
        else {
          //두개 이미지 삭제
          for(var i = 0; i < data.length; i++) {
            if( data[i].imgurl != null ){
                imgName =  data[i].imgurl.split('/');
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
            let board_sql = `delete from luxury.board where board_idx = ?;`;
            let boardimg_sql = `delete from luxury.boardimg where idx = ?;`;
            let comment_sql = `delete from luxury.comment where board_idx = ?;`;
            let commentdown_sql = `delete from luxury.commentdown where board_idx = ?;`;
            let boardurl_sql  = `delete from luxury.boardurl where board_idx = ?`;
            try {
              let board_query  = await db.query(conn, board_sql, board_idx);
              let boardimg_query = await db.query(conn, boardimg_sql, board_idx);
              let comment_query = await db.query(conn, comment_sql, board_idx);
              let commentdown_query = await db.query(conn, commentdown_sql, board_idx);
              let boardurl_query = await db.query(conn, boardurl_sql, board_idx);

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
    //board 게시판 이미지 및 글 저장
    router.post('/write', upload.fields([{name:"image_1"},{name:"image_2"}]), function(req, res){
      let imgFile = req.files;
      let userid = req.body.userid;
      let subject = req.body.subject;
      let descript = req.body.descript;
      let boardforum = req.body.boardforum;
      let boardtype = req.body.boardtype;

      let url_1 = req.body.url_1;
      let url_2 = req.body.url_2;


      //자바스크립트 날짜 시간 set
      let reg_date = moment().format("YYYY-MM-DD");
      let reg_time = date.time();

      //imagurl에 대한 max값 set
      const sql_idx = `select max(board_idx) idx from luxury.board`;
      let select_query  = db.query(conn, sql_idx);
      select_query.then((data)=>{
        if(!data){
          res.json(500);
        } else {
          //동기쿼리 부분처리
          const asyncsql = async()=> {
            try{
              let idx = data[0].idx + 1;
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
                let name  = nickname_query[0].nickname;
                const sql_insert = `Insert into luxury.board(board_idx,userid,name,subject,descript,boardtype,boardforum,reg_date,reg_time)
                             values (?,?,?,?,?,?,?,?,?)`;
                let insert_query = await db.query(conn, sql_insert, [idx,userid,name, subject, descript, boardtype,boardforum,reg_date,reg_time]);
                //board 테이블 insert
                if(insert_query){
                  const sql_url = `Insert into luxury.boardurl(board_idx, seq, userid, boardurl, reg_date, reg_time)
                                   values (?,?,?,?,?,?)`;
                  let values_1 = [];
                  //url 부분처리
                  if(url_1 == "" && url_2 == "") {
                    return_flag = true;
                  } else {

                    if(url_1 != "") {
                      let urlValues = [];
                      urlValues.push(idx);
                      urlValues.push(0);
                      urlValues.push(userid);
                      urlValues.push(url_1);
                      urlValues.push(reg_date);
                      urlValues.push(reg_time);
                      values_1.push(urlValues);
                    }
                    if(url_2 != ""){
                      let urlValues = [];
                      urlValues.push(idx);
                      urlValues.push(1);
                      urlValues.push(userid);
                      urlValues.push(url_2);
                      urlValues.push(reg_date);
                      urlValues.push(reg_time);
                      values_1.push(urlValues);
                    }

                    for(var a = 0; a < values_1.length; a++){
                      let insert_url = await db.query(conn, sql_url, values_1[a]);
                      if(insert_url){
                        return_flag = true;
                      } else{
                        return_flag = false;
                      }

                    }
                }
                //image insert 갯수에 따라 set
                if(imgFile.image_1 == null && imgFile.image_2 == null){
                  return_flag = true;
                } else {
                    const sql_img = `Insert into luxury.boardimg (idx, seq, userid, imgurl, reg_dttm) values (?,?,?,?,?)`;
                    let reg_dttm = reg_date + " " + reg_time;
                    let values_2 = [];

                    let i = 0 ;

                    //이미지 두개로 set

                    if(imgFile.image_1 != null ){
                      console.log(imgFile.image_1[0].transforms)
                      let imgValues = [];
                      imgValues.push(idx)
                      imgValues.push(i)
                      imgValues.push(userid)
                      imgValues.push(imgFile.image_1[0].transforms[0].location)
                      imgValues.push(reg_dttm)

                      i++;
                      values_2.push(imgValues)
                    }
                    if (imgFile.image_2 != null ) {
                      let imgValues = [];
                      imgValues.push(idx)
                      imgValues.push(i)
                      imgValues.push(userid)
                      imgValues.push(imgFile.image_2[0].transforms[0].location)
                      imgValues.push(reg_dttm)
                      values_2.push(imgValues)

                    }
                    for(var k = 0; k < values_2.length; k++){
                      let insert_img = await db.query(conn, sql_img, values_2[k]);
                      if(insert_img){
                        return_flag = true;
                      } else{
                        return_flag = false;
                      }
                    }
                  }
                } else {
                  return_flag = false;
                }
              } else {
                return_flag = false
              }
              return return_flag
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
    return router;
}
