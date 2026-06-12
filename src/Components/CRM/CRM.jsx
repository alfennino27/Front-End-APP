import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Modal, Button, Form, Badge, Spinner } from 'react-bootstrap';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useTheme } from '../../ThemeContext';
import { MdAdd, MdEdit, MdDelete, MdFileUpload } from 'react-icons/md';

const STAGES = [
  { key: 'leads',     label: 'Leads Baru',     color: '#378ADD', bg: '#EAF3FB' },
  { key: 'good',      label: 'Prospek Bagus',  color: '#EF9F27', bg: '#FDF3E3' },
  { key: 'quotation', label: 'Quotation',      color: '#7F77DD', bg: '#EEEDFE' },
  { key: 'deal',      label: 'Deal',           color: '#639922', bg: '#EDF5E1' },
];
const PLATFORMS = [
  { value: 'instagram', label: 'Instagram Ads' },
  { value: 'google', label: 'Google Ads' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'dm_b2b', label: 'DM B2B' },
  { value: 'organic', label: 'Organic / Referral' },
  { value: 'other', label: 'Lainnya' },
];
const fmtRp = (n) => 'Rp ' + Number(n||0).toLocaleString('id-ID');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }) : '-';
const daysSince = (d) => { if(!d) return null; const diff = Math.floor((Date.now()-new Date(d))/86400000); return diff===0?'Hari ini':diff+' hari lalu'; };

