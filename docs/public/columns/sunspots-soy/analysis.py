"""太阳黑子 vs 大豆产量：相关性与领先滞后（全部为自算）
可重复运行：python3 analysis.py   （--download 重新下载原始数据）
数据源见 README.md
"""
import sys, os, re, csv, io, zipfile, subprocess
import numpy as np, pandas as pd
from scipy import stats
from statsmodels.tsa.filters.hp_filter import hpfilter
from statsmodels.nonparametric.smoothers_lowess import lowess
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
plt.rcParams['font.sans-serif']=['Noto Sans CJK SC','DejaVu Sans']; plt.rcParams['axes.unicode_minus']=False
D=os.path.dirname(os.path.abspath(__file__)); os.chdir(D)
RNG=np.random.default_rng(20261126); NSIM=3000; LAGS=range(-11,12)

URL=dict(
 sn_y='https://www.sidc.be/SILSO/INFO/snytotcsv.php',
 sn_m='https://www.sidc.be/SILSO/INFO/snmtotcsv.php',
 oni='https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt',
 nass='https://release.nass.usda.gov/reports/croptr26.pdf',
 fao='https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_All_Data_(Normalized).zip')
def sh(c): subprocess.run(c,shell=True,check=True)
if '--download' in sys.argv:
    sh(f"curl -sL -o sn_y.csv {URL['sn_y']}"); sh(f"curl -sL -o sn_m.csv {URL['sn_m']}"); sh(f"curl -sL -o oni.txt {URL['oni']}")
    sh(f"curl -sL -o croptr26.pdf {URL['nass']} && pdftotext -layout croptr26.pdf croptr26.txt")
    sh(f"curl -sL -o fao.zip '{URL['fao']}'")
    os.remove('us_nass_soy.csv') if os.path.exists('us_nass_soy.csv') else None
    os.remove('fao_soy_raw.csv') if os.path.exists('fao_soy_raw.csv') else None

# ---------- 读数据 ----------
sny=pd.read_csv('sn_y.csv',sep=';',header=None); sny=pd.Series(sny[1].values,index=(sny[0]-0.5).astype(int)); sny=sny[sny>=0]
snm=pd.read_csv('sn_m.csv',sep=';',header=None,usecols=[0,1,3]); snm.columns=['y','m','sn']; snm=snm[snm.sn>=0]
snm['p']=pd.PeriodIndex(year=snm.y,month=snm.m,freq='M') if False else [pd.Period(f'{a}-{b:02d}','M') for a,b in zip(snm.y,snm.m)]
snm=snm.set_index('p').sn
def sn_season(months_prev, months_cur):
    """季节平均黑子数：months_prev 为上一年的月份，months_cur 为当年月份"""
    out={}
    for y in range(1750,2027):
        ks=[pd.Period(f'{y-1}-{m:02d}','M') for m in months_prev]+[pd.Period(f'{y}-{m:02d}','M') for m in months_cur]
        v=[snm.get(k) for k in ks]
        if all(x is not None for x in v): out[y]=np.mean(v)
    return pd.Series(out)
SN_NH=sn_season([],[5,6,7,8,9])          # 北半球大豆生长季 5-9 月（美国、中国）
SN_SH=sn_season([10,11,12],[1,2,3])       # 南半球 10 月(上年)-3 月(收获年)（巴西、阿根廷，FAO 年份=收获年）
SN_CAL=sny                                 # 全球合计用日历年均值

oni=pd.read_csv('oni.txt',sep=r'\s+'); oni.columns=['seas','yr','tot','anom']
oni_s=lambda s: oni[oni.seas==s].set_index('yr').anom
ONI_NH=oni_s('JJA'); ONI_SH=oni_s('DJF')  # DJF 的 yr = 1 月所在年 = 南美收获年
ONI_CAL=oni.groupby('yr').anom.mean()

if not os.path.exists('us_nass_soy.csv'):
    L=open('croptr26.txt').read().split('\n'); i=[n for n,l in enumerate(L) if l.startswith('Soybean Area Planted and Harvested, Yield, Production, Price')][0]
    rows=[]
    for l in L[i:i+140]:
        m=re.search(r'^(\d{4}) \.+\s+(.*)$',l)
        if m: rows.append([m.group(1)]+[x.replace(',','') for x in m.group(2).split()])
    w=csv.writer(open('us_nass_soy.csv','w',newline='')); w.writerow(['year','planted_kac','harvested_kac','yield_bu_ac','production_kbu','price_usd_bu','value_kusd']); w.writerows(rows)
