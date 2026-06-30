import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  const [leadForm, setLeadForm] = useState({ nama:'', wa:'', campaign_id:'', notes:'', stage:'leads', tanggal_masuk: today, is_repeat_order: false, repeat_ref_campaign_id: '' });
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
  const [syncing, setSyncing] = useState(false);

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
    setShowLeadModal(false); setEditingLead(null); setLeadForm({nama:'',wa:'',campaign_id:'',notes:'',stage:'leads',tanggal_masuk:today,is_repeat_order:false,repeat_ref_campaign_id:''}); fetchAll();
  };

  const handleMoveStage = async (lead, dir) => {
    const order = ['leads','good','quotation','deal'];
    const idx = order.indexOf(lead.stage);
    if(dir==='forward'&&idx>=order.length-1) return;
    if(dir==='back'&&idx<=0) return;
    const ns = dir==='forward' ? order[idx+1] : order[idx-1];
    const sd = {...lead.stage_dates, [ns]: dir==='forward'?new Date().toISOString():null};
    const body = {stage:ns, stage_dates:sd};
    // Set tanggal_deal saat pertama kali masuk deal (pipeline path)
    if (ns === 'deal' && !lead.tanggal_deal) {
      body.tanggal_deal = new Date().toISOString().slice(0, 10);
    }
    await fetch(baseUrl+'/crm/leads/update/'+lead.id, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
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

  const parseCSVFile = (file) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) { alert('File harus berformat .csv'); return; }
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
  };

  const handleCSVFile = (e) => {
    parseCSVFile(e.target.files[0]);
    e.target.value = '';
  };

  const [csvDragOver, setCsvDragOver] = useState(false);
  const handleCSVDrop = (e) => {
    e.preventDefault();
    setCsvDragOver(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    parseCSVFile(file);
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

  // tanggal_masuk = tanggal lead masuk (untuk atribusi campaign/ROI)
  const getLeadMonthMasuk = (l) => (l.tanggal_masuk || l.created_at || '').slice(0,7);
  // tanggal_deal = tanggal invoice/deal closing (untuk revenue reporting dan pipeline)
  const getLeadMonthDeal = (l) => (l.tanggal_deal || l.tanggal_masuk || l.created_at || '').slice(0,7);

  // Agregat metrik dari list daily (weighted by impressions untuk rata2)
  const aggDaily = (days) => {
    const spend = days.reduce((s,d)=>s+(Number(d.spend)||0),0);
    const results = days.reduce((s,d)=>s+(Number(d.results)||0),0);
    const impressions = days.reduce((s,d)=>s+(Number(d.impressions)||0),0);
    const reach = days.reduce((s,d)=>s+(Number(d.reach)||0),0);
    const impW = impressions||1;
    const cpm = Math.round(days.reduce((s,d)=>s+(Number(d.cpm)||0)*(Number(d.impressions)||0),0)/impW);
    const ctr = +(days.reduce((s,d)=>s+(Number(d.ctr)||0)*(Number(d.impressions)||0),0)/impW).toFixed(3);
    const frequency = +(days.reduce((s,d)=>s+(Number(d.frequency)||0)*(Number(d.impressions)||0),0)/impW).toFixed(2);
    const cpl = results>0 ? Math.round(spend/results) : 0;
    return { spend, results, cpl, cpm, impressions, reach, frequency, ctr, daily: days, active: true };
  };

  // Metrik campaign untuk bulan tertentu (diturunkan dari daily_data). null = tidak aktif di bulan itu.
  const getCampaignMonthData = (camp, month) => {
    const daily = Array.isArray(camp.daily_data) ? camp.daily_data : [];
    if (!month) {
      if (daily.length > 0) return aggDaily(daily);
      return { spend:camp.spend||0, results:camp.results||0, cpl:camp.cpl||0, cpm:camp.cpm||0, impressions:camp.impressions||0, reach:camp.reach||0, frequency:camp.frequency||0, ctr:camp.ctr||0, daily:[], active:true };
    }
    if (daily.length > 0) {
      const days = daily.filter(d => (d.date||'').slice(0,7) === month);
      return days.length ? aggDaily(days) : null;
    }
    // tanpa daily_data: pakai field bulan
    return camp.bulan === month ? { spend:camp.spend||0, results:camp.results||0, cpl:camp.cpl||0, cpm:camp.cpm||0, impressions:camp.impressions||0, reach:camp.reach||0, frequency:camp.frequency||0, ctr:camp.ctr||0, daily:[], active:true } : null;
  };

  // Pipeline & revenue: filter by tanggal_deal (tanggal invoice dibuat)
  const filteredLeads = filterBulan ? leads.filter(l => getLeadMonthDeal(l) === filterBulan) : leads;
  // Campaign attribution: filter by tanggal_masuk (tanggal lead masuk sebenarnya)
  const filteredLeadsMasuk = filterBulan ? leads.filter(l => getLeadMonthMasuk(l) === filterBulan) : leads;
  const filteredCampaigns = filterBulan ? campaigns.filter(c => getCampaignMonthData(c, filterBulan) !== null) : campaigns;

  const activeLeads = filteredLeads.filter(l=>l.stage!=='lost');
  const lostLeads = filteredLeads.filter(l=>l.stage==='lost');
  const dealLeads = filteredLeads.filter(l=>l.stage==='deal');
  const totalRevenue = dealLeads.reduce((s,l)=>s+(l.deal_value||0),0);
  const totalGP = dealLeads.reduce((s,l)=>s+(l.gross_profit||0),0);
  const convRate = filteredLeads.length>0 ? ((dealLeads.length/filteredLeads.length)*100).toFixed(1) : 0;

  // Periods available — dari daily_data campaign + tanggal lead (kedua tanggal)
  const availablePeriods = useMemo(() => {
    const months = new Set();
    campaigns.forEach(c => {
      const daily = Array.isArray(c.daily_data) ? c.daily_data : [];
      if (daily.length > 0) daily.forEach(d => { const m=(d.date||'').slice(0,7); if(m) months.add(m); });
      else if (c.bulan) months.add(c.bulan);
    });
    leads.forEach(l => {
      const mMasuk = (l.tanggal_masuk || l.created_at || '').slice(0,7);
      const mDeal = (l.tanggal_deal || '').slice(0,7);
      if (mMasuk) months.add(mMasuk);
      if (mDeal) months.add(mDeal);
    });
    return Array.from(months).sort().reverse();
  }, [campaigns, leads]);

  // Analytics calculations
  // Spend & results diturunkan per bulan dari daily_data campaign
  const metaLeadsTotal = filteredCampaigns.filter(c=>c.source==='meta_ads').reduce((s,c)=>s+((getCampaignMonthData(c,filterBulan)?.results)||0),0);
  const totalSpend = filteredCampaigns.reduce((s,c)=>s+((getCampaignMonthData(c,filterBulan)?.spend)||0),0);

  // Total revenue/GP (by tanggal_deal — tanggal invoice dibuat)
  const revenueTotal = dealLeads.reduce((s,l)=>s+(l.deal_value||0),0);
  const gpTotal = dealLeads.reduce((s,l)=>s+(l.gross_profit||0),0);

  // Deal "from Ads" by tanggal_masuk — untuk atribusi efektivitas campaign
  const adsDealLeads = filteredLeadsMasuk.filter(l => l.stage==='deal' && l.campaign_id && !l.is_repeat_order);
  const revenueFromAds = adsDealLeads.reduce((s,l)=>s+(l.deal_value||0),0);
  const gpFromAds = adsDealLeads.reduce((s,l)=>s+(l.gross_profit||0),0);

  // Total Profit from Ads = GP from Ads − Total Spend Ads (metrik keputusan campaign)
  const totalProfitFromAds = gpFromAds - totalSpend;
  const convRateMeta = metaLeadsTotal>0 ? ((adsDealLeads.length/metaLeadsTotal)*100).toFixed(1) : null;

  const cardBg=dark?'#1e1e2e':'#fff', border=dark?'1px solid #333':'1px solid #e8e8e8', text=dark?'white':'#1a1a1a', muted=dark?'#aaa':'#666', mc=dark?'modalKLF':'modalKLFlight';

  return (
    <Container fluid className="py-3 px-3">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><h4 style={{color:text,fontWeight:700,margin:0}}>CRM</h4><small style={{color:muted}}>Customer Relationship Management</small></div>
        <div style={{display:'flex',gap:8}}>
          {activeTab==='pipeline'&&<Button size="sm" variant="primary" onClick={()=>{setEditingLead(null);setLeadForm({nama:'',wa:'',campaign_id:'',notes:'',stage:'leads'});setShowLeadModal(true);}}><MdAdd/> Tambah Lead</Button>}
          {activeTab==='campaigns'&&<>
            <input ref={fileInputRef} type="file" accept=".csv" style={{display:'none'}} onChange={handleCSVFile}/>
            <div
              onDragOver={(e)=>{e.preventDefault(); setCsvDragOver(true);}}
              onDragLeave={()=>setCsvDragOver(false)}
              onDrop={handleCSVDrop}
              title="Klik atau drag & drop file .csv export Meta Ads di sini"
              style={{
                border: csvDragOver ? '2px dashed #198754' : '2px dashed transparent',
                borderRadius: 8,
                padding: 2,
                background: csvDragOver ? 'rgba(25,135,84,0.08)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Button size="sm" variant="outline-success" onClick={()=>fileInputRef.current?.click()}><MdFileUpload/> Import Meta Ads</Button>
            </div>
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
          <select value={filterBulan} onChange={e=>setFilterBulan(e.target.value)}
            style={{fontSize:12,padding:'4px 10px',borderRadius:6,border:'1px solid '+(dark?'#444':'#ddd'),background:dark?'#1e1e2e':'#fff',color:text,cursor:'pointer',fontWeight:500}}>
            <option value="">Semua Periode</option>
            {availablePeriods.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
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
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                        <span style={{fontWeight:600,color:text,fontSize:13}}>{lead.nama}</span>
                        {lead.is_repeat_order&&<span style={{fontSize:9,background:'#FFF3CD',color:'#856404',padding:'1px 5px',borderRadius:3,fontWeight:700,whiteSpace:'nowrap'}}>↩ Repeat</span>}
                      </div>
                      {lead.wa&&<div style={{fontSize:11,color:'#378ADD',marginBottom:2}}>📱 {lead.wa}</div>}
                      {lead.campaign_id&&<div style={{fontSize:10,color:'#7F77DD',marginBottom:2}}>📢 {getCampaignName(lead.campaign_id)}{lead.is_repeat_order&&<span style={{color:'#856404'}}> (asal)</span>}</div>}
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
                  const md = getCampaignMonthData(camp, filterBulan) || {};
                  const cl=filteredLeadsMasuk.filter(l=>l.campaign_id===camp.id);
                  const cd=cl.filter(l=>l.stage==='deal'&&!l.is_repeat_order); // exclude repeat dari ROAS
                  const rev=cd.reduce((s,l)=>s+(l.deal_value||0),0), roas=md.spend>0?(rev/md.spend).toFixed(1):'-';
                  const rc=roas==='-'?muted:roas>=8?'#639922':roas>=3?'#EF9F27':'#a32d2d';
                  const sc={active:'#639922',paused:'#EF9F27',stopped:'#a32d2d'};
                  const hasMeta = camp.source==='meta_ads';
                  const isExpanded = expandedCamp === camp.id;
                  const monthDaily = Array.isArray(md.daily) ? md.daily : [];
                  const hasDailyData = hasMeta && monthDaily.length > 0;
                  const periodLabel = monthDaily.length ? `${monthDaily[0].date} — ${monthDaily[monthDaily.length-1].date}` : '';
                  return <>
                    <tr key={camp.id} style={{borderBottom:'1px solid '+(dark?'#2a2a2a':'#f0f0f0'),background: isExpanded?(dark?'#1a2035':'#f0f5ff'):''}}>
                      <td style={{padding:'8px 6px',textAlign:'center',width:28}}>
                        {hasDailyData&&<button onClick={()=>setExpandedCamp(isExpanded?null:camp.id)} style={{border:'none',background:'none',cursor:'pointer',color:'#013175',fontSize:16,lineHeight:1,padding:0}}>{isExpanded?'▾':'▸'}</button>}
                      </td>
                      <td style={{padding:'8px 6px',fontWeight:600,color:text}}>
                        {camp.nama}
                        {hasMeta&&<span style={{marginLeft:6,fontSize:10,background:'#E7F3FF',color:'#1877F2',padding:'1px 5px',borderRadius:4,fontWeight:600}}>Meta</span>}
                        {periodLabel&&<span style={{marginLeft:4,fontSize:10,color:muted}}>{periodLabel}</span>}
                      </td>
                      <td style={{padding:'8px 6px',color:text}}>{md.spend?fmtRp(md.spend):'-'}</td>
                      <td style={{padding:'8px 6px',textAlign:'center',fontWeight:600,color:'#378ADD'}}>{hasMeta?(md.results||0):'-'}</td>
                      <td style={{padding:'8px 6px',color:muted}}>{hasMeta&&md.cpl?fmtRp(md.cpl):'-'}</td>
                      <td style={{padding:'8px 6px',color:muted}}>{hasMeta&&md.cpm?fmtRp(md.cpm):'-'}</td>
                      <td style={{padding:'8px 6px',color:muted}}>{hasMeta&&md.impressions?Number(md.impressions).toLocaleString('id-ID'):'-'}</td>
                      <td style={{padding:'8px 6px',color:muted}}>{hasMeta&&md.reach?Number(md.reach).toLocaleString('id-ID'):'-'}</td>
                      <td style={{padding:'8px 6px',color:muted}}>{hasMeta&&md.frequency?md.frequency:'-'}</td>
                      <td style={{padding:'8px 6px',color:muted}}>{hasMeta&&md.ctr?md.ctr.toFixed(2)+'%':'-'}</td>
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
                    {isExpanded && hasDailyData && monthDaily.map((day,di)=>(
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
          {/* Action buttons */}
          <div style={{display:'flex',gap:8,marginBottom:20}}>
            <Button size="sm" variant="primary" disabled={syncing} onClick={async()=>{
              setSyncing(true);
              try {
                const res=await fetch(baseUrl+'/crm/leads/recompute-all',{method:'POST'});
                const data=await res.json();
                alert(data.message||'Sync selesai');
                fetchAll();
              } catch(e){ alert('Gagal sync data'); }
              setSyncing(false);
            }}>{syncing?<Spinner size="sm"/>:'🔄 Sync Data Invoice'}</Button>
            <Button size="sm" variant="outline-secondary" disabled={syncing} onClick={async()=>{
              setSyncing(true);
              try {
                const res=await fetch(baseUrl+'/crm/leads/backfill-tanggal-deal',{method:'POST'});
                const data=await res.json();
                alert(data.message||'Backfill selesai');
                fetchAll();
              } catch(e){ alert('Gagal backfill'); }
              setSyncing(false);
            }}>{syncing?<Spinner size="sm"/>:'📅 Backfill Tgl. Invoice'}</Button>
            <Button size="sm" variant="dark" onClick={()=>{
              const exportData={period:filterBulan||'Semua',metaLeads:metaLeadsTotal,totalDeals:dealLeads.length,dealsFromAds:adsDealLeads.length,convRate:convRateMeta,totalRevenue:revenueTotal,revenueFromAds,totalGrossProfit:gpTotal,grossProfitFromAds:gpFromAds,totalSpendAds:totalSpend,totalProfitFromAds,campaigns:filteredCampaigns.map(c=>{const m=getCampaignMonthData(c,filterBulan)||{};return {nama:c.nama,spend:m.spend||0,results:m.results||0,leads:filteredLeads.filter(l=>l.campaign_id===c.id).length,deal:filteredLeads.filter(l=>l.campaign_id===c.id&&l.stage==='deal').length};})};
              const blob=new Blob([JSON.stringify(exportData,null,2)],{type:'application/json'});
              const url=URL.createObjectURL(blob);
              const a=document.createElement('a');a.href=url;a.download=`crm-analytics-${filterBulan||'all'}.json`;a.click();URL.revokeObjectURL(url);
            }}>⬇ Export JSON</Button>
          </div>

          {/* Summary Cards Row 1 — supporting metrics */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:12}}>
            {[
              {label:'Meta Leads',value:metaLeadsTotal,color:'#378ADD',sub:'lead masuk dari campaign'},
              {label:'Total Deals',value:dealLeads.length,color:'#639922',sub:`${adsDealLeads.length} dari ads`},
              {label:'Conversion Rate',value:(convRateMeta||0)+'%',color:'#7F77DD',sub:'Deal Ads ÷ Leads Meta'},
              {label:'Total Spend Ads',value:fmtRp(totalSpend),color:'#a32d2d',sub:'spend campaign bulan ini'},
            ].map((m,i)=>(
              <div key={i} style={{background:cardBg,border,borderRadius:10,padding:'16px 18px'}}>
                <div style={{fontSize:11,color:muted,marginBottom:4,fontWeight:500}}>{m.label}</div>
                <div style={{fontSize:20,fontWeight:700,color:m.color}}>{m.value}</div>
                {m.sub&&<div style={{fontSize:10,color:muted,marginTop:2}}>{m.sub}</div>}
              </div>
            ))}
          </div>

          {/* Summary Cards Row 2 — Total vs From Ads (Revenue & Gross Profit) */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:12}}>
            {[
              {label:'Total Revenue',value:fmtRp(revenueTotal),color:'#013175',sub:'semua deal (ads + organic + repeat)'},
              {label:'Revenue from Ads',value:fmtRp(revenueFromAds),color:'#1877F2',sub:'new customer dari campaign',highlight:true},
              {label:'Total Gross Profit',value:fmtRp(gpTotal),color:'#EF9F27',sub:'semua deal'},
              {label:'Gross Profit from Ads',value:fmtRp(gpFromAds),color:'#E07B00',sub:'new customer dari campaign',highlight:true},
            ].map((m,i)=>(
              <div key={i} style={{background:m.highlight?(dark?'#1a2438':'#f0f6ff'):cardBg,border:m.highlight?'1px solid '+(dark?'#2a4a7a':'#bcd6ff'):border,borderRadius:10,padding:'16px 18px'}}>
                <div style={{fontSize:11,color:muted,marginBottom:4,fontWeight:500}}>{m.label}</div>
                <div style={{fontSize:20,fontWeight:700,color:m.color}}>{m.value}</div>
                {m.sub&&<div style={{fontSize:10,color:muted,marginTop:2}}>{m.sub}</div>}
              </div>
            ))}
          </div>

          {/* Total Profit from Ads — metrik keputusan (highlight besar) */}
          <div style={{background:totalProfitFromAds>=0?(dark?'#16291a':'#edf7ee'):(dark?'#2a1717':'#fdeeee'),border:'1.5px solid '+(totalProfitFromAds>=0?'#639922':'#a32d2d'),borderRadius:12,padding:'18px 22px',marginBottom:24,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
            <div>
              <div style={{fontSize:12,color:muted,fontWeight:600,marginBottom:4}}>TOTAL PROFIT FROM ADS</div>
              <div style={{fontSize:13,color:muted}}>Gross Profit from Ads ({fmtRp(gpFromAds)}) − Total Spend Ads ({fmtRp(totalSpend)})</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:30,fontWeight:800,color:totalProfitFromAds>=0?'#639922':'#a32d2d'}}>{totalProfitFromAds>=0?'+':''}{fmtRp(totalProfitFromAds)}</div>
              <div style={{fontSize:12,fontWeight:700,color:totalProfitFromAds>=0?'#639922':'#a32d2d'}}>{totalProfitFromAds>=0?'▲ Iklan membiayai diri sendiri':'▼ Iklan boncos — pertimbangkan ganti'}</div>
            </div>
          </div>

          {/* Funnel Konversi */}
          <div style={{background:cardBg,border,borderRadius:12,padding:20,marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:muted,letterSpacing:1,marginBottom:16}}>FUNNEL KONVERSI</div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
              {[
                {label:'Leads',count:metaLeadsTotal||filteredLeads.length,color:'#378ADD',bg:'#EAF3FB',pct:100},
                ...STAGES.slice(1).map(stage=>{
                  const count=filteredLeads.filter(l=>l.stage_dates?.[stage.key]).length;
                  const base=metaLeadsTotal||filteredLeads.length||1;
                  return {label:stage.label,count,color:stage.color,bg:stage.bg,pct:((count/base)*100).toFixed(0)};
                })
              ].map((item,i,arr)=>{
                const widthPct = 100 - i*13;
                return <div key={i} style={{width:`${widthPct}%`,background:item.bg,borderRadius:4,padding:'12px 8px',textAlign:'center',position:'relative'}}>
                  <span style={{fontSize:26,fontWeight:800,color:item.color}}>{item.count}</span>
                  <span style={{fontSize:12,color:item.color,fontWeight:600,marginLeft:8}}>{i===0?'100% Leads':`${item.pct}% ${item.label}`}</span>
                </div>;
              })}
            </div>
          </div>

          {/* Performa per Sumber */}
          <div style={{background:cardBg,border,borderRadius:12,padding:20}}>
            <div style={{fontSize:11,fontWeight:700,color:muted,letterSpacing:1,marginBottom:16}}>PERFORMA PER SUMBER</div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:'2px solid '+(dark?'#333':'#eee')}}>
                    {['Sumber','Spend','Leads Meta','Leads CRM','Good','Quot.','Deal (New)','Rev. New','Deal (Repeat)','Rev. Repeat','Conv. Rate','ROAS','Gross Profit','Ads Profit','Status'].map((h,i)=>(
                      <th key={i} style={{padding:'8px 8px',color:muted,fontWeight:600,whiteSpace:'nowrap',textAlign:i>0?'center':'left'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map(camp=>{
                    const hasMeta=camp.source==='meta_ads';
                    const md=getCampaignMonthData(camp, filterBulan)||{};
                    const mdSpend=md.spend||0, mdResults=md.results||0;
                    const cl=filteredLeadsMasuk.filter(l=>l.campaign_id===camp.id);
                    const cgood=cl.filter(l=>l.stage==='good').length;
                    const cquot=cl.filter(l=>l.stage==='quotation').length;
                    // Pisah new vs repeat
                    const cnew=cl.filter(l=>l.stage==='deal'&&!l.is_repeat_order);
                    const crepeat=cl.filter(l=>l.stage==='deal'&&l.is_repeat_order);
                    const revNew=cnew.reduce((s,l)=>s+(l.deal_value||0),0);
                    const revRepeat=crepeat.reduce((s,l)=>s+(l.deal_value||0),0);
                    const gp=cnew.reduce((s,l)=>s+(l.gross_profit||0),0); // GP dari new only
                    const adsProfit=gp-mdSpend;
                    const roas=mdSpend>0&&revNew>0?revNew/mdSpend:null; // ROAS dari new only
                    const convBase=hasMeta?mdResults:cl.length;
                    const convRate=convBase>0?((cnew.length/convBase)*100).toFixed(0):0;
                    const winning=adsProfit>0;
                    return <tr key={camp.id} style={{borderBottom:'1px solid '+(dark?'#2a2a2a':'#f5f5f5')}}>
                      <td style={{padding:'8px 8px',minWidth:140}}>
                        <div style={{fontWeight:600,color:text,fontSize:13}}>{camp.nama}</div>
                        {hasMeta&&<span style={{fontSize:10,background:'#E7F3FF',color:'#1877F2',padding:'1px 5px',borderRadius:3,fontWeight:600}}>Meta Ad Set</span>}
                      </td>
                      <td style={{padding:'8px 8px',textAlign:'center',color:text}}>{mdSpend?fmtRp(mdSpend):'—'}</td>
                      <td style={{padding:'8px 8px',textAlign:'center',fontWeight:600,color:'#378ADD'}}>{hasMeta?mdResults:'—'}</td>
                      <td style={{padding:'8px 8px',textAlign:'center'}}>{cl.length}</td>
                      <td style={{padding:'8px 8px',textAlign:'center'}}>{cgood||0}</td>
                      <td style={{padding:'8px 8px',textAlign:'center'}}>{cquot||0}</td>
                      <td style={{padding:'8px 8px',textAlign:'center',fontWeight:700,color:'#013175'}}>{cnew.length}</td>
                      <td style={{padding:'8px 8px',textAlign:'center',color:'#013175',fontWeight:600}}>{cnew.length>0?fmtRp(revNew):'—'}</td>
                      <td style={{padding:'8px 8px',textAlign:'center',fontWeight:700,color:'#EF9F27'}}>{crepeat.length||'—'}</td>
                      <td style={{padding:'8px 8px',textAlign:'center',color:'#EF9F27',fontWeight:600}}>{crepeat.length>0?fmtRp(revRepeat):'—'}</td>
                      <td style={{padding:'8px 8px',textAlign:'center'}}>{convBase>0?convRate+'%':'—'}</td>
                      <td style={{padding:'8px 8px',textAlign:'center',fontWeight:700,color:roas===null?muted:roas>=8?'#639922':roas>=3?'#EF9F27':'#a32d2d'}}>{roas===null?'—':roas.toFixed(1)+'x'}</td>
                      <td style={{padding:'8px 8px',textAlign:'center',color:'#EF9F27',fontWeight:600}}>{gp>0?fmtRp(gp):'—'}</td>
                      <td style={{padding:'8px 8px',textAlign:'center',fontWeight:700,color:mdSpend>0?(winning?'#639922':'#a32d2d'):muted}}>
                        {mdSpend>0?(winning?'+':'')+fmtRp(adsProfit):'—'}
                      </td>
                      <td style={{padding:'8px 8px',textAlign:'center'}}>
                        {mdSpend>0?<span style={{fontSize:11,fontWeight:700,color:winning?'#639922':'#a32d2d',background:winning?'#EDF5E1':'#FFF0F0',padding:'2px 8px',borderRadius:12}}>
                          {winning?'▲ Winning':'▼ Losing'}
                        </span>:'—'}
                      </td>
                    </tr>;
                  })}
                </tbody>
              </table>
              <div style={{fontSize:10,color:muted,marginTop:8}}>
                * Leads, Deal, ROAS & Conv. Rate diatribusikan by tanggal lead masuk. Total Revenue & GP Summary Cards by tanggal invoice. Pipeline by tanggal invoice.
              </div>
            </div>
          </div>

          {/* Customer Lifetime Value section */}
          {filteredCampaigns.some(c=>filteredLeads.some(l=>l.campaign_id===c.id&&l.is_repeat_order))&&(
            <div style={{background:cardBg,border,borderRadius:12,padding:20,marginTop:20}}>
              <div style={{fontSize:11,fontWeight:700,color:muted,letterSpacing:1,marginBottom:16}}>CUSTOMER LIFETIME VALUE PER CAMPAIGN</div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead>
                    <tr style={{borderBottom:'2px solid '+(dark?'#333':'#eee')}}>
                      {['Campaign','New Customer','Rev. New','Repeat Orders','Rev. Repeat','CLV Total','CLV per Deal'].map((h,i)=>(
                        <th key={i} style={{padding:'8px 8px',color:muted,fontWeight:600,whiteSpace:'nowrap',textAlign:i>0?'center':'left'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map(camp=>{
                      const cnew=filteredLeadsMasuk.filter(l=>l.campaign_id===camp.id&&l.stage==='deal'&&!l.is_repeat_order);
                      const crepeat=filteredLeadsMasuk.filter(l=>l.campaign_id===camp.id&&l.stage==='deal'&&l.is_repeat_order);
                      const revNew=cnew.reduce((s,l)=>s+(l.deal_value||0),0);
                      const revRepeat=crepeat.reduce((s,l)=>s+(l.deal_value||0),0);
                      const clvTotal=revNew+revRepeat;
                      const totalDeals=cnew.length+crepeat.length;
                      if(totalDeals===0) return null;
                      return <tr key={camp.id} style={{borderBottom:'1px solid '+(dark?'#2a2a2a':'#f5f5f5')}}>
                        <td style={{padding:'8px 8px',fontWeight:600,color:text}}>{camp.nama}</td>
                        <td style={{padding:'8px 8px',textAlign:'center',color:'#013175',fontWeight:700}}>{cnew.length}</td>
                        <td style={{padding:'8px 8px',textAlign:'center',color:'#013175'}}>{fmtRp(revNew)}</td>
                        <td style={{padding:'8px 8px',textAlign:'center',color:'#EF9F27',fontWeight:700}}>{crepeat.length||'—'}</td>
                        <td style={{padding:'8px 8px',textAlign:'center',color:'#EF9F27'}}>{crepeat.length>0?fmtRp(revRepeat):'—'}</td>
                        <td style={{padding:'8px 8px',textAlign:'center',fontWeight:800,color:'#639922',fontSize:14}}>{fmtRp(clvTotal)}</td>
                        <td style={{padding:'8px 8px',textAlign:'center',color:muted}}>{totalDeals>0?fmtRp(Math.round(clvTotal/totalDeals)):'—'}</td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>}
      </>}

      {/* LEAD FORM */}
      <Modal show={showLeadModal} onHide={()=>setShowLeadModal(false)} className={mc}>
        <Modal.Header closeButton><Modal.Title style={{color:dark?'white':'black'}}>{editingLead?'Edit Lead':'Tambah Lead Baru'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2"><Form.Label style={{color:dark?'white':'black'}}>Nama Customer *</Form.Label><Form.Control value={leadForm.nama} onChange={e=>setLeadForm(f=>({...f,nama:e.target.value}))} placeholder="Nama customer"/></Form.Group>
          <Form.Group className="mb-2"><Form.Label style={{color:dark?'white':'black'}}>Tanggal Lead Masuk</Form.Label><Form.Control type="date" value={leadForm.tanggal_masuk||today} onChange={e=>setLeadForm(f=>({...f,tanggal_masuk:e.target.value}))}/></Form.Group>
          <Form.Group className="mb-2"><Form.Label style={{color:dark?'white':'black'}}>No. WhatsApp</Form.Label><Form.Control value={leadForm.wa} onChange={e=>setLeadForm(f=>({...f,wa:e.target.value}))} placeholder="+62 8xx xxxx xxxx"/></Form.Group>
          <Form.Group className="mb-2">
            <Form.Check type="checkbox" id="repeat-order-check"
              label={<span style={{color:dark?'white':'black',fontWeight:500}}>Repeat Order</span>}
              checked={leadForm.is_repeat_order||false}
              onChange={e=>setLeadForm(f=>({...f,is_repeat_order:e.target.checked}))}
            />
          </Form.Group>
          {leadForm.is_repeat_order ? <>
            <Form.Group className="mb-2"><Form.Label style={{color:dark?'white':'black'}}>Campaign Asal (untuk CLV)</Form.Label>
              <Form.Select value={leadForm.repeat_ref_campaign_id||''} onChange={e=>setLeadForm(f=>({...f,repeat_ref_campaign_id:e.target.value,campaign_id:e.target.value}))}>
                <option value="">Pilih campaign asal...</option>
                {campaigns.map(c=><option key={c.id} value={c.id}>{c.nama}</option>)}
              </Form.Select>
              <Form.Text style={{color:muted}}>Repeat order tidak masuk ROAS — hanya masuk CLV campaign asal.</Form.Text>
            </Form.Group>
          </> : <>
            <Form.Group className="mb-2"><Form.Label style={{color:dark?'white':'black'}}>Campaign Sumber</Form.Label>
              <Form.Select value={leadForm.campaign_id} onChange={e=>setLeadForm(f=>({...f,campaign_id:e.target.value}))}>
                <option value="">Organic / Tidak ada</option>
                {campaigns.map(c=><option key={c.id} value={c.id}>{c.nama}</option>)}
              </Form.Select>
            </Form.Group>
          </>}
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
                ['Tgl. Lead Masuk', fmtDate(detailLead.tanggal_masuk)],
                ['Tgl. Invoice', detailLead.tanggal_deal ? fmtDate(detailLead.tanggal_deal) : '-'],
                ['Deal Value', detailLead.deal_value ? fmtRp(detailLead.deal_value) : '-'],
                ['Dibuat', fmtDate(detailLead.created_at)]
              ].map(([label,val],i)=><tr key={i}><td style={{color:muted,paddingBottom:6,width:110}}>{label}</td><td style={{color:text,fontWeight:500,paddingBottom:6}}>{val}</td></tr>)}
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
              <Button size="sm" variant="outline-primary" onClick={()=>{setEditingLead(detailLead);setLeadForm({nama:detailLead.nama,wa:detailLead.wa||'',campaign_id:detailLead.campaign_id||'',notes:detailLead.notes||'',stage:detailLead.stage,tanggal_masuk:detailLead.tanggal_masuk||today,is_repeat_order:detailLead.is_repeat_order||false,repeat_ref_campaign_id:detailLead.repeat_ref_campaign_id||''});setShowLeadDetail(false);setShowLeadModal(true);}}><MdEdit/> Edit</Button>
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
