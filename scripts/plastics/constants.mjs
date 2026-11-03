export const USER_AGENT =
  'supplychain-insights/plastics (research; +https://github.com/JohnPENG-cn/supplychain-insights)'

export const BLS_SERIES = [
  'PCU325211325211',
  'PCU3252113252111',
  'WPU066',
  'WPU0662',
  'PCU325520325520',
  'PCU325510325510'
]

export const BLS_NAMES = {
  PCU325211325211: '塑料材料与树脂制造',
  PCU3252113252111: '热塑性树脂',
  WPU066: '塑料树脂与材料',
  WPU0662: '热塑性树脂（商品分类）',
  PCU325520325520: '胶粘剂制造',
  PCU325510325510: '涂料及相关产品制造'
}

export const EIA_PAGE =
  'https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=EER_EPLLPA_PF4_Y44MB_DPG&f=M'

export const EUROSTAT_PROD =
  'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/sts_inpr_m?geo=EU27_2020&nace_r2=C2016&s_adj=SCA&unit=I21&sinceTimePeriod=2019-01&untilTimePeriod=2026-12&format=JSON&lang=EN'

export const EUROSTAT_PPI =
  'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/sts_inppd_m?geo=EU27_2020&nace_r2=C2016&unit=I21&sinceTimePeriod=2019-01&untilTimePeriod=2026-12&format=JSON&lang=EN'

export const MOPS_CODES = ['1301', '1303', '1326', '6505', '1304', '1312']

export const MOPS_NAMES = {
  1301: '台塑',
  1303: '南亚',
  1326: '台化',
  6505: '台塑化',
  1304: '台聚',
  1312: '国乔'
}

export const SEC_URL =
  'https://data.sec.gov/api/xbrl/companyconcept/CIK0001489393/us-gaap/Revenues.json'

export const NBS_INDEX = 'https://www.stats.gov.cn/sj/zxfb/'

export const NBS_CONTROL_PAGES = [
  {
    url: 'https://www.stats.gov.cn/sj/zxfb/202610/t20261023_1965679.html',
    x: '2026-10中',
    pp: 10666.4,
    lldpe: 9999.0,
    pvc: null
  },
  {
    url: 'https://www.stats.gov.cn/sj/zxfb/202601/t20260113_1962302.html',
    x: '2026-01上',
    pp: 6269.2,
    lldpe: 6613.3,
    pvc: null
  }
]