us=pd.read_csv('us_nass_soy.csv').set_index('year')
if not os.path.exists('fao_soy_raw.csv'):
    z=zipfile.ZipFile('fao.zip'); f=[n for n in z.namelist() if 'All_Data' in n][0]
    r=csv.reader(io.TextIOWrapper(z.open(f),encoding='latin-1')); h=next(r)
    w=csv.writer(open('fao_soy_raw.csv','w',newline='')); w.writerow(h)
    for row in r:
        if row[h.index('Item')]=='Soya beans' and row[h.index('Area')] in ('World','United States of America','Brazil','Argentina','China, mainland'): w.writerow(row)
fao=pd.read_csv('fao_soy_raw.csv')
def fs(area,el): return fao[(fao.Area==area)&(fao.Element==el)].set_index('Year').Value.astype(float)

# ---------- 序列定义 ----------
S={}  # name -> (series, sn_aligned, oni_aligned, label)
S['美国单产(NASS)']=(us.yield_bu_ac, SN_NH, ONI_NH)
S['美国产量(NASS)']=(us.production_kbu, SN_NH, ONI_NH)
S['美国收获面积(NASS)']=(us.harvested_kac, SN_NH, ONI_NH)
S['全球单产(FAO)']=(fs('World','Yield'), SN_CAL, ONI_CAL)
S['全球产量(FAO)']=(fs('World','Production'), SN_CAL, ONI_CAL)
S['美国单产(FAO)']=(fs('United States of America','Yield'), SN_NH, ONI_NH)
S['巴西单产(FAO)']=(fs('Brazil','Yield'), SN_SH, ONI_SH)
S['巴西产量(FAO)']=(fs('Brazil','Production'), SN_SH, ONI_SH)
S['阿根廷单产(FAO)']=(fs('Argentina','Yield'), SN_SH, ONI_SH)
S['阿根廷产量(FAO)']=(fs('Argentina','Production'), SN_SH, ONI_SH)
S['中国单产(FAO)']=(fs('China, mainland','Yield'), SN_NH, ONI_NH)
S['中国产量(FAO)']=(fs('China, mainland','Production'), SN_NH, ONI_NH)
S['美国农场价(NASS,名义)']=(us.price_usd_bu, SN_NH, ONI_NH)

# ---------- 去趋势 ----------
def detrend(x, how):
    x=x.dropna(); lx=np.log(x)
    if how=='HP':   # HP 滤波，λ=100（年度；对 11 年周期保留约 90% 振幅）
        cyc,tr=hpfilter(lx.values,lamb=100); return pd.Series(cyc*100,index=x.index)
    if how=='LOESS':  # LOWESS，窗宽 31 年
        tr=lowess(lx.values,x.index.values,frac=min(1,31/len(x)),it=1,return_sorted=False); return pd.Series((lx.values-tr)*100,index=x.index)
    if how=='YoY':
        return (lx.diff()*100).dropna()
METHODS=['HP','LOESS','YoY']

def r1(a): a=np.asarray(a)-np.mean(a); return np.sum(a[1:]*a[:-1])/np.sum(a*a)
def corr_lag(y, sn, k):
    """k>0：黑子领先 k 年，即 y(t) 对 sn(t-k)"""
    s=sn.copy(); s.index=s.index+k
    d=pd.concat([y,s],axis=1,join='inner').dropna()
    if len(d)<10: return np.nan,len(d),np.nan,np.nan
    r=np.corrcoef(d.iloc[:,0],d.iloc[:,1])[0,1]
    n=len(d); ra,rb=r1(d.iloc[:,0]),r1(d.iloc[:,1]); neff=min(n,max(3,n*(1-ra*rb)/(1+ra*rb)))  # Bretherton 1999 有效样本，上限 N
    t=r*np.sqrt((neff-2)/max(1e-9,1-r*r)); p=2*stats.t.sf(abs(t),neff-2)
    return r,n,p,neff
def phase_surrogates(x, n):
    x=np.asarray(x,float); m=x.mean(); X=np.fft.rfft(x-m); out=[]
    for _ in range(n):
        ph=RNG.uniform(0,2*np.pi,len(X)); ph[0]=0
        if len(x)%2==0: ph[-1]=0
        out.append(np.fft.irfft(np.abs(X)*np.exp(1j*ph),n=len(x))+m)
    return out
