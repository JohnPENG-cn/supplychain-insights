"""ENSO（厄尔尼诺/拉尼娜）vs 大豆单产与价格（全部为自算）
可重复运行：python3 analysis.py            用本地原始文件
            python3 analysis.py --download 重新下载原始数据
数据源见 README.md。随机种子固定。
"""
import sys, os, re, csv, io, zipfile, subprocess
import numpy as np, pandas as pd
from scipy import stats
from statsmodels.tsa.filters.hp_filter import hpfilter
from statsmodels.nonparametric.smoothers_lowess import lowess
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager
_cjk=[f.name for f in font_manager.fontManager.ttflist if 'CJK SC' in f.name or 'Noto Sans SC' in f.name or 'WenQuanYi' in f.name or 'Source Han Sans' in f.name]
plt.rcParams['font.sans-serif']=(['Noto Sans CJK SC'] if 'Noto Sans CJK SC' in _cjk else _cjk[:1])+['DejaVu Sans']; plt.rcParams['axes.unicode_minus']=False
if not _cjk: print('警告：没有找到中文字体（请安装 fonts-noto-cjk），图中中文会显示成方块')
D=os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
SEED=20261126; RNG=np.random.default_rng(SEED); NSIM=3000

URL=dict(
 oni='https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt',
 roni='https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt',
 nass='https://release.nass.usda.gov/reports/croptr26.pdf',
 fao='https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_All_Data_(Normalized).zip',
 psd='https://apps.fas.usda.gov/psdonline/downloads/psd_oilseeds_csv.zip',
 wb='https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx',
 cpi='https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCSL')
def sh(c): subprocess.run(c,shell=True,check=True)
if '--download' in sys.argv:
    sh(f"curl -sL -o oni.txt {URL['oni']}"); sh(f"curl -sL -o roni.txt {URL['roni']}")
    sh(f"curl -sL -o cpi_fred.csv '{URL['cpi']}'"); sh(f"curl -sL -o cmo_monthly.xlsx {URL['wb']}")
    sh(f"curl -sL -o psd_oilseeds.zip {URL['psd']} && unzip -o -q psd_oilseeds.zip")
    sh(f"curl -sL -o croptr26.pdf {URL['nass']} && pdftotext -layout croptr26.pdf croptr26.txt")
    sh(f"curl -sL -o fao.zip '{URL['fao']}'")
    for f in ['us_nass_soy.csv','fao_soy_raw.csv','wb_soy_monthly.csv','psd_soy.csv']:
        if os.path.exists(f): os.remove(f)

# ---------- 原始数据 → 小表（小表已随仓库提供，没有大文件也能跑） ----------
if not os.path.exists('us_nass_soy.csv'):
    L=open('croptr26.txt').read().split('\n')
    # 目录里有同名一行（带一串点和页码），正文标题行以换页符开头；取正文里的第一个，表格跨两页（1924– 和 1970–）
    i=[n for n,l in enumerate(L) if 'Soybean Area Planted and Harvested, Yield, Production, Price' in l and '....' not in l][0]
    rows=[]
    for l in L[i:i+140]:
        m=re.search(r'^(\d{4}) \.+\s+(.*)$',l)
        if m and m.group(1) not in [r_[0] for r_ in rows]: rows.append([m.group(1)]+[x.replace(',','') for x in m.group(2).split()])
    with open('us_nass_soy.csv','w',newline='') as fh:
        w=csv.writer(fh); w.writerow(['year','planted_kac','harvested_kac','yield_bu_ac','production_kbu','price_usd_bu','value_kusd']); w.writerows(rows)
if not os.path.exists('fao_soy_raw.csv'):
    z=zipfile.ZipFile('fao.zip'); f=[n for n in z.namelist() if 'All_Data' in n][0]
    r=csv.reader(io.TextIOWrapper(z.open(f),encoding='latin-1')); h=next(r)
    with open('fao_soy_raw.csv','w',newline='') as fh:
        w=csv.writer(fh); w.writerow(h)
        for row in r:
            if row[h.index('Item')]=='Soya beans' and row[h.index('Area')] in ('World','United States of America','Brazil','Argentina','China, mainland'): w.writerow(row)
if not os.path.exists('wb_soy_monthly.csv'):
    d=pd.read_excel('cmo_monthly.xlsx','Monthly Prices',header=None); j=d.iloc[4].tolist().index('Soybeans')
    m=d.iloc[6:,[0,j]].dropna(); m.columns=['month','soybeans_usd_mt_nominal']; m=m[m.month.astype(str).str.match(r'^\d{4}M\d{2}$')]
    m.to_csv('wb_soy_monthly.csv',index=False)
