
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, ShieldAlert, Package, Cloud, 
  Cpu, Zap, BarChart3, AlertCircle, CheckCircle2, 
  RefreshCcw, Settings, Search, Bell, Globe, ArrowUpRight, ArrowDownRight,
  ShieldQuestion, ZapOff, Thermometer, ChevronRight, Building2, MapPin, Layers, Server,
  DownloadCloud, Info, Battery
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { getHealthInterpretation, HealthInterpretation } from './services/geminiService';
import * as Types from './types';

// --- Atomic Components ---

const SectionTitle: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex items-center gap-5 mb-8 border-l-[8px] border-cyan-500 pl-6">
    <span className="text-cyan-400 w-8 h-8">{icon}</span>
    <h2 className="text-2xl font-black tracking-tight text-slate-100 uppercase">{title}</h2>
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`glass-panel rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col transition-all border-slate-700/50 hover:border-slate-600 ${className}`}>
    <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>
    {children}
  </div>
);

const MetricTile: React.FC<{ metric: Types.KeyMetric }> = ({ metric }) => (
  <div className="bg-slate-900/40 rounded-[2rem] border border-slate-800 hover:border-cyan-500/40 transition-all group overflow-hidden flex flex-col">
    <div className="p-6 pb-2">
      <div className="flex justify-between items-start mb-3">
        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">{metric.name}</p>
        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${metric.status === 'normal' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {metric.status}
        </div>
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className={`text-5xl value-large leading-none tracking-tighter text-slate-100`}>
          {metric.value}
        </span>
        {metric.unit && <span className="text-sm font-black text-slate-600 uppercase tracking-widest">{metric.unit}</span>}
        <div className="ml-auto">
          {metric.trend === 'up' && <ArrowUpRight className="w-6 h-6 text-emerald-400" />}
          {metric.trend === 'down' && <ArrowDownRight className="text-rose-400" />}
        </div>
      </div>
    </div>

    <div className="mt-2 mx-2 mb-2 p-6 bg-cyan-500/5 rounded-[1.5rem] group-hover:bg-cyan-500/10 transition-colors">
      <div className="space-y-6">
        {metric.offices.map((off, idx) => (
          <div key={idx} className="flex flex-col gap-3">
            <div className="flex justify-between items-end px-1">
              <span className="text-xl text-slate-100 font-black tracking-wide">{off.office}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-mono font-black text-cyan-300">{off.value}</span>
                <span className="text-xs font-bold text-cyan-700 uppercase">{metric.unit}</span>
              </div>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
               <div 
                 className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(34,211,238,0.6)]" 
                 style={{ width: typeof off.value === 'number' ? `${Math.min(100, (off.value as number) * (metric.unit === '%' ? 1 : 0.1))}%` : '50%' }}
               ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [healthInfo, setHealthInfo] = useState<HealthInterpretation | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // --- Mock Data ---

  const officeHealthRanks = [
    { name: '北京代表处', score: 94.2 },
    { name: '上海代表处', score: 91.8 },
    { name: '深圳代表处', score: 89.5 },
    { name: '杭州代表处', score: 87.2 },
  ];

  const siteHealthRanks: Types.HealthRank[] = [
    { site: '北京一号站', score: 98 },
    { site: '上海储能中心', score: 95 },
    { site: '深圳湾电站', score: 92 },
    { site: '成都高新站', score: 88 },
  ];

  const healthTrend: Types.HealthTrend[] = [
    { time: '01', value: 92 }, { time: '05', value: 94 }, { time: '10', value: 91 },
    { time: '15', value: 95 }, { time: '20', value: 93 }, { time: '25', value: 96 },
    { time: '30', value: 94 },
  ];

  const alertList: Types.AlertItem[] = [
    { id: '1', address: 'B1-F3-01', status: 'Critical', site: '北京一号站', type: '电池组模块过温告警', time: '10:22:15' },
    { id: '2', address: 'S2-G1-12', status: 'Major', site: '上海储能中心', type: '主回路通讯链路异常', time: '11:05:42' },
    { id: '3', address: 'Z1-K4-05', status: 'Minor', site: '深圳湾电站', type: '三相电网频率失稳', time: '11:30:00' },
  ];

  const preWarnings: Types.PreWarningItem[] = [
    { id: 'pw1', site: '深圳湾电站', device: 'Rack #04', description: '电芯一致性偏差预警', prediction: '预计48h内触发故障', confidence: 92 },
    { id: 'pw2', site: '上海储能中心', device: 'PCS-02', description: '变流器散热效率下降', prediction: '建议1周内维护风道', confidence: 85 },
    { id: 'pw3', site: '北京一号站', device: 'BMS-01', description: '绝缘阻抗分级预警', prediction: '阻抗值持续呈下降趋势', confidence: 78 },
  ];

  const riskClosures: Types.ClosureStat[] = [
    { label: 'Pcare问题单', total: 125, closed: 118, rate: 94.4 },
    { label: 'Agrid工单', total: 85, closed: 80, rate: 94.1 },
    { label: '巡检风险闭环', total: 42, closed: 35, rate: 83.3 },
    { label: '重特大告警', total: 18, closed: 18, rate: 100 },
  ];

  const stock: Types.StockData = {
    shipped: 12000,
    booted: 11500,
    connected: 10800,
    connectionRate: 90,
  };

  const officeCloudStats: Types.OfficeCloudSiteStat[] = [
    { office: '北京代表处', totalSites: 120, cloudSites: 115, rate: 95.8, offline: 3, offlineRate: 2.5 },
    { office: '上海代表处', totalSites: 95, cloudSites: 92, rate: 96.8, offline: 1, offlineRate: 1.1 },
    { office: '深圳代表处', totalSites: 150, cloudSites: 142, rate: 94.7, offline: 8, offlineRate: 5.3 },
    { office: '杭州代表处', totalSites: 110, cloudSites: 102, rate: 92.7, offline: 4, offlineRate: 3.6 },
  ];

  const officeESSRanks: Types.OfficeESSRank[] = [
    { office: '深圳代表处', essCount: 245, capacity: '450MWh' },
    { office: '北京代表处', essCount: 188, capacity: '320MWh' },
    { office: '上海代表处', essCount: 162, capacity: '280MWh' },
  ];

  const deviceTypeStats: Types.DeviceTypeStat[] = [
    { type: 'BMS电池管理', count: 5400, percentage: 45 },
    { type: 'PCS变流器', count: 3200, percentage: 27 },
    { type: '智能电表', count: 1800, percentage: 15 },
    { type: '监控网关', count: 1600, percentage: 13 },
  ];

  const softwareVersions: Types.SoftwareVersion[] = [
    { deviceType: 'ESS', version: 'ESS-V2.5.0', count: 2800, percentage: 65, isRequiredUpgrade: false },
    { deviceType: 'ESS', version: 'ESS-V2.4.2', count: 800, percentage: 20, isRequiredUpgrade: true },
    { deviceType: 'PCS', version: 'PCS-P3.1.0', count: 1500, percentage: 50, isRequiredUpgrade: false },
    { deviceType: 'PCS', version: 'PCS-P2.9.8', count: 1200, percentage: 40, isRequiredUpgrade: true },
    { deviceType: 'BMS', version: 'BMS-B1.0.5', count: 1100, percentage: 80, isRequiredUpgrade: false },
  ];

  const groupedSoftware = useMemo(() => {
    return softwareVersions.reduce((acc, current) => {
      if (!acc[current.deviceType]) acc[current.deviceType] = [];
      acc[current.deviceType].push(current);
      return acc;
    }, {} as Record<string, Types.SoftwareVersion[]>);
  }, [softwareVersions]);

  const keyMetrics: Types.KeyMetric[] = [
    { 
      name: '电池SOC', value: 85.2, unit: '%', status: 'normal', trend: 'up',
      offices: [
        { office: '北京代表处', value: 88.5 },
        { office: '上海代表处', value: 82.1 },
        { office: '深圳代表处', value: 86.4 }
      ]
    },
    { 
      name: '电池SOH', value: 98.4, unit: '%', status: 'normal', trend: 'stable',
      offices: [
        { office: '北京代表处', value: 99.1 },
        { office: '上海代表处', value: 97.8 },
        { office: '深圳代表处', value: 98.5 }
      ]
    },
    { 
      name: '电芯最高温', value: 32.5, unit: '℃', status: 'normal', trend: 'down',
      offices: [
        { office: '北京代表处', value: 28.5 },
        { office: '上海代表处', value: 35.2 },
        { office: '深圳代表处', value: 36.8 }
      ]
    },
    { 
      name: '等效循环', value: 452, unit: '次', status: 'normal',
      offices: [
        { office: '北京代表处', value: 320 },
        { office: '上海代表处', value: 580 },
        { office: '深圳代表处', value: 512 }
      ]
    },
    { 
      name: '累计充电', value: 12.5, unit: 'GWh', status: 'normal',
      offices: [
        { office: '北京代表处', value: 3.2 },
        { office: '上海代表处', value: 4.5 },
        { office: '深圳代表处', value: 2.8 }
      ]
    },
    { 
      name: 'RTE效率', value: 92.4, unit: '%', status: 'normal', trend: 'stable',
      offices: [
        { office: '北京代表处', value: 93.5 },
        { office: '上海代表处', value: 91.2 },
        { office: '深圳代表处', value: 92.8 }
      ]
    }
  ];

  useEffect(() => {
    const fetchInterpretation = async () => {
      setLoadingHealth(true);
      const data = await getHealthInterpretation(91.6, siteHealthRanks.map(r => r.site));
      setHealthInfo(data);
      setLoadingHealth(false);
    };
    fetchInterpretation();
  }, []);

  return (
    <div className="min-h-screen flex flex-col p-8 md:p-10 gap-10 w-full max-w-full overflow-x-hidden bg-[#010409]">
      {/* Header */}
      <header className="flex flex-col xl:flex-row items-center justify-between gap-10 glass-panel p-8 rounded-[2.5rem] border-cyan-500/20 shadow-2xl">
        <div className="flex items-center gap-8">
          <div className="p-5 bg-cyan-500 rounded-[1.5rem] shadow-[0_0_35px_rgba(34,211,238,0.5)] transition-transform hover:scale-105 duration-300">
            <Zap className="text-white w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-glow-cyan text-cyan-400">ENERGY CORE SIGHT</h1>
            <p className="text-sm text-slate-400 font-mono tracking-[0.4em] uppercase mt-2">Intelligence Operations Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-12">
          <div className="hidden lg:flex items-center gap-14 px-14 border-x border-slate-800">
            <div className="text-center">
              <p className="text-sm text-slate-500 uppercase font-black mb-2 tracking-widest">系统运行状态</p>
              <p className="text-2xl font-black text-emerald-400 flex items-center justify-center gap-4">
                <span className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]"></span> 在线运行
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-500 uppercase font-black mb-2 tracking-widest">实时告警总数</p>
              <p className="text-3xl font-black text-rose-500 value-large">12 <span className="text-sm uppercase text-slate-500 tracking-wider">Critical</span></p>
            </div>
          </div>
          <div className="flex items-center gap-6 bg-slate-900/80 p-3 pr-8 rounded-full border border-slate-700 shadow-2xl">
            <div className="w-14 h-14 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-full flex items-center justify-center font-black text-xl shadow-xl">AD</div>
            <div>
              <p className="text-lg font-black text-slate-200 leading-none">Admin_Zhang</p>
              <p className="text-xs text-cyan-500 font-black uppercase mt-2 tracking-[0.1em]">L4 Operation Lead</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 items-stretch">
        
        {/* Left Column: Health Card & Software Versions */}
        <div className="lg:col-span-3 flex flex-col gap-10 min-h-full">
          <Card>
            <SectionTitle title="局点健康度监控" icon={<Activity />} />
            
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-5 h-5 text-cyan-500" />
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">代表处健康度</h3>
              </div>
              <div className="space-y-4">
                {officeHealthRanks.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-6 p-4 bg-slate-900/60 rounded-2xl border border-slate-800/50 hover:border-cyan-500/20 transition-all">
                    <div className="flex-1">
                      <p className="text-base font-black text-slate-200 mb-1">{item.name}</p>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-600" style={{ width: `${item.score}%` }}></div>
                      </div>
                    </div>
                    <span className="text-2xl font-black text-cyan-400 font-mono">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-800 to-transparent mb-12"></div>

            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">局点健康度排名</h3>
              </div>
              
              <div className="mb-8 p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-[1.5rem] text-center">
                <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1">全局平均指数</p>
                <p className="text-5xl font-black text-indigo-400 value-large tracking-tighter">91.6</p>
              </div>

              <div className="space-y-3 mb-10">
                {siteHealthRanks.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/30 transition-all border border-transparent hover:border-slate-800">
                    <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-base font-bold text-slate-300 truncate">{item.site}</span>
                    <span className="text-lg font-black text-slate-100 font-mono">{item.score}</span>
                  </div>
                ))}
              </div>

              <div className="h-28 mb-8 bg-slate-900/60 rounded-[1.5rem] p-3 border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={healthTrend}>
                    <defs>
                      <linearGradient id="healthGradLeft" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#healthGradLeft)" strokeWidth={4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="p-6 bg-cyan-950/20 border-2 border-cyan-500/20 rounded-[1.5rem] mt-auto">
                 <div className="flex items-center gap-2 mb-2">
                   <Cpu className="w-4 h-4 text-cyan-400" />
                   <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">AI 辅助分析及建议</span>
                 </div>
                 <div className="max-h-[120px] overflow-y-auto scrollbar-hide">
                    <p className="text-sm text-slate-300 leading-relaxed font-bold italic mb-3">
                      "{loadingHealth ? "数据解读中..." : healthInfo?.summary}"
                    </p>
                    {/* Fixed narrowing to avoid type 'unknown' error and ensure safe property access */}
                    {healthInfo && healthInfo.recommendations && (
                      <div className="space-y-1">
                        {healthInfo.recommendations.map((rec: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-[11px] text-cyan-500/80 font-bold">
                            <span className="mt-1 block w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                            {rec}
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
            </div>
          </Card>

          {/* Software Version Monitoring */}
          <Card>
            <SectionTitle title="软件版本管理" icon={<RefreshCcw className="text-indigo-400" />} />
            <div className="space-y-8 max-h-[450px] overflow-y-auto pr-2 scrollbar-hide">
              {Object.entries(groupedSoftware).map(([deviceType, versions]) => (
                <div key={deviceType} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-4">
                    {deviceType === 'ESS' ? <Battery className="w-4 h-4 text-emerald-400" /> : <Zap className="w-4 h-4 text-indigo-400" />}
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{deviceType} 设备统计</h4>
                  </div>
                  {versions.map((v, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-900/60 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-all">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-black text-slate-100">{v.version}</span>
                          <span className="text-xs font-mono text-slate-500 font-bold">{v.count} Units</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${v.isRequiredUpgrade ? 'bg-gradient-to-r from-rose-600 to-orange-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-gradient-to-r from-indigo-600 to-cyan-500'}`} 
                            style={{ width: `${v.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      {v.isRequiredUpgrade && (
                        <div className="flex flex-col items-center">
                          <AlertCircle className="w-5 h-5 text-rose-500 mb-1" />
                          <span className="text-[8px] font-black text-rose-400 uppercase">Upgrade</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Center Column */}
        <div className="lg:col-span-6 flex flex-col gap-10">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-8">
            <Card className="p-8 text-center border-slate-800 hover:border-slate-700 shadow-xl">
               <p className="text-sm text-slate-500 uppercase font-black tracking-[0.2em] mb-4">累计已发货</p>
               <p className="text-5xl font-black value-large leading-none tracking-tighter">{stock.shipped.toLocaleString()}</p>
            </Card>
            <Card className="p-8 text-center border-slate-800 hover:border-cyan-900 shadow-xl">
               <p className="text-sm text-slate-500 uppercase font-black tracking-[0.2em] mb-4 text-cyan-500/80">已开机运行</p>
               <p className="text-6xl font-black text-cyan-400 value-large leading-none tracking-tighter text-glow-cyan">{stock.booted.toLocaleString()}</p>
            </Card>
            <Card className="p-8 text-center border-slate-800 hover:border-emerald-900 shadow-xl">
               <p className="text-sm text-slate-500 uppercase font-black tracking-[0.2em] mb-4 text-emerald-500/80">全网并网点</p>
               <p className="text-6xl font-black text-emerald-400 value-large leading-none tracking-tighter">{stock.connected.toLocaleString()}</p>
            </Card>
            <Card className="p-8 text-center border-slate-800 hover:border-cyan-400/30 shadow-xl">
               <p className="text-sm text-slate-500 uppercase font-black tracking-[0.2em] mb-4">总体并网率</p>
               <p className="text-6xl font-black text-glow-cyan text-cyan-400 value-large leading-none">{stock.connectionRate}<span className="text-2xl ml-1">%</span></p>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            <Card className="border-rose-500/20">
               <SectionTitle title="实时监控告警" icon={<ShieldAlert className="text-rose-500" />} />
               <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                 {alertList.map((alert) => (
                   <div key={alert.id} className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-[1.5rem] group hover:border-rose-500/30 transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`px-3 py-1 text-white rounded-lg text-[10px] font-black uppercase tracking-widest ${alert.status === 'Critical' ? 'bg-rose-600' : 'bg-orange-500'}`}>
                          {alert.status}
                        </span>
                        <span className="text-xs font-black font-mono text-slate-500">{alert.time}</span>
                      </div>
                      <h4 className="text-lg font-black text-slate-100 mb-1">{alert.type}</h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-2 font-black uppercase tracking-wider">
                        <Globe className="w-3 h-3 text-rose-500/50" /> {alert.site} · {alert.address}
                      </p>
                   </div>
                 ))}
               </div>
            </Card>

            <Card className="border-orange-500/20">
               <SectionTitle title="智能故障预警" icon={<ShieldQuestion className="text-orange-500" />} />
               <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                 {preWarnings.map((pw) => (
                   <div key={pw.id} className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-[1.5rem] group hover:border-orange-500/30 transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <span className="px-3 py-1 bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                          CONF: {pw.confidence}%
                        </span>
                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest animate-pulse">预测中</span>
                      </div>
                      <h4 className="text-lg font-black text-slate-100 mb-1">{pw.description}</h4>
                      <p className="text-xs font-bold text-orange-400 mb-1">{pw.prediction}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-2 font-black uppercase tracking-wider">
                        <Settings className="w-3 h-3 text-orange-500/50" /> {pw.site} · {pw.device}
                      </p>
                   </div>
                 ))}
               </div>
            </Card>
          </div>

          <Card className="flex-1">
             <SectionTitle title="核心指标监控" icon={<BarChart3 className="text-indigo-400" />} />
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
               {keyMetrics.map((m, i) => (
                 <MetricTile key={i} metric={m} />
               ))}
             </div>
          </Card>
        </div>

        {/* Right Column: Risk Closures & Cloud Status */}
        <div className="lg:col-span-3 flex flex-col gap-10">
          
          {/* Risk Closure Card */}
          <Card>
            <SectionTitle title="风险闭环" icon={<CheckCircle2 className="text-emerald-400" />} />
            <div className="space-y-6 py-2">
              {riskClosures.map((stat, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center text-xs mb-3 uppercase font-black tracking-widest">
                    <span className="text-slate-400">{stat.label}</span>
                    <span className="text-cyan-400 font-mono text-base">{stat.rate}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all duration-1000" 
                      style={{ width: `${stat.rate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Expanded Cloud Status Card */}
          <Card className="flex-1">
            <SectionTitle title="设备上云监控" icon={<Cloud className="text-sky-400" />} />
            
            {/* 1. 全局上云达成率 */}
            <div className="mb-12">
               <div className="flex justify-between items-center p-6 bg-sky-500/10 rounded-[2rem] border border-sky-500/30 shadow-2xl transition-all hover:bg-sky-500/15">
                 <div>
                   <span className="text-xs text-slate-400 font-black uppercase tracking-widest">全局上云达成率</span>
                   <p className="text-[8px] text-sky-400 font-black mt-1 uppercase tracking-[0.2em]">Network Intel Index</p>
                 </div>
                 <span className="text-5xl font-black text-sky-400 value-large leading-none text-glow-cyan">95.8%</span>
               </div>
            </div>

            {/* 2. 代表处上云运行统计 (Consolidated) */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">代表处上云统计</h3>
              </div>
              <div className="space-y-6">
                {officeCloudStats.map((item, idx) => (
                  <div key={idx} className="p-5 bg-slate-900/60 rounded-[1.5rem] border border-slate-800 hover:border-sky-500/20 transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-black text-slate-200">{item.office}</h4>
                      <span className="text-xl font-black text-sky-400 value-large">{item.rate}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                        <p className="text-[9px] text-slate-500 uppercase font-black mb-1">已上云 / 总站点</p>
                        <p className="text-sm font-black text-slate-300">{item.cloudSites} <span className="text-slate-600">/</span> {item.totalSites}</p>
                      </div>
                      <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10">
                        <p className="text-[9px] text-rose-500/70 uppercase font-black mb-1">离线数 / 离线率</p>
                        <p className="text-sm font-black text-rose-400">{item.offline} <span className="text-rose-900">/</span> {item.offlineRate}%</p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.4)]" style={{ width: `${item.rate}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. 代表处上云ESS排行 */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Server className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">代表处上云ESS排行</h3>
              </div>
              <div className="space-y-3">
                {officeESSRanks.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-800 text-slate-500'}`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-base font-black text-slate-200">{item.office}</p>
                      <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">{item.capacity}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-slate-100 value-large">{item.essCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. 上云设备类型分布 */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">上云设备类型统计</h3>
              </div>
              <div className="space-y-4 px-2">
                {deviceTypeStats.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 mb-1 px-1">
                      <span>{item.type}</span>
                      <span className="text-cyan-400">{item.count} 台 ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-600" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

      </main>

      {/* Footer */}
      <footer className="glass-panel py-6 px-12 rounded-[2rem] flex justify-between items-center border-slate-800 shadow-2xl">
        <div className="flex gap-12 text-xs font-black text-slate-500 uppercase tracking-[0.4em]">
          <div className="flex items-center gap-4">
            <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]"></span>
            <span className="text-emerald-400">MISSION CRITICAL READY</span>
          </div>
          <span className="hidden sm:block">UP_TIME: 242D 12H</span>
          <span className="hidden xl:block">NODE: CLUSTER-08</span>
        </div>
        <div className="flex items-center gap-10 text-[10px] font-black text-slate-600 uppercase tracking-widest">
          <span className="px-4 py-1 border-2 border-slate-800 rounded-xl bg-slate-900/50">COMMAND MODE</span>
          <span className="text-slate-700">© 2024 ENERGY CORE INTELLIGENCE</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