# 黑子 1750-2026 全序列做随机相位替身（保留 11 年周期和自相关），再按同样季节/对齐截取
def surrogate_null(y, sn, lags, nsim=NSIM):
    """向量化：替身黑子矩阵 (nsim × 年)，逐滞后算相关"""
    full=sn.dropna(); Smat=np.array(phase_surrogates(full.values,nsim)); pos={yr:i for i,yr in enumerate(full.index)}
    perlag=np.full((nsim,len(lags)),np.nan)
    for j,k in enumerate(lags):
        ok=[t for t in y.index if (t-k) in pos]
        if len(ok)<10: continue
        yy=y.loc[ok].values; yy=(yy-yy.mean())/yy.std()
        X=Smat[:,[pos[t-k] for t in ok]]; X=(X-X.mean(1,keepdims=True))/X.std(1,keepdims=True)
        perlag[:,j]=(X*yy).mean(1)
    best=np.nanmax(np.abs(perlag),axis=1); lag0=perlag[:,list(lags).index(0)]
    return best,lag0,perlag

rows=[]; XC={}; ENV={}; ANOM={}
for name,(x,sn,on) in S.items():
    for m in METHODS:
        y=detrend(x,m); ANOM[(name,m)]=y
        res=[corr_lag(y,sn,k) for k in LAGS]; rs=np.array([a[0] for a in res])
        kb=list(LAGS)[int(np.nanargmax(np.abs(rs)))]; rb_,nb,pb,_=corr_lag(y,sn,kb)
        r0,n0,p0,ne0=corr_lag(y,sn,0)
        nsim=NSIM
        best,l0,perlag=surrogate_null(y,sn,LAGS,nsim)
        pboot_best=(np.sum(best>=abs(rb_))+1)/(len(best)+1); pboot0=(np.sum(np.abs(l0)>=abs(r0))+1)/(len(l0)+1)
        ro,no,po,_=corr_lag(y,on,0)
        XC[(name,m)]=rs; ENV[(name,m)]=np.nanpercentile(np.abs(perlag),95,axis=0)
        rows.append(dict(series=name,method=m,start=int(y.index.min()),end=int(y.index.max()),N=n0,r_lag0=r0,neff_lag0=ne0,p_lag0_adj=p0,p_lag0_surrogate=pboot0,
                         best_lag=kb,r_best=rb_,p_best_adj_single=pb,p_best_bonf23=min(1,pb*23),p_best_surrogate_maxlag=pboot_best,
                         r_ONI_lag0=ro,N_ONI=no,p_ONI_adj=po))
        print(name,m,'r0=%.2f best k=%+d r=%.2f p_sur=%.2f | ONI r=%.2f p=%.3f'%(r0,kb,rb_,pboot_best,ro,po),flush=True)
R=pd.DataFrame(rows); R.to_csv('results_xcorr.csv',index=False,float_format='%.4f')

# ---------- ONI 对照：同样做替身检验 ----------
onirows=[]
for name in ['美国单产(NASS)','阿根廷单产(FAO)','巴西单产(FAO)','全球单产(FAO)','美国单产(FAO)','中国单产(FAO)']:
    x,sn,on=S[name]; y=ANOM[(name,'HP')]
    r,n,p,ne=corr_lag(y,on,0)
    _,nul,_=surrogate_null(y,on,[0]); ps=(np.sum(np.abs(nul)>=abs(r))+1)/(NSIM+1)
    r_sn,n_sn,p_sn,_=corr_lag(y,sn.loc[1950:],0)  # 同期（1950+）黑子对照
    onirows.append(dict(series=name,period=f'{max(1950,y.index.min())}-{y.index.max()}',N=n,r_ONI=r,p_ONI_adj=p,p_ONI_surrogate=ps,r_SN_same_period=r_sn,p_SN_adj=p_sn))
O=pd.DataFrame(onirows); O.to_csv('results_enso.csv',index=False,float_format='%.4f'); print(O)