if not os.path.exists('psd_soy.csv'):
    p=pd.read_csv('psd_oilseeds.csv',dtype=str); p=p[p.Commodity_Description=='Oilseed, Soybean']
    p=p[p.Attribute_Description.isin(['Production','Yield','Area Harvested','Ending Stocks','Domestic Consumption','Exports','Imports'])]
    p['Value']=p.Value.astype(float)
    keep=p[p.Country_Name.isin(['Argentina','Brazil','United States','China'])]
    # 全球：PSD 没有 World 行；把各国加总，去掉欧盟合计行（European Union、EU-15）避免和成员国重复。自算
    w=p[~p.Country_Name.isin(['European Union','EU-15','World'])&p.Attribute_Description.isin(['Production','Ending Stocks','Domestic Consumption'])]
    w=w.groupby(['Market_Year','Attribute_Description','Unit_Description'],as_index=False).Value.sum(); w['Country_Name']='World(各国加总,自算)'
    out=pd.concat([keep,w])[['Country_Name','Market_Year','Attribute_Description','Unit_Description','Value']]
    out['Value']=out.Value.astype(float).round(4); out.to_csv('psd_soy.csv',index=False)
    print('PSD 版本（Calendar_Year-Month 最新）:',p.Calendar_Year.max(),p[p.Calendar_Year==p.Calendar_Year.max()].Month.max())

us=pd.read_csv('us_nass_soy.csv').set_index('year')
fao=pd.read_csv('fao_soy_raw.csv')
def fs(area,el): return fao[(fao.Area==area)&(fao.Element==el)].set_index('Year').Value.astype(float)
psd=pd.read_csv('psd_soy.csv'); psd['Value']=psd.Value.astype(float); psd['Market_Year']=psd.Market_Year.astype(int)
def ps(c,a): return psd[(psd.Country_Name==c)&(psd.Attribute_Description==a)].set_index('Market_Year').Value
wb=pd.read_csv('wb_soy_monthly.csv'); wb['p']=[pd.Period(s.replace('M','-'),'M') for s in wb.month]; wb=wb.set_index('p').soybeans_usd_mt_nominal.astype(float)
cpi=pd.read_csv('cpi_fred.csv'); cpi['p']=pd.PeriodIndex(pd.to_datetime(cpi.iloc[:,0]),freq='M'); cpi=cpi.set_index('p').iloc[:,1].astype(float)

# ---------- ENSO ----------
SEAS=['DJF','JFM','FMA','MAM','AMJ','MJJ','JJA','JAS','ASO','SON','OND','NDJ']  # 中间月 = 1..12
def read_idx(fn, col):
    t=pd.read_csv(fn,sep=r'\s+'); t.columns=[c.upper() for c in t.columns]
    t['m']=t.SEAS.map({s:i+1 for i,s in enumerate(SEAS)}); t['p']=[pd.Period(f'{y}-{m:02d}','M') for y,m in zip(t.YR,t.m)]
    return t.set_index('p')[col].astype(float)
ONI_M=read_idx('oni.txt','ANOM')      # 以三个月的中间月为索引；CPC 文件里 YR=中间月所在年
RONI_M=read_idx('roni.txt','ANOM')
def season(ser, s, shift=0):
    """取某个三个月季节；返回以作物年为索引的序列。shift=1 表示该季节在作物年的上一年"""
    m=SEAS.index(s)+1; x=ser[[p.month==m for p in ser.index]]; return pd.Series(x.values,index=[p.year+shift for p in x.index])
ONI={'JJA':season(ONI_M,'JJA'),'JAS':season(ONI_M,'JAS'),'DJF':season(ONI_M,'DJF'),'NDJ':season(ONI_M,'NDJ',1),'JFM':season(ONI_M,'JFM')}
ONI_CAL=pd.Series(ONI_M.values,index=[p.year for p in ONI_M.index]).groupby(level=0).mean()
RONI={'JJA':season(RONI_M,'JJA'),'DJF':season(RONI_M,'DJF')}
RONI_CAL=pd.Series(RONI_M.values,index=[p.year for p in RONI_M.index]).groupby(level=0).mean()

# ---------- 单产去趋势 ----------
def detrend(x, how='HP'):
    x=x.dropna(); x=x[x>0]; lx=np.log(x)
    if how=='HP': cyc,tr=hpfilter(lx.values,lamb=100); return pd.Series(cyc*100,index=x.index)
    if how=='LOESS':
        tr=lowess(lx.values,x.index.values,frac=min(1,31/len(x)),it=1,return_sorted=False); return pd.Series((lx.values-tr)*100,index=x.index)
    if how=='YoY': return (lx.diff()*100).dropna()
