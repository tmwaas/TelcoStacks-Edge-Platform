import express from 'express';
import axios from 'axios';
import client from 'prom-client';
const app = express(); app.use(express.json());
client.collectDefaultMetrics();
const processed = new client.Counter({name:'transform_processed_total',help:'processed'});
const bytes = new client.Counter({name:'transform_bytes_total',help:'bytes'});
const httpHist = new client.Histogram({name:'http_request_duration_seconds',help:'reqs',labelNames:['method','route','code'],buckets:[0.005,0.01,0.025,0.05,0.1,0.25,0.5,1,2,5]});
const API_URL = process.env.API_URL || 'http://api:8080/events';
const extraDelayMs = Number(process.env.DELAY_MS || 0);
app.get('/health',(req,res)=>res.json({status:'ok',service:'transform'}));
app.get('/metrics', async (req,res)=>{res.set('Content-Type',client.register.contentType);res.end(await client.register.metrics());});
app.post('/process', async (req,res)=>{ const end=httpHist.startTimer({method:'POST',route:'/process'});
  try{ const {id,type,msisdn,bytes:b=0}=req.body||{}; const normalized={id,kind:type||'cdr',msisdn:String(msisdn||'unknown'),bytes:Number(b||0),ts:Date.now()};
    processed.inc(); bytes.inc(normalized.bytes); axios.post(API_URL,{kind:normalized.kind,bytes:normalized.bytes,ts:normalized.ts},{timeout:3000}).catch(()=>{});
    end({code:200}); setTimeout(()=>res.json({ok:true,normalized}), extraDelayMs); }
  catch(e){ end({code:500}); res.status(500).json({error:e.message}); }
});
const port=process.env.PORT||8080; app.listen(port,()=>console.log('transform '+port));