# ---------- 周期相位合成 ----------
MINS=[1755.1,1766.5,1775.5,1784.7,1798.3,1810.5,1823.4,1833.9,1843.5,1855.9,1867.2,1878.9,1890.2,1902.0,1913.5,1923.6,1933.7,1944.1,1954.3,1964.8,1976.2,1986.7,1996.6,2008.9,2019.9]  # SILSO 13 个月平滑极小值（年+月/12）
def years_since_min(y):
    mid=y+0.5; past=[m for m in MINS if m<=mid]; return int(np.floor(mid-past[-1]))
def phase_comp(name,m='HP',sn=None):
    y=ANOM[(name,m)]; sn=S[name][1] if sn is None else sn
    d=pd.DataFrame({'a':y}); d['ysm']=[years_since_min(t) for t in d.index]
    d['bin']=pd.cut(d.ysm,[-1,1,3,5,7,9,20],labels=['0-1','2-3','4-5','6-7','8-9','10+'])
    d['sn']=sn.reindex(d.index); q=d.sn.quantile([1/3,2/3])
    d['tert']=np.where(d.sn>=q.iloc[1],'高黑子(上1/3)',np.where(d.sn<=q.iloc[0],'低黑子(下1/3)','中间'))
    hi=d[d.tert=='高黑子(上1/3)'].a; lo=d[d.tert=='低黑子(下1/3)'].a; obs=hi.mean()-lo.mean()
    # 置换检验：对异常值做循环平移（保留自相关）
    a=d.a.values; null=[]
    for s in range(1,len(a)):
        aa=np.roll(a,s); null.append(aa[(d.tert=='高黑子(上1/3)').values].mean()-aa[(d.tert=='低黑子(下1/3)').values].mean())
    p=(np.sum(np.abs(null)>=abs(obs))+1)/(len(null)+1)
    g=d.groupby('bin',observed=False).a.agg(['mean','count','std'])
    # 相位分组的“最高组-最低组”差：同样用循环平移做零假设
    sp=g['mean'].max()-g['mean'].min(); bins=d.bin.values; nul2=[]
    for s_ in range(1,len(a)):
        gm=pd.Series(np.roll(a,s_)).groupby(bins,observed=False).mean(); nul2.append(gm.max()-gm.min())
    g.attrs['spread']=sp; g.attrs['p_spread']=(np.sum(np.array(nul2)>=sp)+1)/(len(nul2)+1)
    return d,g,hi,lo,obs,p
comp=[]
for name in ['美国单产(NASS)','全球单产(FAO)','巴西单产(FAO)','阿根廷单产(FAO)','中国单产(FAO)']:
    d,g,hi,lo,obs,p=phase_comp(name)
    for b,rw in g.iterrows(): comp.append(dict(series=name,group='距极小值 '+str(b)+' 年',mean_anom_pct=rw['mean'],n=rw['count']))
    comp+= [dict(series=name,group='高黑子(上1/3)',mean_anom_pct=hi.mean(),n=len(hi)),dict(series=name,group='低黑子(下1/3)',mean_anom_pct=lo.mean(),n=len(lo)),
            dict(series=name,group='高-低 差值',mean_anom_pct=obs,n=np.nan,p_circshift=p),
            dict(series=name,group='相位组 最高-最低 差',mean_anom_pct=g.attrs['spread'],n=np.nan,p_circshift=g.attrs['p_spread'])]
C=pd.DataFrame(comp); C.to_csv('results_phase.csv',index=False,float_format='%.3f'); print(C)

# ---------- 合并数据 CSV ----------
yrs=range(1924,2027)
out=pd.DataFrame(index=pd.Index(yrs,name='year'))
out['sunspot_yearly_SILSO']=sny.reindex(yrs); out['sunspot_May_Sep_SILSO_自算']=SN_NH.reindex(yrs); out['sunspot_Oct(t-1)_Mar(t)_SILSO_自算']=SN_SH.reindex(yrs)
out['ONI_JJA']=ONI_NH.reindex(yrs); out['ONI_DJF(yr=Jan)']=ONI_SH.reindex(yrs)
for c in us.columns: out['US_NASS_'+c]=us[c].reindex(yrs)
for a,lab in [('World','World'),('United States of America','US'),('Brazil','Brazil'),('Argentina','Argentina'),('China, mainland','China')]:
    out[f'FAO_{lab}_yield_kg_ha']=fs(a,'Yield').reindex(yrs); out[f'FAO_{lab}_prod_t']=fs(a,'Production').reindex(yrs)
