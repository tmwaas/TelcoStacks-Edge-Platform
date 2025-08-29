import express from 'express';
import client from 'prom-client';
const app = express(); app.use(express.json());
client.collectDefaultMetrics();
const eventCounter = new client.Counter({name:'api_events_total',help:'events',labelNames:['kind']});
const bytesCounter = new client.Counter({name:'api_bytes_total',help:'bytes'});
const httpHist = new client.Histogram({name:'http_request_duration_seconds',help:'reqs',labelNames:['method','route','code'],buckets:[0.005,0.01,0.025,0.05,0.1,0.25,0.5,1,2,5]});
let totalEvents=0, totalBytes=0;
let faultRate = Number(process.env.FAULT_RATE || 0);
app.post('/fault',(req,res)=>{ const rate = Number(req.query.rate || (req.body||{}).rate || 0); faultRate = Math.max(0,Math.min(1,rate)); res.json({faultRate});});
app.get('/health',(req,res)=>res.json({status:'ok',service:'api'}));
app.get('/metrics', async (req,res)=>{res.set('Content-Type',client.register.contentType);res.end(await client.register.metrics());});
app.post('/events',(req,res)=>{ const end=httpHist.startTimer({method:'POST',route:'/events'});
  try{ const {kind='cdr',bytes:b=0}=req.body||{}; totalEvents++; totalBytes+=Number(b||0); eventCounter.inc({kind}); bytesCounter.inc(Number(b||0)); end({code:200}); res.json({received:true}); }
  catch(e){ end({code:500}); res.status(500).json({error:e.message}); }
});
app.get('/stats',(req,res)=>{ if (Math.random()<faultRate) return res.status(500).json({error:'simulated fault'}); res.json({totalEvents,totalBytes,timestamp:Date.now(),faultRate}); });
const port=process.env.PORT||8080; app.listen(port,()=>console.log('api '+port));