# 南美：FAO 年份=收获年；PSD 的 Market_Year=播种年（例：阿根廷 MY2022=2022/23 季，2023 年收获，PSD 产量 25.0 百万吨），所以 +1
psd_sa=lambda c: pd.Series(ps(c,'Yield').values,index=ps(c,'Yield').index+1)
SER={  # 名称 -> (单产, 主季节键, 期间)
 '美国(NASS)':(us.yield_bu_ac,'JJA',(1950,2025)),
 '巴西(FAO)':(fs('Brazil','Yield'),'DJF',(1961,2024)),
 '阿根廷(FAO)':(fs('Argentina','Yield'),'DJF',(1961,2024)),
 '中国(FAO)':(fs('China, mainland','Yield'),'JJA',(1961,2024)),
 '全球(FAO)':(fs('World','Yield'),'CAL',(1961,2024)),
}
SER_PSD={'巴西(PSD,至2026收获)':(psd_sa('Brazil'),'DJF',(1965,2026)),'阿根廷(PSD,至2026收获)':(psd_sa('Argentina'),'DJF',(1965,2026))}
def oni_of(key, roni=False):
    if key=='CAL': return RONI_CAL if roni else ONI_CAL
    return (RONI if roni else ONI)[key]

def r1(a): a=np.asarray(a,float)-np.mean(a); return np.sum(a[1:]*a[:-1])/np.sum(a*a)
def corr_adj(a,b):
    d=pd.concat([a,b],axis=1,join='inner').dropna()
    n=len(d); r=np.corrcoef(d.iloc[:,0],d.iloc[:,1])[0,1]; ra,rb=r1(d.iloc[:,0]),r1(d.iloc[:,1])
    neff=min(n,max(3,n*(1-ra*rb)/(1+ra*rb)))   # Bretherton 等 1999
    t=r*np.sqrt((neff-2)/max(1e-9,1-r*r)); return r,n,2*stats.t.sf(abs(t),neff-2),neff
def phase_surr(x,n):
    x=np.asarray(x,float); m=x.mean(); X=np.fft.rfft(x-m); out=np.empty((n,len(x)))
    for i in range(n):
        ph=RNG.uniform(0,2*np.pi,len(X)); ph[0]=0
        if len(x)%2==0: ph[-1]=0
        out[i]=np.fft.irfft(np.abs(X)*np.exp(1j*ph),n=len(x))+m
    return out
SURR={}
def surr_of(o):
    k=(o.index[0],o.index[-1],round(float(o.sum()),4))
    if k not in SURR: SURR[k]=pd.DataFrame(phase_surr(o.values,NSIM).T,index=o.index)
    return SURR[k]
def corr_surr(y,o):
    """ENSO 指数做随机相位替身（保留它自己的自相关/频谱），双尾 p"""
    o=o.dropna(); S=surr_of(o); idx=y.dropna().index.intersection(o.index)
    r=np.corrcoef(y[idx],o[idx])[0,1]; yy=y[idx].values-y[idx].mean()
    Ss=S.loc[idx].values; Ss=(Ss-Ss.mean(0))/Ss.std(0); rs=(yy[:,None]*Ss).sum(0)/(len(idx)*yy.std())
    return (np.sum(np.abs(rs)>=abs(r))+1)/(NSIM+1)
def phase_lab(v, th=0.5): return np.where(v>=th,'厄尔尼诺',np.where(v<=-th,'拉尼娜','中性'))
def comp_test(y,o):
    """厄尔尼诺年平均 - 拉尼娜年平均；p 用替身 ENSO 序列重新分组"""
    o=o.dropna(); idx=y.dropna().index.intersection(o.index); yy=y[idx]; oo=o[idx]
    def diff(v): v=np.asarray(v); a=yy.values[v>=0.5]; b=yy.values[v<=-0.5]; return (a.mean() if len(a) else np.nan)-(b.mean() if len(b) else np.nan)
    obs=diff(oo.values); S=surr_of(o).loc[idx].values
    null=np.array([diff(S[:,i]) for i in range(NSIM)]); null=null[~np.isnan(null)]
    return obs,(np.sum(np.abs(null)>=abs(obs))+1)/(len(null)+1)

# ---------- 1. 相关 ----------
rows=[]; ANOM={}
for name,(y,key,(a,b)) in {**SER,**SER_PSD}.items():
    for how in ['HP','LOESS','YoY']:
        an=detrend(y,how); ANOM[(name,how)]=an; an=an.loc[a:b]
        for k2 in ([key] if key=='CAL' else ([key,'JAS'] if key=='JJA' else [key,'NDJ','JFM'])):
            for ro in [False,True]:
                if ro and (how!='HP' or k2 not in ('JJA','DJF','CAL')): continue
                o=oni_of(k2,ro); r,n,p,ne=corr_adj(an,o); ps_=corr_surr(an,o)
                rows.append(dict(series=name,detrend=how,enso_index='RONI' if ro else 'ONI',season=k2,period=f'{max(a,int(an.index.min()))}-{min(b,int(an.index.max()))}',N=n,r=r,p_adj=p,N_eff=ne,p_surrogate=ps_))
