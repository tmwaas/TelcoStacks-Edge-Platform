import express from 'express';
import axios from 'axios';
import client from 'prom-client';
const app = express(); app.use(express.json());
client.collectDefaultMetrics();
const httpHist = new client.Histogram({name:'http_request_duration_seconds',help:'reqs',labelNames:['method','route','code'],buckets:[0.005,0.01,0.025,0.05,0.1,0.25,0.5,1,2,5]});
const TRANSFORM_URL = process.env.TRANSFORM_URL || 'http://transform:8080/process';
app.get('/health',(req,res)=>res.json({status:'ok',service:'ingest'}));
app.get('/metrics', async (req,res)=>{res.set('Content-Type',client.register.contentType);res.end(await client.register.metrics());});
app.post('/ingest', async (req,res)=>{ const end=httpHist.startTimer({method:'POST',route:'/ingest'});
  try{ const payload=req.body||{id:Date.now(),type:'cdr',msisdn:'6281'+Math.floor(Math.random()*1e9),bytes:Math.floor(Math.random()*10000)};
    await axios.post(TRANSFORM_URL, payload, {timeout:3000}); end({code:200}); res.json({forwarded:true}); }
  catch(e){ end({code:500}); res.status(500).json({error:e.message}); }
});
app.post('/generate', async (req,res)=>{ const count=Number(req.query.count||10); let ok=0,fail=0;
  for (let i=0;i<count;i++){ const p={id:Date.now()+i,type:'cdr',msisdn:'6281'+Math.floor(Math.random()*1e9),bytes:Math.floor(Math.random()*10000)};
    try{ await axios.post(TRANSFORM_URL,p,{timeout:3000}); ok++; } catch{ fail++; } }
  res.json({generated:count,ok,fail});
});
const port=process.env.PORT||8080; app.listen(port,()=>console.log('ingest '+port));
