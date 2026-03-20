'use strict';
Object.defineProperty(exports,'__esModule',{'value':true});
exports.default=FindUserFromToken;
const jsonwebtoken_1=require('jsonwebtoken');
const ShowUserService_1=require('../UserServices/ShowUserService');
const auth_1=require('../../config/auth');
const AppError_1=require('../../errors/AppError');
function normalizeToken(value){
  if(typeof value!=='string')return undefined;
  const raw=value.trim();
  if(!raw)return undefined;
  if(/^Bearer\s+/i.test(raw)){
    const token=raw.replace(/^Bearer\s+/i,'').trim();
    return token||undefined;
  }
  return raw;
}
function decodeToken(token){
  const {secret,refreshSecret}=auth_1.default;
  try{
    return (0,jsonwebtoken_1.verify)(token,refreshSecret);
  }catch(_error){
    return (0,jsonwebtoken_1.verify)(token,secret);
  }
}
async function FindUserFromToken(tokenInput){
  const token=normalizeToken(tokenInput);
  if(!token){
    throw new AppError_1.default('ERR_SESSION_EXPIRED',401);
  }
  try{
    const decoded=decodeToken(token);
    const {id}=decoded;
    if(!id){
      throw new AppError_1.default('ERR_SESSION_EXPIRED',401);
    }
    const user=await (0,ShowUserService_1.default)(id);
    return user;
  }catch(_error){
    throw new AppError_1.default('ERR_SESSION_EXPIRED',401);
  }
}