R=pd.DataFrame(rows); R.to_csv('results_corr.csv',index=False,float_format='%.4f')
MAIN=R[(R.detrend=='HP')&(R.enso_index=='ONI')&(R.season==R.series.map(lambda s:{**SER,**SER_PSD}[s][1]))]
print(MAIN[['series','period','N','r','p_adj','p_surrogate']].to_string())

# ---------- 2. 分组平均 ----------
crow=[]
for name,(y,key,(a,b)) in SER.items():
    an=ANOM[(name,'HP')].loc[a:b]; o=oni_of(key); idx=an.index.intersection(o.dropna().index); an=an[idx]; oo=o[idx]
    lab=phase_lab(oo.values)
    for g in ['厄尔尼诺','中性','拉尼娜']:
        v=an.values[lab==g]; crow.append(dict(series=name,season=key,group=g,n=len(v),mean_anom_pct=v.mean(),median=np.median(v),share_above_trend=(v>0).mean(),years=' '.join(str(i) for i in idx[lab==g])))
    v=an.values[oo.values>=1.5]; crow.append(dict(series=name,season=key,group='强厄尔尼诺(≥1.5)',n=len(v),mean_anom_pct=v.mean() if len(v) else np.nan,median=np.median(v) if len(v) else np.nan,share_above_trend=(v>0).mean() if len(v) else np.nan,years=' '.join(str(i) for i in idx[oo.values>=1.5])))
    v=an.values[oo.values<=-1.0]; crow.append(dict(series=name,season=key,group='较强拉尼娜(≤-1.0)',n=len(v),mean_anom_pct=v.mean() if len(v) else np.nan,median=np.median(v) if len(v) else np.nan,share_above_trend=(v>0).mean() if len(v) else np.nan,years=' '.join(str(i) for i in idx[oo.values<=-1.0])))
    obs,p=comp_test(an,o); crow.append(dict(series=name,season=key,group='厄尔尼诺-拉尼娜 差值',n=np.nan,mean_anom_pct=obs,p_surrogate=p))
C=pd.DataFrame(crow); C.to_csv('results_composite.csv',index=False,float_format='%.3f'); print(C[['series','group','n','mean_anom_pct','p_surrogate','years']].to_string())

# 指定的四次强厄尔尼诺：对应作物年
EV={'1982-83':(1982,1983),'1997-98':(1997,1998),'2015-16':(2015,2016),'2023-24':(2023,2024)}
erow=[]
for ev,(yn,ys) in EV.items():
    d=dict(event=ev,ONI_JJA_onset=ONI['JJA'].get(yn),ONI_DJF_peak=ONI['DJF'].get(ys))
    for name,(y,key,_) in SER.items():
        yr=yn if key=='JJA' else ys if key=='DJF' else ys
        d[name+'_crop_year']=yr; d[name+'_anom_pct']=ANOM[(name,'HP')].get(yr)
    for name in SER_PSD: d[name+'_anom_pct']=ANOM[(name,'HP')].get(ys)
    erow.append(d)
E=pd.DataFrame(erow); E.to_csv('results_strong_events.csv',index=False,float_format='%.2f'); print(E.T)

# ---------- 5. 稳健性 ----------
rob=[]
for name,(y,key,(a,b)) in {**SER,**SER_PSD}.items():
    an=ANOM[(name,'HP')]; o=oni_of(key); a=max(a,int(an.index.min())); b=min(b,int(an.index.max())); mid=(a+b)//2
    for lab,(x0,x1) in [('前半段',(a,mid)),('后半段',(mid+1,b)),('全期',(a,b))]:
        r,n,p,_=corr_adj(an.loc[x0:x1],o); rob.append(dict(series=name,test=lab,period=f'{x0}-{x1}',N=n,r=r,p_adj=p))
    base=an.loc[a:b]; idx=base.index.intersection(o.dropna().index)
    strong=[i for i in idx if abs(o[i])>=1.5]
    if not strong: strong=list(o[idx].abs().sort_values().index[-4:])   # 该季节没有 |ONI|≥1.5 时，用 |ONI| 最大的 4 年
    for yv in strong:
        r,n,p,_=corr_adj(base.drop(yv),o); rob.append(dict(series=name,test=f'去掉 {yv}（ONI {o[yv]:+.1f}）',period=f'{a}-{b}',N=n,r=r,p_adj=p))
    lab_s=('去掉全部 |ONI|≥1.5 的年份(' if all(abs(o[i])>=1.5 for i in strong) else '去掉 |ONI| 最大的 4 年(')+' '.join(map(str,sorted(strong)))+')'
    r,n,p,_=corr_adj(base.drop(strong),o); rob.append(dict(series=name,test=lab_s,period=f'{a}-{b}',N=n,r=r,p_adj=p))
    top=base[idx].abs().sort_values().index[-3:]
    r,n,p,_=corr_adj(base.drop(top),o); rob.append(dict(series=name,test='去掉偏差最大的 3 年('+' '.join(map(str,sorted(top)))+')',period=f'{a}-{b}',N=n,r=r,p_adj=p))
    rs=[corr_adj(base.drop(i),o)[0] for i in idx]; rob.append(dict(series=name,test=f'逐年去掉一年：r 最小 {min(rs):.3f} / 最大 {max(rs):.3f}',period=f'{a}-{b}',N=len(idx)-1,r=np.nan,p_adj=np.nan))
