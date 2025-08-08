const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/battlecoin_test';
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

mongoose.connect(MONGO, {useNewUrlParser:true, useUnifiedTopology:true})
  .then(()=> console.log('Mongo connected'))
  .catch(e=> console.error('Mongo connection error', e));

const UserSchema = new mongoose.Schema({
  nickname:String,
  wallet:{
    btc:{type:Number, default:0},
    doge:{type:Number, default:0},
    ltc:{type:Number, default:0},
    btt:{type:Number, default:0}
  },
  items:[{id:String, qty:Number, createdAt:Date}],
  createdAt: {type:Date, default:Date.now}
});

const User = mongoose.model('User', UserSchema);

app.post('/login', async (req,res)=>{
  const { nickname } = req.body;
  if(!nickname) return res.status(400).json({error:'nickname required'});
  let user = await User.findOne({nickname});
  if(!user){
    user = await User.create({nickname, wallet:{btc:0.001, doge:10, ltc:0.01, btt:0}});
  }
  const token = jwt.sign({id:user._id}, JWT_SECRET, {expiresIn:'7d'});
  res.json({token});
});

const auth = async (req,res,next)=>{
  const authh = req.headers.authorization;
  if(!authh) return res.status(401).json({error:'no auth'});
  const token = authh.split(' ')[1];
  try{
    const data = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(data.id);
    next();
  }catch(e){ res.status(401).json({error:'invalid token'})}
}

app.get('/user', auth, async (req,res)=>{
  res.json({
    nickname:req.user.nickname,
    wallet:req.user.wallet,
    items:req.user.items||[]
  });
});

const PRICES = { btc:60000, doge:0.1, ltc:90 };
app.post('/convert', auth, async (req,res)=>{
  const { coin } = req.body;
  if(!['btc','doge','ltc'].includes(coin)) return res.status(400).json({error:'invalid coin'});
  const amount = req.user.wallet[coin] || 0;
  const usd = amount * PRICES[coin];
  const btt = Math.floor(usd);
  req.user.wallet[coin] = 0;
  req.user.wallet.btt += btt;
  await req.user.save();
  res.json({wallet:req.user.wallet});
});

app.post('/mine', auth, async (req,res)=>{
  req.user.wallet.btt += 0.1;
  await req.user.save();
  res.json({wallet:req.user.wallet});
});

app.post('/buy', auth, async (req,res)=>{
  const { itemId } = req.body;
  if(itemId!=='rig_basic') return res.status(400).json({error:'invalid item'});
  if(req.user.wallet.btt < 50) return res.status(400).json({error:'insufficient btt'});
  req.user.wallet.btt -= 50;
  const it = req.user.items.find(i=>i.id==='rig_basic');
  if(it) it.qty += 1; else req.user.items.push({id:'rig_basic', qty:1, createdAt:new Date()});
  await req.user.save();
  res.json({items:req.user.items, wallet:req.user.wallet});
});

app.get('/admin/list-users', async (req,res)=>{
  const users = await User.find().select('nickname wallet items');
  res.json(users);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, ()=> console.log('Server listening on '+PORT));