for k in [('美国单产(NASS)','HP'),('美国单产(NASS)','LOESS'),('全球单产(FAO)','HP'),('巴西单产(FAO)','HP'),('阿根廷单产(FAO)','HP')]:
    out[f'anom_{k[0]}_{k[1]}_pct_自算']=ANOM[k].reindex(yrs)
out.to_csv('data.csv',float_format='%.4f')

# ---------- 图 ----------
SRC='来源：SILSO 国际太阳黑子数 v2.0；USDA NASS 作物历史记录(2026-04)；FAOSTAT；NOAA CPC ONI。去趋势/相关全部为自算；相关≠因果'
# 图1 双轴
fig,ax=plt.subplots(figsize=(12,5)); y=ANOM[('美国单产(NASS)','HP')]
ax.bar(y.index,y.values,color=np.where(y.values>=0,'#2b8cbe','#e34a33'),alpha=.75,label='美国大豆单产 去趋势偏差 %（HP，自算）')
ax.set_ylabel('单产偏离趋势 %'); ax.axhline(0,color='grey',lw=.6)
ax2=ax.twinx(); s=SN_NH.loc[1924:]; ax2.plot(s.index,s.values,color='#f39c12',lw=2,label='太阳黑子数（5-9 月均值，SILSO）'); ax2.set_ylabel('太阳黑子数')
for yy,lab in [(1936,'1936 干旱'),(1988,'1988 干旱'),(2012,'2012 干旱'),(1983,'1983')]:
    if yy in y.index: ax.annotate(lab,(yy,y[yy]),xytext=(0,-14),textcoords='offset points',fontsize=8,ha='center')
r0=R[(R.series=='美国单产(NASS)')&(R.method=='HP')].iloc[0]
ax.set_title(f'太阳黑子 vs 美国大豆单产偏差（1924–2025）：同期 r={r0.r_lag0:.2f}（自算）')
h1,l1=ax.get_legend_handles_labels(); h2,l2=ax2.get_legend_handles_labels(); ax.legend(h1+h2,l1+l2,loc='upper left',fontsize=8)
fig.text(.01,.01,SRC,fontsize=7); fig.tight_layout(rect=(0,.03,1,1)); fig.savefig('chart1_sunspot_vs_us_yield.png',dpi=150); plt.close(fig)
# 图2 交叉相关
names=['美国单产(NASS)','全球单产(FAO)','巴西单产(FAO)','阿根廷单产(FAO)']
fig,axs=plt.subplots(len(names),1,figsize=(11,11),sharex=True)
for ax,n in zip(axs,names):
    rs=XC[(n,'HP')]; env=ENV[(n,'HP')]; L=list(LAGS)
    ax.bar(L,rs,color=['#2b8cbe' if v>=0 else '#e34a33' for v in rs])
    ax.plot(L,env,'k--',lw=.8,label='随机相位黑子 95% 区间（自算）'); ax.plot(L,-env,'k--',lw=.8)
    rr=R[(R.series==n)&(R.method=='HP')].iloc[0]
    ax.set_title(f'{n}（HP 去趋势，{rr.start}–{rr.end}）：最高 k={int(rr.best_lag):+d} r={rr.r_best:.2f}，扫描后替身 p={rr.p_best_surrogate_maxlag:.2f}',fontsize=10)
    ax.set_ylim(-.6,.6); ax.axhline(0,color='grey',lw=.6); ax.grid(alpha=.3); ax.set_ylabel('r')