RB=pd.DataFrame(rob); RB.to_csv('results_robustness.csv',index=False,float_format='%.4f'); print(RB.to_string())

# ---------- 3. 价格 ----------
cpi_now=cpi.iloc[-1]; base_lab=str(cpi.index[-1])
px=pd.concat([wb.rename('nom'),cpi.rename('cpi')],axis=1).loc[wb.index[0]:wb.index[-1]]
px=px.reindex(pd.period_range(px.index[0],px.index[-1],freq='M'))
CPI_GAP=[str(p) for p in px.index[px.cpi.isna()]]   # FRED 缺 2025-10（美国政府停摆，BLS 未发布），线性插值补上
px['cpi']=px.cpi.interpolate(); px=px.dropna(subset=['nom'])
px['real']=px.nom*cpi_now/px.cpi; px['d12']=np.log(px.real).diff(12)*100
px.to_csv('price_monthly.csv',float_format='%.3f',index_label='month')
oni_m=ONI_M.copy()
prow=[]; best=(0,None)
om=oni_m; Som=pd.DataFrame(phase_surr(om.values,NSIM).T,index=om.index)
null_max=np.zeros(NSIM)
for L in range(0,19):   # ONI 领先 L 个月
    s=oni_m.copy(); s.index=s.index+L; d=pd.concat([px.d12,s.rename('o')],axis=1,join='inner').dropna()
    r=np.corrcoef(d.d12,d.o)[0,1]; rr,n,p,ne=corr_adj(d.d12,d.o)
    Ss=Som.copy(); Ss.index=Ss.index+L; Ss=Ss.loc[d.index].values; Ss=(Ss-Ss.mean(0))/Ss.std(0); yy=(d.d12.values-d.d12.mean())/d.d12.std()
    rs=(yy[:,None]*Ss).mean(0); null_max=np.maximum(null_max,np.abs(rs))
    prow.append(dict(oni_lead_months=L,N_months=n,r=r,N_eff=ne,p_adj=p,p_surr_single=(np.sum(np.abs(rs)>=abs(r))+1)/(NSIM+1)))
P=pd.DataFrame(prow); i=P.r.abs().idxmax(); P['p_surr_max_over_lags']=np.nan; P.loc[i,'p_surr_max_over_lags']=(np.sum(null_max>=abs(P.r[i]))+1)/(NSIM+1)
P.to_csv('results_price_lag.csv',index=False,float_format='%.4f'); print(P.to_string())
# 大行情：用户列的几段，找各段实际价格高点、之前 24 个月低点、当时 ENSO
RALLY={'1973':('1972-01','1974-12'),'1988':('1987-06','1989-06'),'2007-08':('2006-06','2008-12'),'2012':('2011-06','2013-06'),'2020-22':('2020-01','2022-12')}
rrow=[]
for k,(a,b) in RALLY.items():
    seg=px.real.loc[a:b]; pk=seg.idxmax(); lo_win=px.real.loc[pk-24:pk]; lo=lo_win.idxmin()
    o_win=oni_m.loc[lo:pk]
    rrow.append(dict(rally=k,trough_month=str(lo),peak_month=str(pk),real_rise_pct=(seg.max()/lo_win.min()-1)*100,nominal_peak_usd_mt=px.nom[pk],
        ONI_min_trough_to_peak=o_win.min(),ONI_max_trough_to_peak=o_win.max(),months_El=int((o_win>=0.5).sum()),months_La=int((o_win<=-0.5).sum()),months_total=len(o_win)))
