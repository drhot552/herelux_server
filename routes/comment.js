module.exports = function(conn){
  const express = require('express');
  const router = express.Router();  //router하는 객체를 추출
  const validate = require('../module/validate');
  const db = require('../module/db_query');
  const moment  = require("moment");

  //comment insert 리스트 조회 (닉네임이 잇을경우 없으면 랜덤으로 set)
  router.post('/', function(req, res){
    let board_idx = req.body.board_idx;
    let userid = req.body.userid;
    let descript = req.body.descript;
    let nickname = req.body.name;

    //자바스크립트 날짜 시간 set
    let reg_date = moment().format("YYYY-MM-DD");
    let hour = moment().hours();
    let minute = moment().minute();

    let reg_hour = "";
    let reg_minute = "";

    reg_hour = validate.time(hour);
    reg_minute = validate.time(minute);

    let reg_time = reg_hour + ":" + reg_minute;

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
        //그렇지 않으면 기존 글에 대한 닉네임으로 부여
        const insert_sql = `Insert into luxury.comment(board_idx, userid, name, descript, check_flag, reg_date, reg_time)
                     values (?,?,?,?,?,?,?)`;
        let insert_query = db.query(conn, insert_sql, [board_idx, userid, nickname, descript, "1",reg_date,reg_time])
        insert_query.then((insert_data)=>{
          if(!insert_data){
            res.json(500)
          } else {
            //async
            const asyncsql = async()=> {
              try {
                const sql_commentFlag = `update luxury.comment
                                  set check_flag = ?, upd_date = ?, upd_time = ?
                                  where board_idx = ?
                                  and userid != ?`;
                const sql_boardflag = `update luxury.board
                                       set check_flag = ?, upd_date = ?, upd_time = ?
                                       where board_idx = ?
                                       and userid != ?`;
                let update_commnetquery = await db.query(conn, sql_commentFlag, [check_flag, reg_date, reg_time, board_idx, userid])
                let update_boardquery = await db.query(conn, sql_boardflag, [check_flag, reg_date, reg_time,board_idx, userid])
                if(update_commnetquery && update_boardquery){
                  return true;
                } else{
                  return false;
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
            })
          }
        })
      }
    })
  })
  //comment 대댓글 insert 리스트 조회 (닉네임이 잇을경우 없으면 랜덤으로 set)
  router.post('/commentdown', function(req, res){
    let board_idx = req.body.board_idx;
    let comment_idx = req.body.comment_idx;
    let userid = req.body.userid;
    let descript = req.body.descript;
    let nickname = req.body.name;

    //자바스크립트 날짜 시간 set
    let reg_date = moment().format("YYYY-MM-DD");
    let hour = moment().hours();
    let minute = moment().minute();

    let reg_hour = "";
    let reg_minute = "";

    reg_hour = validate.time(hour);
    reg_minute = validate.time(minute);

    let reg_time = reg_hour + ":" + reg_minute;
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
        res.json(500)
      } else {
        //닉네임이 없으면 랜덤으로 부여
        if(!nickname){
          nickname = data[0].nickname;
        }
        //그렇지 않으면 기존 글에 대한 닉네임으로 부여
        const sql = `Insert into luxury.commentdown(comment_idx, board_idx, userid, name, descript, reg_date, reg_time)
                     values (?,?,?,?,?,?,?)`;
        let insert_query = db.query(conn, sql, [comment_idx, board_idx, userid, nickname, descript,reg_date,reg_time])
        insert_query.then((insert_data)=>{
          if(!insert_data){
            res.json(500)
          } else {
            //async
            const asyncsql = async()=> {
              try {
                const sql_commentFlag = `update luxury.comment
                                  set check_flag = ?, upd_date = ?, upd_time = ?
                                  where board_idx = ?
                                  and userid != ?`;
                const sql_boardflag = `update luxury.board
                                       set check_flag = ?, upd_date = ?, upd_time = ?
                                       where board_idx = ?
                                       and userid != ?`;
                let update_commnetquery = await db.query(conn, sql_commentFlag, [check_flag, reg_date, reg_time, board_idx, userid])
                let update_boardquery = await db.query(conn, sql_boardflag, [check_flag, reg_date, reg_time,board_idx, userid])
                //쿼리오류에 따른 예외
                if(update_commnetquery && update_boardquery){
                  return true;
                } else{
                  return false;
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
            })
          }
        })
      }
    })
  })
  //대댓글 set
  router.get('/commentdown/:board_idx', function(req,res){
    let board_idx = req.params.board_idx;
    //업데이트 후에 조회한다.

    const sql = `select commentdown_idx, comment_idx, board_idx, userid, name, descript, reg_date, reg_time, upd_date, upd_time
                 from luxury.commentdown
                 where board_idx = ?`;
     let select_query = db.query(conn, sql, board_idx);
     select_query.then((data)=>{
       if(!data){
         res.json(500);
       } else {
         res.json(data);
       }
     })
  })
  router.get('/:board_idx', function(req,res){
    let board_idx = req.params.board_idx;
    //업데이트 후에 조회한다.

    const sql = `select comment_idx, board_idx, userid, name, descript, reg_date, reg_time, upd_date, upd_time
                 from luxury.comment
                 where board_idx = ?`;
     let select_query = db.query(conn, sql, board_idx);
     select_query.then((data)=>{
       if(!data){
         res.json(500);
       } else {
         res.json(data);
       }
     })
  })
  router.get('/delete/:comment_idx', function(req,res){
    let comment_idx = req.params.comment_idx;
    //댓글을 삭제한다.

    const sql = `delete from luxury.comment where comment_idx = ?`;
    let delete_query = db.query(conn, sql, comment_idx);
    delete_query.then((data)=>{
      if(!data){
        res.json(500);
      } else {
        res.json(200);
      }
    })
  })
  router.get('/downdelete/:commentdown_idx', function(req,res){
    let commentdown_idx = req.params.commentdown_idx;
    //댓글을 삭제한다.

    const sql = `delete from luxury.commentdown where commentdown_idx = ?`;
    let delete_query = db.query(conn, sql, commentdown_idx);
    delete_query.then((data)=>{
      if(!data){
        res.json(500);
      } else {
        res.json(200);
      }
    })
  })

  return router;
}