export default function CRM() {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const dark = globalTheme === 'dark';
  const [activeTab, setActiveTab] = useState('pipeline');
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const today = new Date().toISOString().slice(0,10);
  const [leadForm, setLeadForm] = useState({ nama:'', wa:'', campaign_id:'', notes:'', stage:'leads', tanggal_masuk: today });
  const [detailLead, setDetailLead] = useState(null);
  const [dealValue, setDealValue] = useState('');
  const [grossProfit, setGrossProfit] = useState('');
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campForm, setCampForm] = useState({ nama:'', platform:'instagram', bulan:'', spend:'', status:'active' });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [filterBulan, setFilterBulan] = useState('');
  const [expandedCamp, setExpandedCamp] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [lr, cr] = await Promise.all([fetch(baseUrl+'/crm/leads/get'), fetch(baseUrl+'/crm/campaigns/get')]);
      const [ld, cd] = await Promise.all([lr.json(), cr.json()]);
      setLeads(Array.isArray(ld)?ld:[]);
      setCampaigns(Array.isArray(cd)?cd:[]);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [baseUrl]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSaveLead = async () => {
    const url = editingLead ? baseUrl+'/crm/leads/update/'+editingLead.id : baseUrl+'/crm/leads/create';
    const method = editingLead ? 'PUT' : 'POST';
    const body = editingLead ? {...leadForm} : {...leadForm, tanggal_masuk: leadForm.tanggal_masuk || today, stage_dates:{leads:new Date().toISOString(),good:null,quotation:null,deal:null,lost:null}};
    await fetch(url, {method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
    setShowLeadModal(false); setEditingLead(null); setLeadForm({nama:'',wa:'',campaign_id:'',notes:'',stage:'leads',tanggal_masuk:today}); fetchAll();
  };

  const handleMoveStage = async (lead, dir) => {
    const order = ['leads','good','quotation','deal'];
    const idx = order.indexOf(lead.stage);
    if(dir==='forward'&&idx>=order.length-1) return;
    if(dir==='back'&&idx<=0) return;
    const ns = dir==='forward' ? order[idx+1] : order[idx-1];
    const sd = {...lead.stage_dates, [ns]: dir==='forward'?new Date().toISOString():null};
    await fetch(baseUrl+'/crm/leads/update/'+lead.id, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({stage:ns,stage_dates:sd})});
    fetchAll();
  };

  const handleMarkLost = async (lead) => {
    const sd = {...lead.stage_dates, lost:new Date().toISOString()};
    await fetch(baseUrl+'/crm/leads/update/'+lead.id, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({stage:'lost',stage_dates:sd})});
    setShowLeadDetail(false); fetchAll();
  };

  const handleRestoreLead = async (lead) => {
    await fetch(baseUrl+'/crm/leads/update/'+lead.id, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({stage:'leads',stage_dates:{...lead.stage_dates,lost:null}})});
    fetchAll();
  };

  const handleSaveDealValue = async () => {
    await fetch(baseUrl+'/crm/leads/update/'+detailLead.id, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({deal_value:Number(dealValue),gross_profit:Number(grossProfit)})});
    setShowLeadDetail(false); fetchAll();
  };

  const handleDeleteConfirmed = async () => {
    const {type, id} = deleteTarget;
    await fetch(baseUrl+'/crm/'+(type==='lead'?'leads':'campaigns')+'/delete/'+id, {method:'DELETE'});
    setShowDeleteConfirm(false); setShowLeadDetail(false); fetchAll();
  };

  const handleSaveCampaign = async () => {
    const url = editingCampaign ? baseUrl+'/crm/campaigns/update/'+editingCampaign.id : baseUrl+'/crm/campaigns/create';
    await fetch(url, {method:editingCampaign?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(campForm)});
    setShowCampaignModal(false); setEditingCampaign(null); setCampForm({nama:'',platform:'instagram',bulan:'',spend:'',status:'active'}); fetchAll();
  };

  const parseCSVLine = (line) => {
    const result = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ; }
      else if (line[i] === ',' && !inQ) { result.push(cur); cur = ''; }
      else { cur += line[i]; }
    }
    result.push(cur);
    return result;
  };

  const handleCSVFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.trim().split('\n').filter(l => l.trim());
      const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''));

      const idx = {
        date:     headers.indexOf('Reporting starts'),
        adset:    headers.indexOf('Ad set name'),
        spend:    headers.indexOf('Amount spent (IDR)'),
        results:  headers.indexOf('Results'),
        cpl:      headers.indexOf('Cost per results'),
        cpm:      headers.indexOf('CPM (cost per 1,000 impressions) (IDR)'),
        imp:      headers.indexOf('Impressions'),
        reach:    headers.indexOf('Reach'),
        freq:     headers.indexOf('Frequency'),
        ctr:      headers.indexOf('CTR (link click-through rate)'),
        starts:   headers.indexOf('Starts'),
        ends:     headers.indexOf('Ends'),
        bulan:    headers.indexOf('Reporting starts'),
      };

      const map = {};
      lines.slice(1).forEach(line => {
        const v = parseCSVLine(line).map(x => x.trim().replace(/^"|"$/g, ''));
        const name = v[idx.adset];
        if (!name) return;
        const spend = parseFloat(v[idx.spend]) || 0;
        const results = parseFloat(v[idx.results]) || 0;
        const imp = parseFloat(v[idx.imp]) || 0;
        const reach = parseFloat(v[idx.reach]) || 0;
        const cpm = parseFloat(v[idx.cpm]) || 0;
        const ctr = parseFloat(v[idx.ctr]) || 0;
        const freq = parseFloat(v[idx.freq]) || 0;
        const date = v[idx.date] || '';

        if (!map[name]) {
          map[name] = { nama: name, spend:0, results:0, impressions:0, reach:0,
            _cpmW:0, _ctrW:0, _freqW:0, _impTotal:0,
            start_date: v[idx.starts]||'', end_date: v[idx.ends]||'',
            bulan: v[idx.bulan]?.substring(0,7)||'', daily_data:[] };
        }
        map[name].spend      += spend;
        map[name].results    += results;
        map[name].impressions+= imp;
        map[name].reach      += reach;
        map[name]._cpmW      += cpm * imp;
        map[name]._ctrW      += ctr * imp;
        map[name]._freqW     += freq * imp;
        map[name]._impTotal  += imp;
        // simpan daily row (hanya hari yang ada data)
        if (spend > 0 || results > 0) {
          map[name].daily_data.push({ date, spend: Math.round(spend), results: Math.round(results),
            cpl: results > 0 ? Math.round(spend/results) : 0,
            cpm: Math.round(cpm), impressions: Math.round(imp),
            reach: Math.round(reach), frequency: parseFloat(freq.toFixed(2)), ctr: parseFloat(ctr.toFixed(3)) });
        }
      });

      const parsed = Object.values(map).map(c => {
        const imp = c._impTotal || 1;
        return {
          nama: c.nama, platform: 'instagram', bulan: c.bulan,
          spend: Math.round(c.spend),
          results: Math.round(c.results),
          impressions: Math.round(c.impressions),
          reach: Math.round(c.reach),
          cpl: c.results > 0 ? Math.round(c.spend / c.results) : 0,
          cpm: Math.round(c._cpmW / imp),
          ctr: parseFloat((c._ctrW / imp).toFixed(3)),
          frequency: parseFloat((c._freqW / imp).toFixed(2)),
          start_date: c.start_date, end_date: c.end_date,
          daily_data: c.daily_data.sort((a,b)=>a.date.localeCompare(b.date)),
        };
      });
      setImportPreview(parsed);
      setShowImportModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportConfirm = async () => {
    setImportLoading(true);
    try {
      const res = await fetch(baseUrl+'/crm/campaigns/import-meta', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ campaigns: importPreview }),
      });
      const data = await res.json();
      alert(data.message);
      setShowImportModal(false); setImportPreview([]);
      fetchAll();
    } catch(e) { alert('Gagal import'); }
    setImportLoading(false);
  };

  const getCampaignName = (id) => campaigns.find(c=>c.id===id)?.nama || id;

  const getLeadMonth = (l) => (l.tanggal_masuk || l.created_at || '').slice(0,7);
  const filteredLeads = filterBulan ? leads.filter(l => getLeadMonth(l) === filterBulan) : leads;
  const filteredCampaigns = filterBulan ? campaigns.filter(c => c.bulan === filterBulan) : campaigns;

  const activeLeads = filteredLeads.filter(l=>l.stage!=='lost');
  const lostLeads = filteredLeads.filter(l=>l.stage==='lost');
  const dealLeads = filteredLeads.filter(l=>l.stage==='deal');
  const totalRevenue = dealLeads.reduce((s,l)=>s+(l.deal_value||0),0);
  const totalGP = dealLeads.reduce((s,l)=>s+(l.gross_profit||0),0);
  const convRate = filteredLeads.length>0 ? ((dealLeads.length/filteredLeads.length)*100).toFixed(1) : 0;

  const cardBg=dark?'#1e1e2e':'#fff', border=dark?'1px solid #333':'1px solid #e8e8e8', text=dark?'white':'#1a1a1a', muted=dark?'#aaa':'#666', mc=dark?'modalKLF':'modalKLFlight';

  return (
    <Container fluid className="py-3 px-3">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><h4 style={{color:text,fontWeight:700,margin:0}}>CRM</h4><small style={{color:muted}}>Customer Relationship Management</small></div>
        <div style={{display:'flex',gap:8}}>
          {activeTab==='pipeline'&&<Button size="sm" variant="primary" onClick={()=>{setEditingLead(null);setLeadForm({nama:'',wa:'',campaign_id:'',notes:'',stage:'leads'});setShowLeadModal(true);}}><MdAdd/> Tambah Lead</Button>}
          {activeTab==='campaigns'&&<>
            <input ref={fileInputRef} type="file" accept=".csv" style={{display:'none'}} onChange={handleCSVFile}/>
            <Button size="sm" variant="outline-success" onClick={()=>fileInputRef.current?.click()}><MdFileUpload/> Import Meta Ads</Button>
            <Button size="sm" variant="primary" onClick={()=>{setEditingCampaign(null);setCampForm({nama:'',platform:'instagram',bulan:'',spend:'',status:'active'});setShowCampaignModal(true);}}><MdAdd/> Tambah Campaign</Button>
          </>}
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',borderBottom:'2px solid '+(dark?'#333':'#eee'),marginBottom:20}}>
        <div style={{display:'flex',gap:4}}>
          {[['pipeline','Pipeline'],['campaigns','Kampanye'],['analytics','Analitik']].map(([k,l])=>(
            <button key={k} onClick={()=>setActiveTab(k)} className="no-active" style={{padding:'8px 16px',border:'none',background:'none',cursor:'pointer',fontWeight:activeTab===k?700:400,color:activeTab===k?'#013175':muted,borderBottom:activeTab===k?'2px solid #013175':'2px solid transparent',marginBottom:-2}}>{l}</button>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,paddingBottom:6}}>
          <span style={{fontSize:12,color:muted,fontWeight:600}}>Filter:</span>
          <input type="month" value={filterBulan} onChange={e=>setFilterBulan(e.target.value)}
            style={{fontSize:12,padding:'3px 8px',borderRadius:6,border:'1px solid '+(dark?'#444':'#ddd'),background:dark?'#1e1e2e':'#fff',color:text,cursor:'pointer'}}/>
          {filterBulan&&<button onClick={()=>setFilterBulan('')} style={{fontSize:11,padding:'3px 8px',border:'1px solid '+(dark?'#444':'#ddd'),borderRadius:6,background:'none',color:muted,cursor:'pointer'}}>Semua</button>}
        </div>
      </div>
      {loading ? <div style={{textAlign:'center',padding:60}}><Spinner/></div> : <>
        {activeTab==='pipeline'&&<>
          <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
            {[{label:'Leads Aktif',value:activeLeads.length,color:'#378ADD'},{label:'Quotation',value:activeLeads.filter(l=>l.stage==='quotation').length,color:'#7F77DD'},{label:'Deal',value:dealLeads.length,color:'#639922'},{label:'Revenue',value:fmtRp(totalRevenue),color:'#013175'}].map((m,i)=>(
              <div key={i} style={{background:cardBg,border,borderRadius:10,padding:'12px 18px',flex:'1 1 130px'}}>
                <div style={{fontSize:11,color:muted,marginBottom:2}}>{m.label}</div>
                <div style={{fontSize:20,fontWeight:700,color:m.color}}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:12}}>
            {STAGES.map(stage=>{
              const sl=activeLeads.filter(l=>l.stage===stage.key);
              return <div key={stage.key} style={{background:cardBg,border,borderRadius:12,overflow:'hidden'}}>
                <div style={{background:stage.bg,padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:700,color:stage.color,fontSize:13}}>{stage.label}</span>
                  <Badge style={{background:stage.color}}>{sl.length}</Badge>
                </div>
                <div style={{padding:8,display:'flex',flexDirection:'column',gap:8,minHeight:80}}>
                  {sl.map(lead=>(
                    <div key={lead.id} style={{background:dark?'#252535':'#fafafa',border,borderRadius:8,padding:'10px 12px',cursor:'pointer'}} onClick={()=>{setDetailLead(lead);setDealValue(lead.deal_value||'');setGrossProfit(lead.gross_profit||'');setShowLeadDetail(true);}}>
                      <div style={{fontWeight:600,color:text,fontSize:13,marginBottom:2}}>{lead.nama}</div>
                      {lead.wa&&<div style={{fontSize:11,color:'#378ADD',marginBottom:2}}>📱 {lead.wa}</div>}
                      {lead.campaign_id&&<div style={{fontSize:10,color:'#7F77DD',marginBottom:2}}>📢 {getCampaignName(lead.campaign_id)}</div>}
                      {lead.kode_invoice&&<div style={{fontSize:10,color:'#639922'}}>🧾 {lead.kode_invoice}</div>}
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6}}>
                        <span style={{fontSize:10,color:muted}}>{daysSince(lead.stage_dates?.[lead.stage])}</span>
                        <div style={{display:'flex',gap:4}}>
                          {lead.stage!=='leads'&&<button onClick={e=>{e.stopPropagation();handleMoveStage(lead,'back');}} style={{border:'none',background:'#eee',borderRadius:4,padding:'2px 6px',cursor:'pointer',fontSize:12}}>‹</button>}
                          {lead.stage!=='deal'&&<button onClick={e=>{e.stopPropagation();handleMoveStage(lead,'forward');}} style={{border:'none',background:stage.bg,color:stage.color,borderRadius:4,padding:'2px 6px',cursor:'pointer',fontSize:12,fontWeight:700}}>›</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {sl.length===0&&<div style={{textAlign:'center',color:muted,fontSize:12,padding:'12px 0'}}>Kosong</div>}
                </div>
              </div>;
            })}
          </div>
          {lostLeads.length>0&&<div style={{marginTop:24}}>
            <div style={{color:muted,fontWeight:600,fontSize:13,marginBottom:8}}>Lost ({lostLeads.length})</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:8}}>
              {lostLeads.map(lead=>(
                <div key={lead.id} style={{background:cardBg,border:'1px solid #ffd5d5',borderRadius:8,padding:'8px 12px',opacity:0.8}}>
                  <div style={{fontWeight:600,color:'#a32d2d',fontSize:13}}>{lead.nama}</div>
                  <div style={{fontSize:11,color:muted,marginTop:2}}>Lost {fmtDate(lead.stage_dates?.lost)}</div>
                  <button onClick={()=>handleRestoreLead(lead)} style={{marginTop:6,border:'1px solid #ccc',background:'none',borderRadius:4,padding:'2px 8px',fontSize:11,cursor:'pointer',color:muted}}>Restore</button>
                </div>
              ))}
            </div>
          </div>}
        </>}

        {activeTab==='campaigns'&&<div>
          {filteredCampaigns.length===0 ? <div style={{textAlign:'center',color:muted,padding:60}}>{filterBulan?`Tidak ada campaign di ${filterBulan}.`:'Belum ada campaign.'}</div> :
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead><tr style={{borderBottom:'2px solid '+(dark?'#333':'#eee'),textAlign:'left'}}>
                {['','Nama','Spend','Results','CPL','CPM','Impresi','Reach','Freq','CTR','Leads','Deal','Revenue','ROAS','Status',''].map((h,i)=><th key={i} style={{padding:'8px 6px',color:muted,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredCampaigns.map(camp=>{
                  const cl=leads.filter(l=>l.campaign_id===camp.id), cd=cl.filter(l=>l.stage==='deal');
                  const rev=cd.reduce((s,l)=>s+(l.deal_value||0),0), roas=camp.spend>0?(rev/camp.spend).toFixed(1):'-';
                  const rc=roas==='-'?muted:roas>=8?'#639922':roas>=3?'#EF9F27':'#a32d2d';
                  const sc={active:'#639922',paused:'#EF9F27',stopped:'#a32d2d'};
                  const hasMeta = camp.source==='meta_ads';
                  const isExpanded = expandedCamp === camp.id;
                  const hasDailyData = hasMeta && Array.isArray(camp.daily_data) && camp.daily_data.length > 0;
                  return <>
                    <tr key={camp.id} style={{borderBottom:'1px solid '+(dark?'#2a2a2a':'#f0f0f0'),background: isExpanded?(dark?'#1a2035':'#f0f5ff'):''}}>
                      <td style={{padding:'8px 6px',textAlign:'center',width:28}}>
                        {hasDailyData&&<button onClick={()=>setExpandedCamp(isExpanded?null:camp.id)} style={{border:'none',background:'none',cursor:'pointer',color:'#013175',fontSize:16,lineHeight:1,padding:0}}>{isExpanded?'▾':'▸'}</button>}
                      </td>
                      <td style={{padding:'8px 6px',fontWeight:600,color:text}}>
                        {camp.nama}
                        {hasMeta&&<span style={{marginLeft:6,fontSize:10,background:'#E7F3FF',color:'#1877F2',padding:'1px 5px',borderRadius:4,fontWeight:600}}>Meta</span>}
                        {hasDailyData&&<span style={{marginLeft:4,fontSize:10,color:muted}}>{camp.start_date?.slice(0,10)} — {camp.end_date?.slice(0,10)}</span>}
                      </td>
                      <td style={{padding:'8px 6px',color:text}}>{camp.spend?fmtRp(camp.spend):'-'}</td>
                      <td style={{padding:'8px 6px',textAlign:'center',fontWeight:600,color:'#378ADD'}}>{hasMeta?(camp.results||0):'-'}</td>
                      <td style={{padding:'8px 6px',color:muted}}>{hasMeta&&camp.cpl?fmtRp(camp.cpl):'-'}</td>
                      <td style={{padding:'8px 6px',color:muted}}>{hasMeta&&camp.cpm?fmtRp(camp.cpm):'-'}</td>
                      <td style={{padding:'8px 6px',color:muted}}>{hasMeta&&camp.impressions?Number(camp.impressions).toLocaleString('id-ID'):'-'}</td>
                      <td style={{padding:'8px 6px',color:muted}}>{hasMeta&&camp.reach?Number(camp.reach).toLocaleString('id-ID'):'-'}</td>
                      <td style={{padding:'8px 6px',color:muted}}>{hasMeta&&camp.frequency?camp.frequency:'-'}</td>
                      <td style={{padding:'8px 6px',color:muted}}>{hasMeta&&camp.ctr?camp.ctr.toFixed(2)+'%':'-'}</td>
                      <td style={{padding:'8px 6px',textAlign:'center'}}>{cl.length}</td>
                      <td style={{padding:'8px 6px',textAlign:'center'}}>{cd.length}</td>
                      <td style={{padding:'8px 6px',color:'#639922',fontWeight:600}}>{fmtRp(rev)}</td>
                      <td style={{padding:'8px 6px',fontWeight:700,color:rc}}>{roas==='-'?'-':roas+'x'}</td>
                      <td style={{padding:'8px 6px'}}><span style={{color:sc[camp.status]||muted,fontWeight:600,fontSize:11,textTransform:'capitalize'}}>● {camp.status}</span></td>
                      <td style={{padding:'8px 6px'}}>
                        <div style={{display:'flex',gap:4}}>
                          <button onClick={()=>{setEditingCampaign(camp);setCampForm({nama:camp.nama,platform:camp.platform,bulan:camp.bulan||'',spend:camp.spend||'',status:camp.status});setShowCampaignModal(true);}} style={{border:'none',background:'none',cursor:'pointer',color:'#013175',fontSize:16}}><MdEdit/></button>
                          <button onClick={()=>{setDeleteTarget({type:'campaign',id:camp.id,label:camp.nama});setShowDeleteConfirm(true);}} style={{border:'none',background:'none',cursor:'pointer',color:'#a32d2d',fontSize:16}}><MdDelete/></button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && hasDailyData && camp.daily_data.map((day,di)=>(
                      <tr key={`${camp.id}-day-${di}`} style={{background:dark?'#111827':'#f8f9ff',borderBottom:'1px solid '+(dark?'#1e2540':'#e8edff')}}>
                        <td style={{padding:'5px 6px'}}/>
                        <td style={{padding:'5px 6px',color:'#378ADD',fontWeight:600,fontSize:12,paddingLeft:20}}>{day.date}</td>
                        <td style={{padding:'5px 6px',fontSize:12,color:text}}>{day.spend?fmtRp(day.spend):'-'}</td>
                        <td style={{padding:'5px 6px',fontSize:12,textAlign:'center',color:'#378ADD',fontWeight:600}}>{day.results||'-'}</td>
                        <td style={{padding:'5px 6px',fontSize:12,color:muted}}>{day.cpl?fmtRp(day.cpl):'-'}</td>
                        <td style={{padding:'5px 6px',fontSize:12,color:muted}}>{day.cpm?fmtRp(day.cpm):'-'}</td>
                        <td style={{padding:'5px 6px',fontSize:12,color:muted}}>{day.impressions?Number(day.impressions).toLocaleString('id-ID'):'-'}</td>
                        <td style={{padding:'5px 6px',fontSize:12,color:muted}}>{day.reach?Number(day.reach).toLocaleString('id-ID'):'-'}</td>
                        <td style={{padding:'5px 6px',fontSize:12,color:muted}}>{day.frequency||'-'}</td>
                        <td style={{padding:'5px 6px',fontSize:12,color:muted}}>{day.ctr?day.ctr.toFixed(2)+'%':'-'}</td>
                        <td colSpan={6}/>
                      </tr>
                    ))}
                  </>;
                })}
              </tbody>
            </table>
          </div>}
        </div>}

        {activeTab==='analytics'&&<div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:12,marginBottom:24}}>
            {[{label:'Total Leads',value:filteredLeads.length,color:'#378ADD'},{label:'Deal',value:dealLeads.length,color:'#639922'},{label:'Conversion Rate',value:convRate+'%',color:'#7F77DD'},{label:'Total Revenue',value:fmtRp(totalRevenue),color:'#013175'},{label:'Gross Profit',value:fmtRp(totalGP),color:'#EF9F27'}].map((m,i)=>(
              <div key={i} style={{background:cardBg,border,borderRadius:10,padding:'14px 18px'}}>
                <div style={{fontSize:11,color:muted,marginBottom:4}}>{m.label}</div>
                <div style={{fontSize:18,fontWeight:700,color:m.color}}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{background:cardBg,border,borderRadius:12,padding:20,marginBottom:20}}>
            <h6 style={{color:text,fontWeight:700,marginBottom:16}}>Funnel Konversi</h6>
            <div style={{display:'flex',gap:0}}>
              {STAGES.map((stage,i)=>{
                const count=filteredLeads.filter(l=>l.stage_dates?.[stage.key]).length;
                const pct=filteredLeads.length>0?((count/filteredLeads.length)*100).toFixed(0):0;
                return <div key={stage.key} style={{flex:1,textAlign:'center',padding:'14px 8px',background:stage.bg,borderLeft:i>0?'2px solid #fff':'none',borderRadius:i===0?'8px 0 0 8px':i===STAGES.length-1?'0 8px 8px 0':0}}>
                  <div style={{fontSize:24,fontWeight:800,color:stage.color}}>{count}</div>
                  <div style={{fontSize:11,color:stage.color,fontWeight:600}}>{stage.label}</div>
                  <div style={{fontSize:10,color:muted,marginTop:2}}>{pct}%</div>
                </div>;
              })}
            </div>
          </div>
          {filteredCampaigns.length>0&&<div style={{background:cardBg,border,borderRadius:12,padding:20}}>
            <h6 style={{color:text,fontWeight:700,marginBottom:12}}>Performa per Campaign</h6>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead><tr style={{borderBottom:'2px solid '+(dark?'#333':'#eee')}}>
                {['Campaign','Leads','Deal','Conv.','Revenue','ROAS'].map((h,i)=><th key={i} style={{padding:'6px 10px',color:muted,fontWeight:600,textAlign:i>1?'center':'left'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredCampaigns.map(camp=>{
                  const cl=filteredLeads.filter(l=>l.campaign_id===camp.id), cd=cl.filter(l=>l.stage==='deal');
                  const rev=cd.reduce((s,l)=>s+(l.deal_value||0),0), roas=camp.spend>0?(rev/camp.spend).toFixed(1):'-';
                  const conv=cl.length>0?((cd.length/cl.length)*100).toFixed(0):0;
                  return <tr key={camp.id} style={{borderBottom:'1px solid '+(dark?'#2a2a2a':'#f5f5f5')}}>
                    <td style={{padding:'8px 10px',fontWeight:600,color:text}}>{camp.nama}</td>
                    <td style={{padding:'8px 10px',textAlign:'center'}}>{cl.length}</td>
                    <td style={{padding:'8px 10px',textAlign:'center',color:'#639922',fontWeight:700}}>{cd.length}</td>
                    <td style={{padding:'8px 10px',textAlign:'center'}}>{conv}%</td>
                    <td style={{padding:'8px 10px',textAlign:'center',color:'#639922'}}>{fmtRp(rev)}</td>
                    <td style={{padding:'8px 10px',textAlign:'center',fontWeight:700,color:roas>=8?'#639922':roas>=3?'#EF9F27':'#a32d2d'}}>{roas==='-'?'-':roas+'x'}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>}
        </div>}
      </>}

      {/* LEAD FORM */}
      <Modal show={showLeadModal} onHide={()=>setShowLeadModal(false)} className={mc}>
        <Modal.Header closeButton><Modal.Title style={{color:dark?'white':'black'}}>{editingLead?'Edit Lead':'Tambah Lead Baru'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2"><Form.Label style={{color:dark?'white':'black'}}>Nama Customer *</Form.Label><Form.Control value={leadForm.nama} onChange={e=>setLeadForm(f=>({...f,nama:e.target.value}))} placeholder="Nama customer"/></Form.Group>
          <Form.Group className="mb-2"><Form.Label style={{color:dark?'white':'black'}}>Tanggal Lead Masuk</Form.Label><Form.Control type="date" value={leadForm.tanggal_masuk||today} onChange={e=>setLeadForm(f=>({...f,tanggal_masuk:e.target.value}))}/></Form.Group>
          <Form.Group className="mb-2"><Form.Label style={{color:dark?'white':'black'}}>No. WhatsApp</Form.Label><Form.Control value={leadForm.wa} onChange={e=>setLeadForm(f=>({...f,wa:e.target.value}))} placeholder="+62 8xx xxxx xxxx"/></Form.Group>
          <Form.Group className="mb-2"><Form.Label style={{color:dark?'white':'black'}}>Campaign Sumber</Form.Label>
            <Form.Select value={leadForm.campaign_id} onChange={e=>setLeadForm(f=>({...f,campaign_id:e.target.value}))}>
              <option value="">Organic / Tidak ada</option>
              {campaigns.map(c=><option key={c.id} value={c.id}>{c.nama}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2"><Form.Label style={{color:dark?'white':'black'}}>Stage Awal</Form.Label>
            <Form.Select value={leadForm.stage} onChange={e=>setLeadForm(f=>({...f,stage:e.target.value}))}>
              {STAGES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2"><Form.Label style={{color:dark?'white':'black'}}>Catatan</Form.Label><Form.Control as="textarea" rows={3} value={leadForm.notes} onChange={e=>setLeadForm(f=>({...f,notes:e.target.value}))} placeholder="Produk diminati, budget, dll..."/></Form.Group>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={()=>setShowLeadModal(false)}>Batal</Button><Button variant="primary" onClick={handleSaveLead} disabled={!leadForm.nama.trim()}>Simpan</Button></Modal.Footer>
      </Modal>

      {/* LEAD DETAIL */}
      <Modal show={showLeadDetail} onHide={()=>setShowLeadDetail(false)} className={mc}>
        {detailLead&&<>
          <Modal.Header closeButton><Modal.Title style={{color:dark?'white':'black'}}>{detailLead.nama}</Modal.Title></Modal.Header>
          <Modal.Body>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
              {STAGES.map(s=>{const active=detailLead.stage===s.key;return <span key={s.key} style={{padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:active?s.bg:(dark?'#333':'#f5f5f5'),color:active?s.color:muted,border:active?'1.5px solid '+s.color:'1.5px solid transparent'}}>{s.label}</span>;})}
            </div>
            <table style={{width:'100%',fontSize:13,marginBottom:12}}><tbody>
              {[['WhatsApp', detailLead.wa ? <a href={'https://wa.me/'+detailLead.wa.replace(/\D/g,'')} target="_blank" rel="noreferrer" style={{color:'#25D366'}}>📱 {detailLead.wa}</a> : '-'],
                ['Sumber', detailLead.campaign_id ? getCampaignName(detailLead.campaign_id) : 'Organic'],
                ['Invoice', detailLead.kode_invoice||'-'],
                ['Deal Value', detailLead.deal_value ? fmtRp(detailLead.deal_value) : '-'],
                ['Dibuat', fmtDate(detailLead.created_at)]
              ].map(([label,val],i)=><tr key={i}><td style={{color:muted,paddingBottom:6,width:90}}>{label}</td><td style={{color:text,fontWeight:500,paddingBottom:6}}>{val}</td></tr>)}
            </tbody></table>
            {detailLead.notes&&<div style={{background:dark?'#1a1a2e':'#f8f9fa',borderRadius:8,padding:'10px 12px',marginBottom:12,fontSize:13,color:text}}>{detailLead.notes}</div>}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:muted,fontWeight:600,marginBottom:8}}>Timeline</div>
              {STAGES.map(s=>detailLead.stage_dates?.[s.key]&&<div key={s.key} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:s.color,flexShrink:0}}/>
                <span style={{fontSize:12,color:s.color,fontWeight:600,width:110}}>{s.label}</span>
                <span style={{fontSize:12,color:muted}}>{fmtDate(detailLead.stage_dates[s.key])}</span>
              </div>)}
            </div>
            {detailLead.stage==='deal'&&<div style={{borderTop:'1px solid '+(dark?'#333':'#eee'),paddingTop:12}}>
              <div style={{fontSize:12,color:muted,fontWeight:600,marginBottom:8}}>Nilai Deal</div>
              <div style={{display:'flex',gap:8}}>
                <Form.Control size="sm" type="number" placeholder="Deal Value (Rp)" value={dealValue} onChange={e=>setDealValue(e.target.value)}/>
                <Form.Control size="sm" type="number" placeholder="Gross Profit (Rp)" value={grossProfit} onChange={e=>setGrossProfit(e.target.value)}/>
                <Button size="sm" variant="success" onClick={handleSaveDealValue}>Simpan</Button>
              </div>
            </div>}
          </Modal.Body>
          <Modal.Footer style={{justifyContent:'space-between'}}>
            <div style={{display:'flex',gap:6}}>
              <Button size="sm" variant="outline-primary" onClick={()=>{setEditingLead(detailLead);setLeadForm({nama:detailLead.nama,wa:detailLead.wa||'',campaign_id:detailLead.campaign_id||'',notes:detailLead.notes||'',stage:detailLead.stage,tanggal_masuk:detailLead.tanggal_masuk||today});setShowLeadDetail(false);setShowLeadModal(true);}}><MdEdit/> Edit</Button>
              {detailLead.stage!=='lost'&&<Button size="sm" variant="outline-danger" onClick={()=>handleMarkLost(detailLead)}>Lost</Button>}
              <Button size="sm" variant="outline-danger" onClick={()=>{setDeleteTarget({type:'lead',id:detailLead.id,label:detailLead.nama});setShowDeleteConfirm(true);}}><MdDelete/></Button>
            </div>
            <div style={{display:'flex',gap:6}}>
              {detailLead.stage!=='leads'&&detailLead.stage!=='lost'&&<Button size="sm" variant="outline-secondary" onClick={()=>{handleMoveStage(detailLead,'back');setShowLeadDetail(false);}}>‹ Mundur</Button>}
              {detailLead.stage!=='deal'&&detailLead.stage!=='lost'&&<Button size="sm" variant="primary" onClick={()=>{handleMoveStage(detailLead,'forward');setShowLeadDetail(false);}}>Maju ›</Button>}
            </div>
          </Modal.Footer>
        </>}
      </Modal>

      {/* CAMPAIGN FORM */}
      <Modal show={showCampaignModal} onHide={()=>setShowCampaignModal(false)} className={mc}>
        <Modal.Header closeButton><Modal.Title style={{color:dark?'white':'black'}}>{editingCampaign?'Edit Campaign':'Tambah Campaign'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2"><Form.Label style={{color:dark?'white':'black'}}>Nama *</Form.Label><Form.Control value={campForm.nama} onChange={e=>setCampForm(f=>({...f,nama:e.target.value}))} placeholder="Nama campaign"/></Form.Group>
          <Form.Group className="mb-2"><Form.Label style={{color:dark?'white':'black'}}>Platform</Form.Label>
            <Form.Select value={campForm.platform} onChange={e=>setCampForm(f=>({...f,platform:e.target.value}))}>
              {PLATFORMS.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2"><Form.Label style={{color:dark?'white':'black'}}>Bulan</Form.Label><Form.Control type="month" value={campForm.bulan} onChange={e=>setCampForm(f=>({...f,bulan:e.target.value}))}/></Form.Group>
          <Form.Group className="mb-2"><Form.Label style={{color:dark?'white':'black'}}>Total Spend (Rp)</Form.Label><Form.Control type="number" value={campForm.spend} onChange={e=>setCampForm(f=>({...f,spend:e.target.value}))} placeholder="0"/></Form.Group>
          <Form.Group className="mb-2"><Form.Label style={{color:dark?'white':'black'}}>Status</Form.Label>
            <Form.Select value={campForm.status} onChange={e=>setCampForm(f=>({...f,status:e.target.value}))}>
              <option value="active">Active</option><option value="paused">Paused</option><option value="stopped">Stopped</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={()=>setShowCampaignModal(false)}>Batal</Button><Button variant="primary" onClick={handleSaveCampaign} disabled={!campForm.nama.trim()}>Simpan</Button></Modal.Footer>
      </Modal>

      {/* IMPORT META ADS */}
      <Modal show={showImportModal} onHide={()=>setShowImportModal(false)} size="xl" className={mc}>
        <Modal.Header closeButton><Modal.Title style={{color:dark?'white':'black'}}>Preview Import Meta Ads ({importPreview.length} Ad Set)</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:'2px solid '+(dark?'#333':'#eee')}}>
                {['Ad Set','Bulan','Spend','Results','CPL','CPM','Impresi','Reach','Freq.','CTR'].map((h,i)=>(
                  <th key={i} style={{padding:'6px 8px',color:muted,fontWeight:600,whiteSpace:'nowrap',textAlign:i>1?'right':'left'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {importPreview.map((c,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid '+(dark?'#2a2a2a':'#f5f5f5')}}>
                    <td style={{padding:'6px 8px',fontWeight:600,color:text}}>{c.nama}</td>
                    <td style={{padding:'6px 8px',color:muted}}>{c.bulan||'-'}</td>
                    <td style={{padding:'6px 8px',textAlign:'right',color:text}}>{fmtRp(c.spend)}</td>
                    <td style={{padding:'6px 8px',textAlign:'right',fontWeight:700,color:'#378ADD'}}>{c.results}</td>
                    <td style={{padding:'6px 8px',textAlign:'right',color:muted}}>{c.cpl?fmtRp(c.cpl):'-'}</td>
                    <td style={{padding:'6px 8px',textAlign:'right',color:muted}}>{c.cpm?fmtRp(c.cpm):'-'}</td>
                    <td style={{padding:'6px 8px',textAlign:'right',color:muted}}>{c.impressions?.toLocaleString('id-ID')}</td>
                    <td style={{padding:'6px 8px',textAlign:'right',color:muted}}>{c.reach?.toLocaleString('id-ID')}</td>
                    <td style={{padding:'6px 8px',textAlign:'right',color:muted}}>{c.frequency}</td>
                    <td style={{padding:'6px 8px',textAlign:'right',color:muted}}>{c.ctr?(c.ctr*100).toFixed(2)+'%':'-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <small style={{color:muted,marginTop:8,display:'block'}}>
            * Ad set yang sudah ada akan diupdate. Ad set baru akan dibuat.
          </small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setShowImportModal(false)}>Batal</Button>
          <Button variant="success" onClick={handleImportConfirm} disabled={importLoading}>
            {importLoading?<Spinner size="sm"/>:'Import Sekarang'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* DELETE CONFIRM */}
      <Modal show={showDeleteConfirm} onHide={()=>setShowDeleteConfirm(false)} className={mc}>
        <Modal.Header closeButton><Modal.Title style={{color:dark?'white':'black'}}>Konfirmasi Hapus</Modal.Title></Modal.Header>
        <Modal.Body><p style={{color:dark?'white':'black'}}>Hapus <strong>{deleteTarget?.label}</strong>? Tindakan ini tidak bisa dibatalkan.</p></Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={()=>setShowDeleteConfirm(false)}>Batal</Button><Button variant="danger" onClick={handleDeleteConfirmed}>Hapus</Button></Modal.Footer>
      </Modal>
    </Container>
  );
}