RL=pd.DataFrame(rrow); RL.to_csv('results_rallies.csv',index=False,float_format='%.2f'); print(RL.to_string())
# 价格按收获年 DJF 分组：南美收获年 t 的 3 月到次年 3 月实际价格变化
grow=[]
for t in range(1961,2026):
    try: ch=(px.real[pd.Period(f'{t+1}-03','M')]/px.real[pd.Period(f'{t}-03','M')]-1)*100
    except KeyError: continue
    grow.append(dict(year=t,ONI_DJF=ONI['DJF'].get(t),ONI_JJA=ONI['JJA'].get(t),real_chg_Mar_to_Mar_pct=ch))
G=pd.DataFrame(grow).dropna(); G['phase_DJF']=phase_lab(G.ONI_DJF.values)
G.to_csv('results_price_by_year.csv',index=False,float_format='%.2f')
print(G.groupby('phase_DJF').real_chg_Mar_to_Mar_pct.agg(['count','mean','median']))
r_,n_,p_,_=corr_adj(G.set_index('year').real_chg_Mar_to_Mar_pct,G.set_index('year').ONI_DJF); print('price Mar-Mar vs DJF',r_,n_,p_)

# ---------- 库存消费比 ----------
def stu(c):
    es=ps(c,'Ending Stocks'); dc=ps(c,'Domestic Consumption'); ex=ps(c,'Exports'); return es/(dc+ex)*100
def world(a): return ps('World(各国加总,自算)',a)
ST=pd.DataFrame({'US_stocks_to_use_pct':stu('United States'),'World_ending_stocks_kt':world('Ending Stocks'),'World_dom_cons_kt':world('Domestic Consumption'),'World_production_kt':world('Production')})
ST['World_stocks_to_use_pct']=ST.World_ending_stocks_kt/ST.World_dom_cons_kt*100
ST.index.name='market_year'; ST.to_csv('results_stocks_to_use.csv',float_format='%.2f'); print(ST.tail(8))

# ---------- 数据集 ----------
yrs=range(1950,2027)
DS=pd.DataFrame(index=pd.Index(yrs,name='year'))
DS['ONI_JJA']=ONI['JJA']; DS['ONI_DJF(Dec上年-Feb当年)']=ONI['DJF']; DS['ONI_年均']=ONI_CAL; DS['RONI_JJA']=RONI['JJA']; DS['RONI_DJF']=RONI['DJF']
DS['美国单产_NASS_bu_ac']=us.yield_bu_ac
for a,c in [('World','全球'),('United States of America','美国'),('Brazil','巴西'),('Argentina','阿根廷'),('China, mainland','中国')]: DS[f'{c}单产_FAO_kg_ha']=fs(a,'Yield')
DS['巴西单产_PSD_t_ha(收获年)']=psd_sa('Brazil'); DS['阿根廷单产_PSD_t_ha(收获年)']=psd_sa('Argentina')
for name in list(SER)+list(SER_PSD): DS[f'偏差_{name}_HP_pct_自算']=ANOM[(name,'HP')]
ann=px.groupby(px.index.year).agg(nom=('nom','mean'),real=('real','mean'))
DS['大豆价格_世行_名义_usd_mt_年均']=ann.nom; DS[f'大豆价格_实际_{base_lab}美元_年均_自算']=ann.real
DS.to_csv('data.csv',float_format='%.4f')

