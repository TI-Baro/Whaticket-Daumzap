'use strict';
Object.defineProperty(exports,'__esModule',{'value':true});
const express_1=require('express');
const SessionController=require('../controllers/SessionController');
const isAuth_1=require('../middleware/isAuth');
const isAdmin_1=require('../middleware/isAdmin');
const AppError_1=require('../errors/AppError');
const isAuth=isAuth_1.default||isAuth_1;
const isAdmin=isAdmin_1.default||isAdmin_1;
const AppError=AppError_1.default||AppError_1;
const authRoutes=(0,express_1.Router)();
const normalizeToken=value=>{
  if(typeof value!=='string')return undefined;
  const raw=value.trim();
  if(!raw)return undefined;
  if(/^Bearer\s+/i.test(raw)){
    const token=raw.replace(/^Bearer\s+/i,'').trim();
    return token||undefined;
  }
  return raw;
};
const prepareMeToken=(req,_res,next)=>{
  const headerToken=normalizeToken(req.headers?.authorization||req.headers?.Authorization);
  const cookieToken=normalizeToken(req.cookies?.jrt);
  const token=headerToken||cookieToken;
  if(!token){
    throw new AppError('ERR_SESSION_EXPIRED',401);
  }
  req.cookies=req.cookies||{};
  req.cookies.jrt=token;
  return next();
};
authRoutes.post('/login',SessionController.store);
authRoutes.post('/impersonate/:companyId',isAuth,isAdmin,SessionController.impersonate);
authRoutes.post('/refresh_token',SessionController.update);
authRoutes.delete('/logout',isAuth,SessionController.remove);
authRoutes.get('/me',isAuth,prepareMeToken,SessionController.me);
exports.default=authRoutes;