axs[0].legend(fontsize=8); axs[-1].set_xlabel('滞后 k（年）；k>0 = 黑子领先产量 k 年'); axs[-1].set_xticks(list(LAGS))
fig.text(.01,.005,SRC,fontsize=7); fig.tight_layout(rect=(0,.02,1,1)); fig.savefig('chart2_xcorr.png',dpi=150); plt.close(fig)
# 图3 相位合成
fig,axs=plt.subplots(1,2,figsize=(12,4.5))
d,g,hi,lo,obs,p=phase_comp('美国单产(NASS)')
axs[0].bar([str(i) for i in g.index],g['mean'],color=['#2b8cbe' if v>=0 else '#e34a33' for v in g['mean']])
for i,(m_,c_) in enumerate(zip(g['mean'],g['count'])): axs[0].text(i,m_,f'n={int(c_)}',ha='center',va='bottom' if m_>=0 else 'top',fontsize=8)
axs[0].axhline(0,color='grey',lw=.6); axs[0].set_xlabel('距上一个太阳活动极小值的年数（极小值 ≈ 低黑子，极大值多在 3-5 年）'); axs[0].set_ylabel('单产偏离趋势 %（自算）'); axs[0].set_title(f"美国大豆单产：按太阳周期相位平均（1924–2025；最高-最低组差 p={g.attrs['p_spread']:.2f}）",fontsize=10)
sub=C[C.group.isin(['高黑子(上1/3)','低黑子(下1/3)'])]; lab=[]; vals=[]; cols=[]
for n in ['美国单产(NASS)','全球单产(FAO)','巴西单产(FAO)','阿根廷单产(FAO)']:
    for gname,col in [('高黑子(上1/3)','#f39c12'),('低黑子(下1/3)','#7f8c8d')]:
        v=sub[(sub.series==n)&(sub.group==gname)].mean_anom_pct.iloc[0]; lab.append(n.replace('(FAO)','').replace('(NASS)','')+'\n'+gname[:3]); vals.append(v); cols.append(col)
axs[1].bar(range(len(vals)),vals,color=cols); axs[1].set_xticks(range(len(vals))); axs[1].set_xticklabels(lab,fontsize=8); axs[1].axhline(0,color='grey',lw=.6)
for i,n in enumerate(['美国单产(NASS)','全球单产(FAO)','巴西单产(FAO)','阿根廷单产(FAO)']):
    pp=C[(C.series==n)&(C.group=='高-低 差值')].p_circshift.iloc[0]; axs[1].text(2*i+.5,min(vals)*1.1,f'高-低 p={pp:.2f}',ha='center',va='top',fontsize=8)
axs[1].set_ylim(min(vals)*1.35,max(vals)*1.15); axs[1].set_title('高黑子年 vs 低黑子年 平均单产偏差 %（自算；p 为循环平移检验）')
fig.text(.01,.01,SRC,fontsize=7); fig.tight_layout(rect=(0,.04,1,1)); fig.savefig('chart3_phase_composite.png',dpi=150); plt.close(fig)
# 图4 ENSO 对照
fig,ax=plt.subplots(figsize=(10,4.5)); x=np.arange(len(O)); w=.38
ax.bar(x-w/2,O.r_ONI,w,color='#8e44ad',label='与 ENSO(ONI) 同期相关'); ax.bar(x+w/2,O.r_SN_same_period,w,color='#f39c12',label='与太阳黑子 同期相关')
for i,rw in O.iterrows():
    ax.text(i-w/2,rw.r_ONI,f'p={rw.p_ONI_surrogate:.3f}',ha='center',va='top' if rw.r_ONI<0 else 'bottom',fontsize=7)
    ax.text(i+w/2,rw.r_SN_same_period,f'p={rw.p_SN_adj:.2f}',ha='center',va='top' if rw.r_SN_same_period<0 else 'bottom',fontsize=7)
ax.set_xticks(x); ax.set_xticklabels([s+'\n'+p for s,p in zip(O.series,O.period)],fontsize=8); ax.axhline(0,color='grey',lw=.6)
ax.set_ylabel('r（HP 去趋势单产，自算）'); ax.set_title('对照：已知气候因子 ENSO vs 太阳黑子（1950 年后同一时段）'); ax.legend(fontsize=8)
fig.text(.01,.01,SRC+'；ONI 的 p 为随机相位替身检验，黑子的 p 为有效样本调整；美国/中国用 JJA ONI，南美用 DJF ONI，全球用年均',fontsize=7); fig.tight_layout(rect=(0,.04,1,1)); fig.savefig('chart4_enso_vs_sunspot.png',dpi=150); plt.close(fig)
print('done')

# ---------- 稳定性：美国单产前后两半 ----------
st=[]
y=ANOM[('美国单产(NASS)','HP')]
for a,b in [(1924,1974),(1975,2025),(1924,2025)]:
    yy=y.loc[a:b]
    for k in [0,2,-9]:
        r,n,p,_=corr_lag(yy,SN_NH,k); st.append(dict(period=f'{a}-{b}',lag=k,r=r,N=n,p_adj=p))
ST=pd.DataFrame(st); ST.to_csv('results_us_split.csv',index=False,float_format='%.3f'); print(ST)