# ---------- 图 ----------
SRC='数据：NOAA CPC ONI；FAOSTAT；USDA NASS/PSD；世界银行 Pink Sheet；FRED CPI。去趋势、相关、p 值均为自算'
O=MAIN.set_index('series')
# 图1 阿根廷单产偏差 vs ONI(DJF)
an=ANOM[('阿根廷(FAO)','HP')].loc[1961:2024]; o=ONI['DJF'].loc[1961:2024]
fig,ax=plt.subplots(figsize=(11,4.8)); ax.bar(an.index,an.values,color=['#2b8cbe' if v>=0 else '#e34a33' for v in an.values],label='阿根廷大豆单产偏离趋势 %（左轴，自算）')
ax.axhline(0,color='grey',lw=.6); ax.set_ylabel('单产偏离趋势 %'); ax2=ax.twinx(); ax2.plot(o.index,o.values,color='#8e44ad',lw=1.6,label='ONI 12–2 月（右轴，℃）')
ax.set_ylim(-42,27); ax2.set_ylim(-42/10.8,27/10.8); ax2.set_ylabel('ONI（℃），与左轴零线对齐')
rA=O.loc['阿根廷(FAO)']
for yv in [1983,1998,2016,2024,1989,2009,2018,2023]: ax.annotate(str(yv),(yv,an.get(yv,0)),textcoords='offset points',xytext=(0,6 if an.get(yv,0)>=0 else -12),ha='center',fontsize=7)
ax.set_title(f"阿根廷大豆单产偏差 vs 收获季 ENSO（1961–2024；同期 r={rA.r:.2f}，替身 p={rA.p_surrogate:.3f}，自算）",fontsize=11)
h1,l1=ax.get_legend_handles_labels(); h2,l2=ax2.get_legend_handles_labels(); ax.legend(h1+h2,l1+l2,fontsize=8,loc='lower left')
fig.text(.01,.01,SRC+'；年份=收获年，ONI 取上年 12 月到当年 2 月',fontsize=7); fig.tight_layout(rect=(0,.04,1,1)); fig.savefig('chart1_oni_vs_argentina.png',dpi=150); plt.close(fig)
# 图2 各产地相关
order=['阿根廷(FAO)','阿根廷(PSD,至2026收获)','美国(NASS)','巴西(FAO)','巴西(PSD,至2026收获)','中国(FAO)','全球(FAO)']
fig,ax=plt.subplots(figsize=(10,4.6)); vals=[O.loc[s].r for s in order]
ax.bar(range(len(order)),vals,color=['#8e44ad' if O.loc[s].p_surrogate<0.05 else '#bdc3c7' for s in order])
for i,s in enumerate(order): ax.text(i,vals[i],f"r={vals[i]:+.2f}\np={O.loc[s].p_surrogate:.3f}",ha='center',va='bottom' if vals[i]>=0 else 'top',fontsize=8)
ax.set_xticks(range(len(order))); ax.set_xticklabels([s.replace('(','\n(') +'\n'+O.loc[s].period+'·'+{'JJA':'6–8月','DJF':'12–2月','CAL':'年均'}[O.loc[s].season] for s in order],fontsize=8)
ax.axhline(0,color='grey',lw=.6); ax.set_ylim(min(vals)-.15,max(vals)+.15); ax.set_ylabel('r（HP 去趋势单产 vs ONI，自算）')
ax.set_title('哪里的大豆收成跟着 ENSO 走？（紫色=替身 p<0.05）',fontsize=11)
fig.text(.01,.01,SRC+'；p 为 ONI 随机相位替身检验（3000 次）',fontsize=7); fig.tight_layout(rect=(0,.04,1,1)); fig.savefig('chart2_corr_by_country.png',dpi=150); plt.close(fig)
# 图3 分组平均
ser3=['美国(NASS)','巴西(FAO)','阿根廷(FAO)','中国(FAO)','全球(FAO)']; groups=[('拉尼娜','#3182bd'),('中性','#bdbdbd'),('厄尔尼诺','#de2d26'),('强厄尔尼诺(≥1.5)','#a50f15')]
fig,ax=plt.subplots(figsize=(12,4.8)); w=.2
for gi,(g,col) in enumerate(groups):
    for si,s in enumerate(ser3):
        rw=C[(C.series==s)&(C.group==g)].iloc[0]; x=si+(gi-1.5)*w
        if rw.n==0: ax.text(x,0.1,'无',ha='center',va='bottom',fontsize=7,color='#a50f15'); continue
        ax.bar(x,rw.mean_anom_pct,w,color=col); ax.text(x,rw.mean_anom_pct,f"n={int(rw.n)}",ha='center',va='bottom' if rw.mean_anom_pct>=0 else 'top',fontsize=7)
for si,s in enumerate(ser3):
    pp=C[(C.series==s)&(C.group=='厄尔尼诺-拉尼娜 差值')].iloc[0]; ax.text(si,-9.3,f"厄-拉 差 {pp.mean_anom_pct:+.1f} 个百分点\n"+(f"p={pp.p_surrogate:.3f}" if pp.p_surrogate>=0.001 else "p<0.001"),ha='center',fontsize=8)
ax.set_xticks(range(len(ser3))); ax.set_xticklabels([s+'\n'+{'JJA':'按 6–8 月 ONI 分组','DJF':'按 12–2 月 ONI 分组','CAL':'按年均 ONI 分组'}[SER[s][1]] for s in ser3],fontsize=9)
ax.axhline(0,color='grey',lw=.6); ax.set_ylabel('平均单产偏离趋势 %（自算）'); from matplotlib.patches import Patch; ax.legend(handles=[Patch(color=c,label=g) for g,c in groups],fontsize=8,ncol=4,loc='upper left'); ax.set_ylim(-10,10)
ax.set_title('厄尔尼诺年、拉尼娜年、中性年：大豆单产平均偏离趋势多少',fontsize=11)
fig.text(.01,.01,SRC+'；阈值 ±0.5℃，强厄尔尼诺 ≥1.5℃；p 为替身 ENSO 重新分组',fontsize=7); fig.tight_layout(rect=(0,.04,1,1)); fig.savefig('chart3_composite.png',dpi=150); plt.close(fig)
# 图4 价格与 ENSO
fig,ax=plt.subplots(figsize=(12,4.8)); t=[p.to_timestamp() for p in px.index]
o_al=oni_m.reindex(px.index)
for p_,v in o_al.items():
    if pd.notna(v) and v>=0.5: ax.axvspan(p_.to_timestamp(),(p_+1).to_timestamp(),color='#fcbba1',lw=0)
    elif pd.notna(v) and v<=-0.5: ax.axvspan(p_.to_timestamp(),(p_+1).to_timestamp(),color='#c6dbef',lw=0)
