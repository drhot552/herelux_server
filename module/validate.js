module.exports.time= function(time){
  let returnTime = "";
  if(time < 10){
    returnTime = "0" + time.toString();
  }
  else{
    returnTime = time.toString();
  }
  return returnTime;
}
