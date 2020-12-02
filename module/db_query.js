module.exports.query= async function(conn, sql, arry){
    try {
      const connection = await conn.getConnection(async conn => conn);
      try {
        /* Step 3. */
        await connection.beginTransaction();
        const [rows] = await connection.query(sql, arry);
        await connection.commit(); // COMMIT
        console.log('Query Success ');
        connection.release();
        return rows;
      } catch(err) {
        await connection.rollback(); // ROLLBACK
        console.log('Query Error : ', sql, arry, err);
        connection.release();
        return false;
      }
    } catch(err) {
      console.log('DB Error');
      return false;
    }
}