ax.plot(t,px.real.values,color='#333',lw=1.3,label=f'大豆实际价格（{base_lab} 美元/吨，自算）'); ax.plot(t,px.nom.values,color='#e67e22',lw=.9,label='名义价格（美元/吨，世行）')
for _,rw in RL.iterrows():
    pk=pd.Period(rw.peak_month,'M'); ax.annotate(f"{rw.rally}\n实际 +{rw.real_rise_pct:.0f}%",(pk.to_timestamp(),px.real[pk]),textcoords='offset points',xytext=(0,8),ha='center',fontsize=8)
ax.set_ylabel('美元/吨'); ax.set_title('大豆价格的几次大行情和 ENSO（红底=厄尔尼诺月份，蓝底=拉尼娜月份）',fontsize=11)
ax.plot([],[],color='#fcbba1',lw=8,label='厄尔尼诺（ONI≥0.5）'); ax.plot([],[],color='#c6dbef',lw=8,label='拉尼娜（ONI≤-0.5）'); ax.set_ylim(0,px.real.max()*1.13); ax.legend(fontsize=8,loc='upper right')
fig.text(.01,.01,'数据：世界银行 Pink Sheet 月度大豆价格（名义）；FRED CPIAUCSL 折算实际价格（自算）；NOAA CPC ONI。涨幅=高点相对此前 24 个月低点，自算',fontsize=7); fig.tight_layout(rect=(0,.04,1,1)); fig.savefig('chart4_price_enso.png',dpi=150); plt.close(fig)
# 图5 当前这次 vs 过去强厄尔尼诺
fig,ax=plt.subplots(figsize=(10,4.6)); cols={'1972-73':'#bbbbbb','1982-83':'#1f77b4','1997-98':'#2ca02c','2015-16':'#9467bd','2023-24':'#8c564b'}
for ev,c in cols.items():
    y0=int(ev[:4]); s=[ONI_M.get(pd.Period(f'{y0}-{m:02d}','M')) if m<=12 else ONI_M.get(pd.Period(f'{y0+1}-{m-12:02d}','M')) for m in range(1,19)]
    ax.plot(range(1,19),s,color=c,lw=1.4,label=ev)
s=[ONI_M.get(pd.Period(f'2026-{m:02d}','M')) for m in range(1,13)]; ax.plot(range(1,13),s,color='#d62728',lw=2.6,marker='o',ms=3,label='2026（ONI，最新一格为 8–10 月）')
s=[RONI_M.get(pd.Period(f'2026-{m:02d}','M')) for m in range(1,13)]; ax.plot(range(1,13),s,color='#d62728',lw=1.2,ls='--',label='2026（RONI，CPC 讨论里判断强度用）')
ax.axhline(0.5,color='grey',ls=':',lw=.8); ax.axhline(1.5,color='grey',ls=':',lw=.8); ax.text(18.2,1.5,'强',fontsize=8,va='center'); ax.text(18.2,.5,'弱',fontsize=8,va='center')
ax.set_xticks(range(1,19)); ax.set_xticklabels(['1','2','3','4','5','6','7','8','9','10','11','12','次1','次2','次3','次4','次5','次6'],fontsize=8)
ax.set_xlabel('起始年的月份（三个月滑动的中间月）'); ax.set_ylabel('ONI（℃）'); ax.legend(fontsize=8,ncol=2)
ax.set_title('这一次厄尔尼诺和过去几次强事件比（ONI，三个月滑动平均）',fontsize=11)
fig.text(.01,.01,'数据：NOAA CPC ONI、RONI（截至 '+str(ONI_M.index[-1])+' 中间月）',fontsize=7); fig.tight_layout(rect=(0,.04,1,1)); fig.savefig('chart5_now_vs_past.png',dpi=150); plt.close(fig)
u26=ps('United States','Yield').get(2026); u25=ps('United States','Yield').get(2025)
print('美国 2026/27 USDA PSD 单产 t/ha',u26,'≈ bu/ac',u26/0.0672524,'；2025/26',u25,'；NASS 2025',us.yield_bu_ac.get(2025))
print('CPI 插值月份',CPI_GAP); print('最新 ONI',ONI_M.index[-1],ONI_M.iloc[-1],'RONI',RONI_M.index[-1],RONI_M.iloc[-1]); print('done')
