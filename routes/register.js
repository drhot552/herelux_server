
module.exports = function(conn){
    const express = require('express');

    const router = express.Router();  //router하는 객체를 추출
    // 날짜 세팅
    const moment  = require("moment");
    const async = require("async");
    const auth = require('./auth');
    const validate = require('../module/validate');
    const date = require('../module/date');
    const db = require('../module/db_query');
    //비밀번호
    const bkfd2Password = require('pbkdf2-password'); //비밀번호 암호화
    var hasher = bkfd2Password(); //비밀번호 해쉬


    //event API
    router.post('/', function(req, res){
      const id = req.body.id;
      const password = req.body.password;
      const type = req.body.type;

      //자바스크립트 날짜 시간 set
      let reg_date = moment().format("YYYY-MM-DD");
      let reg_time = date.time();

      //먼저 아이디중복체크를 한다 여기서 중복하는 아이디가 있으면
      const sql_dup = `select count(*) cnt
                       from luxury.hluser
                       where id = ?
                       and type = ?`;
      let select_query = db.query(conn, sql_dup, [id, type]);
      select_query.then((data)=>{
        if(data[0].cnt == 1){
          res.json(300);
        }
        //중복이 아니라면 성공
        else{
          //비밀번호 암호화 settings
          hasher({password:password}, function(err, pass, salt, hash){
            const sql =`insert into luxury.hluser(id,type,password,reg_date,salt,reg_time) values (?,?,?,?,?,?)`;
            var password_hash = hash;
            var salt = salt;
            let type = 'email'

            if(password_hash){
              var insert_query = db.query(conn, sql, [id,type,password_hash,reg_date,salt,reg_time]);
              insert_query.then((data)=>{
                if(!data) {
                  return res.status(401).json({error: 'Register Database Error'})
                } else {
                  res.json(200);
                }
              })
            }
          })
        }
      });
    })

    router.post('/out', function(req, res){
      const userid = req.body.id;
      const password = req.body.password;
      const type = req.body.type;

      const sql =`SELECT id, password, salt, reg_date, reg_time
                  FROM luxury.hluser
                  WHERE id = ?
                  AND type = ?`;
      var check_query = db.query(conn, sql, [userid, type]);
      check_query.then((hluser)=>{
        if(!hluser){
          res.json(500);
        } else {
          if(hluser.length > 0){
            /* emeail user delete */
            if(type == 'email'){
              return hasher({password:password, salt:hluser[0].salt}, function(err,pass,salt,hash){
                  if(hash  == hluser[0].password){
                    deleteFunc()
                  } else{
                    //패스워드가 틀리면
                    console.log('password failure');
                    res.json(302);
                  }
              });
            }
            /* sns user delete */
            else {
              deleteFunc()
            }

          } else{
            //id가 틀릴경우
            console.log('login failure');
            res.json(301);
          }
          // 회원탈퇴 Function
          function deleteFunc(){
            const asyncsql = async()=>{
              const sql_out = `delete
                               from luxury.hluser
                               where id = ?`;
              const sql_select = `select seq
                                 from luxury.hluser_delete
                                 where userid = ?`;
              //return falg
              let return_flag = false;
              //자바스크립트 날짜 시간 set
              let reg_date = moment().format("YYYY-MM-DD");
              let reg_time = date.time();

              try {
                let delete_query  = await db.query(conn, sql_out, userid);
                let selecthl_query = await db.query(conn, sql_select, userid);

                if(delete_query && selecthl_query.length > 0){
                  const sql_update = `update luxury.hluser_delete
                                      set seq = seq + 1, delete_date =?, delete_time = ?
                                      where userid = ?`;
                  let update_query = await db.query(conn, sql_update, [reg_date, reg_time, userid]);
                  return update_query

                } else if(delete_query && selecthl_query.length == 0){
                  const sql_insert = `Insert into luxury.hluser_delete(userid, seq, reg_date, reg_time, delete_date, delete_time)
                                    values (?,?,?,?,?,?)`;
                  let insert_query = await db.query(conn, sql_insert, [userid, 0, reg_date, reg_time, reg_date, reg_time]);
                  return insert_query

                } else {
                  return false;
                }
              } catch {
                console.log("query error");
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
        }
      })
    })
    return router;
}
