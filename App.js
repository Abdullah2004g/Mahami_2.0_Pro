import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Switch, Text, TextInput, View, useColorScheme, Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Svg, { Circle, Path, Rect, Line, G } from 'react-native-svg';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const C = {
  primary: '#6657E8', primaryDark: '#4B3FC4', success: '#19A974', orange: '#F39A3F', danger: '#E85B68',
  ink: '#17182B', muted: '#7D7E91', bg: '#F6F6FB', white: '#FFFFFF', darkBg: '#0F1020', darkCard: '#191A2D',
};
const KEY = '@mahami_v2_pro';

function Icon({ name, size = 22, color = C.primary }) {
  const p = { stroke: color, strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  const icons = {
    home: <><Path d="M3 11 12 3l9 8" {...p}/><Path d="M5.5 9.5V21h13V9.5M9.5 21v-6h5v6" {...p}/></>,
    tasks: <><Rect x="4" y="3.5" width="16" height="17" rx="3" {...p}/><Path d="m7.5 9 1.5 1.5L12 7.5M7.5 14h9M7.5 17.5h6" {...p}/></>,
    focus: <><Circle cx="12" cy="12" r="8.5" {...p}/><Path d="M12 7v5l3 2M9 2h6M12 2v2M19 5l1.5-1.5" {...p}/></>,
    stats: <><Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" {...p}/></>,
    settings: <><Circle cx="12" cy="12" r="3" {...p}/><Path d="M19 15.2a2 2 0 0 0 .4 2.2l.1.1-2 2-.1-.1a2 2 0 0 0-2.2-.4 2 2 0 0 0-1.2 1.8v.2h-3v-.2a2 2 0 0 0-1.2-1.8 2 2 0 0 0-2.2.4l-.1.1-2-2 .1-.1a2 2 0 0 0 .4-2.2A2 2 0 0 0 4.2 14H4v-3h.2a2 2 0 0 0 1.8-1.2 2 2 0 0 0-.4-2.2l-.1-.1 2-2 .1.1a2 2 0 0 0 2.2.4A2 2 0 0 0 11 4.2V4h3v.2a2 2 0 0 0 1.2 1.8 2 2 0 0 0 2.2-.4l.1-.1 2 2-.1.1a2 2 0 0 0-.4 2.2A2 2 0 0 0 20.2 11h.2v3h-.2a2 2 0 0 0-1.2 1.2Z" {...p}/></>,
    plus: <Path d="M12 5v14M5 12h14" {...p}/>,
    trash: <><Path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" {...p}/></>,
    check: <Path d="m6 12.5 4 4 8-9" {...p}/>,
    sun: <><Circle cx="12" cy="12" r="4" {...p}/><Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" {...p}/></>,
    moon: <Path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.6 8.6 0 1 0 20 15.5Z" {...p}/>,
    bell: <><Path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" {...p}/></>,
    arrow: <Path d="M5 12h14M13 6l6 6-6 6" {...p}/>,
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24">{icons[name] || icons.tasks}</Svg>;
}

function Logo({ dark = false }) {
  return <View style={[styles.logo, dark && { backgroundColor: '#2A2754' }]}><Svg width="30" height="30" viewBox="0 0 50 50"><Rect x="2" y="2" width="46" height="46" rx="14" fill={C.primary}/><Path d="m14 25 7 7 15-17" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></Svg></View>;
}

const greeting = (h) => h >= 5 && h < 12 ? ['صباح الخير', 'ابدأ يومك بخطوة صغيرة نحو إنجاز كبير.', 'sun'] : h < 17 ? ['نهارك سعيد', 'استمر، أنت تقوم بعمل رائع اليوم.', 'sun'] : h < 22 ? ['مساء الخير', 'حان وقت ترتيب ما تبقى من يومك.', 'moon'] : ['مساء هادئ', 'استعد ليوم جديد مليء بالإنجاز.', 'moon'];
const pad = (n) => String(n).padStart(2, '0');
const dateText = (d) => new Intl.DateTimeFormat('ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);

export default function App() {
  const systemDark = useColorScheme() === 'dark';
  const [settings, setSettings] = useState({ theme: 'auto', notifications: true });
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState('home');
  const [now, setNow] = useState(new Date());
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('متوسطة');
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const dark = settings.theme === 'dark' || (settings.theme === 'auto' && systemDark);
  const bg = dark ? C.darkBg : C.bg, card = dark ? C.darkCard : C.white, text = dark ? '#F8F8FC' : C.ink, muted = dark ? '#A0A1B5' : C.muted;
  const completed = tasks.filter(t => t.done).length;
  const remaining = tasks.length - completed;
  const progress = tasks.length ? completed / tasks.length : 0;
  const [hi, sub, weatherIcon] = greeting(now.getHours());
  const todayTasks = tasks.slice(0, 6);
  const priorityCounts = useMemo(() => ({ عالية: tasks.filter(t => t.priority === 'عالية' && !t.done).length, متوسطة: tasks.filter(t => t.priority === 'متوسطة' && !t.done).length, منخفضة: tasks.filter(t => t.priority === 'منخفضة' && !t.done).length }), [tasks]);

  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { (async () => { try { const raw = await AsyncStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); setTasks(d.tasks || []); setSettings(d.settings || { theme: 'auto', notifications: true }); } } catch {} setLoaded(true); try { await Notifications.requestPermissionsAsync(); await Notifications.setNotificationChannelAsync('default', { name: 'مهامي', importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' }); } catch {} })(); }, []);
  useEffect(() => { if (loaded) AsyncStorage.setItem(KEY, JSON.stringify({ tasks, settings })); }, [tasks, settings, loaded]);
  useEffect(() => {
    if (!running) return;
    const i = setInterval(() => {
      if (seconds > 0) setSeconds(s => s - 1);
      else if (minutes > 0) { setMinutes(m => m - 1); setSeconds(59); }
      else { setRunning(false); if (settings.notifications) Notifications.scheduleNotificationAsync({ content: { title: 'انتهت جلسة التركيز 🎉', body: 'أحسنت! خذ استراحة قصيرة ثم واصل.' }, trigger: null }); Alert.alert('أحسنت! 🎉', 'انتهت جلسة التركيز.'); }
    }, 1000);
    return () => clearInterval(i);
  }, [running, minutes, seconds, settings.notifications]);

  const add = () => { if (!title.trim()) return; setTasks(old => [{ id: String(Date.now()), title: title.trim(), priority, done: false, time: now.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) }, ...old]); setTitle(''); setPriority('متوسطة'); setModal(false); };
  const toggle = id => setTasks(x => x.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = id => setTasks(x => x.filter(t => t.id !== id));
  const choose = m => { setRunning(false); setMinutes(m); setSeconds(0); };
  const reset = () => { setRunning(false); setMinutes(25); setSeconds(0); };

  return <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
    <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
    <View style={{ flex: 1 }}>
      {tab === 'home' && <Home dark={dark} bg={bg} card={card} text={text} muted={muted} hi={hi} sub={sub} weatherIcon={weatherIcon} now={now} dateText={dateText} progress={progress} tasks={tasks} remaining={remaining} completed={completed} todayTasks={todayTasks} toggle={toggle} remove={remove} setTab={setTab} setModal={setModal} />}
      {tab === 'tasks' && <TasksScreen dark={dark} card={card} text={text} muted={muted} tasks={tasks} toggle={toggle} remove={remove} setModal={setModal} />}
      {tab === 'focus' && <FocusScreen dark={dark} card={card} text={text} muted={muted} minutes={minutes} seconds={seconds} running={running} choose={choose} reset={reset} setRunning={setRunning} />}
      {tab === 'stats' && <StatsScreen dark={dark} card={card} text={text} muted={muted} tasks={tasks} progress={progress} completed={completed} remaining={remaining} priorityCounts={priorityCounts} />}
      {tab === 'settings' && <SettingsScreen dark={dark} card={card} text={text} muted={muted} settings={settings} setSettings={setSettings} setTasks={setTasks} />}
      <Bottom tab={tab} setTab={setTab} dark={dark} add={() => setModal(true)} />
      <TaskModal visible={modal} dark={dark} card={card} text={text} muted={muted} title={title} setTitle={setTitle} priority={priority} setPriority={setPriority} close={() => setModal(false)} add={add} />
    </View>
  </SafeAreaView>;
}

function Home({ dark, card, text, muted, hi, sub, weatherIcon, now, dateText, progress, tasks, remaining, completed, todayTasks, toggle, remove, setTab, setModal }) {
  return <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
    <View style={[styles.hero, dark && { backgroundColor: '#25214F' }]}>
      <View style={styles.heroDecor1}/><View style={styles.heroDecor2}/>
      <View style={styles.heroTop}><View style={{ flex: 1 }}><Text style={styles.hello}>{hi} 👋</Text><Text style={styles.heroSub}>{sub}</Text></View><Logo dark={dark}/></View>
      <View style={styles.dateRow}><Icon name={weatherIcon} size={17} color="#fff"/><Text style={styles.date}>{dateText(now)}</Text><View style={styles.clockBox}><Text style={styles.clock}>{pad(now.getHours())}:{pad(now.getMinutes())}</Text></View></View>
    </View>
    <View style={styles.pad}>
      <Section title="نظرة سريعة" sub="تقدمك اليوم" action="عرض الكل" onAction={() => setTab('tasks')} text={text} muted={muted}/>
      <View style={[styles.progressCard, { backgroundColor: card }]}>
        <View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: text }]}>إنجازك اليوم</Text><Text style={[styles.sub, { color: muted }]}>{remaining ? `لديك ${remaining} مهام متبقية` : 'رائع! أنجزت جميع مهامك 🎉'}</Text><View style={styles.mini}><Mini v={tasks.length} l="الإجمالي" text={text} muted={muted}/><Mini v={completed} l="مكتملة" text={text} muted={muted}/><Mini v={remaining} l="متبقية" text={text} muted={muted}/></View></View><Progress value={progress} dark={dark} size={125}/>
      </View>
      <View style={styles.two}><Info title="نسبة الإنجاز" value={`${Math.round(progress * 100)}%`} sub="اليوم" icon="stats" dark={dark}/><Info title="المهام المتبقية" value={remaining} sub="حتى الآن" icon="tasks" dark={dark}/></View>
      <Section title="مهام اليوم" sub={`${todayTasks.length} مهام ظاهرة`} action="+ إضافة" onAction={() => setModal(true)} text={text} muted={muted}/>
      {todayTasks.map(t => <Task key={t.id} t={t} toggle={toggle} remove={remove} dark={dark}/>)}
      {!tasks.length && <Empty dark={dark} />}
      <Pressable onPress={() => setTab('focus')} style={[styles.focusBanner, { backgroundColor: dark ? '#22233A' : '#EEECFF' }]}><View style={styles.bannerIcon}><Icon name="focus" color={C.primary} size={23}/></View><View style={{ flex: 1, marginHorizontal: 12 }}><Text style={[styles.cardTitle, { color: text, fontSize: 14 }]}>جاهز لجلسة تركيز؟</Text><Text style={[styles.sub, { color: muted }]}>25 دقيقة بدون تشتيت</Text></View><Icon name="arrow" size={20} color={C.primary}/></Pressable>
    </View>
  </ScrollView>;
}

function TasksScreen({ dark, card, text, muted, tasks, toggle, remove, setModal }) {
  const pending = tasks.filter(t => !t.done), done = tasks.filter(t => t.done);
  return <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><Header title="مهامي" sub="كل ما تريد إنجازه في مكان واحد" dark={dark} add={() => setModal(true)}/><View style={[styles.summaryStrip, { backgroundColor: card }]}><View><Text style={[styles.stripNum, { color: text }]}>{pending.length}</Text><Text style={[styles.stripLabel, { color: muted }]}>قيد التنفيذ</Text></View><View><Text style={[styles.stripNum, { color: C.success }]}>{done.length}</Text><Text style={[styles.stripLabel, { color: muted }]}>مكتملة</Text></View><View><Text style={[styles.stripNum, { color: C.primary }]}>{tasks.length}</Text><Text style={[styles.stripLabel, { color: muted }]}>الإجمالي</Text></View></View><Text style={[styles.listTitle, { color: text }]}>قائمة المهام</Text>{tasks.map(t => <Task key={t.id} t={t} toggle={toggle} remove={remove} dark={dark}/>)}{!tasks.length && <Empty dark={dark}/>}</ScrollView>;
}

function FocusScreen({ dark, card, text, muted, minutes, seconds, running, choose, reset, setRunning }) {
  const total = minutes * 60 + seconds, ratio = total / (25 * 60);
  return <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><Header title="وقت التركيز" sub="أنجز أكثر عندما تعمل بتركيز" dark={dark}/><View style={[styles.focusCard, { backgroundColor: card }]}><View style={styles.timerRing}><Progress value={Math.min(1, ratio)} dark={dark} size={230}/><View style={styles.timerCenter}><Text style={[styles.timerText, { color: text }]}>{pad(minutes)}:{pad(seconds)}</Text><Text style={[styles.timerLabel, { color: muted }]}>{running ? 'جلسة جارية' : 'جاهز للتركيز'}</Text></View></View><View style={styles.timerBtns}><Pressable onPress={reset} style={[styles.secondary, { borderColor: dark ? '#3B3C50' : '#E0E0E9' }]}><Text style={{ color: text, fontWeight: '900' }}>إعادة</Text></Pressable><Pressable onPress={() => setRunning(x => !x)} style={styles.primary}><Text style={{ color: '#fff', fontWeight: '900' }}>{running ? 'إيقاف مؤقت' : 'ابدأ التركيز'}</Text></Pressable></View></View><Text style={[styles.h2, { color: text, marginHorizontal: 16, marginTop: 22 }]}>مدة الجلسة</Text><View style={styles.durations}>{[15, 25, 45, 60].map(m => <Pressable key={m} onPress={() => choose(m)} style={[styles.duration, { backgroundColor: minutes === m && !running ? C.primary : card }]}><Text style={{ color: minutes === m && !running ? '#fff' : text, fontWeight: '900', fontSize: 18 }}>{m}</Text><Text style={{ color: minutes === m && !running ? '#eee' : muted, fontSize: 9 }}>دقيقة</Text></Pressable>)}</View><View style={[styles.tip, { backgroundColor: dark ? '#202139' : '#FFF6E9' }]}><Text style={{ fontSize: 18 }}>💡</Text><View style={{ flex: 1, marginHorizontal: 10 }}><Text style={{ color: text, fontWeight: '900', textAlign: 'right' }}>نصيحة اليوم</Text><Text style={{ color: muted, fontSize: 11, lineHeight: 18, textAlign: 'right', marginTop: 3 }}>أبعد الهاتف عنك، واختر مهمة واحدة فقط حتى تنتهي الجلسة.</Text></View></View></ScrollView>;
}

function StatsScreen({ dark, card, text, muted, tasks, progress, completed, remaining, priorityCounts }) {
  const bars = [5, 8, 6, 10, 7, 9, Math.max(2, completed + 1)]; const max = Math.max(...bars, 10);
  return <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><Header title="الإحصائيات" sub="راقب عاداتك وطور إنتاجيتك" dark={dark}/><View style={[styles.statsHero, { backgroundColor: card }]}><Progress value={progress} dark={dark} size={155}/><View style={{ flex: 1, marginHorizontal: 14 }}><Text style={[styles.cardTitle, { color: text }]}>معدل إنجازك</Text><Text style={[styles.bigPercent, { color: C.primary }]}>{Math.round(progress * 100)}%</Text><Text style={[styles.sub, { color: muted }]}>استمر! كل مهمة مكتملة تقربك من هدفك.</Text></View></View><View style={styles.two}><Info title="مكتملة" value={completed} sub="مهام" icon="check" dark={dark}/><Info title="متبقية" value={remaining} sub="مهام" icon="tasks" dark={dark}/></View><View style={[styles.chartCard, { backgroundColor: card }]}><Text style={[styles.cardTitle, { color: text }]}>نشاط الأسبوع</Text><View style={styles.chart}>{bars.map((v, i) => <View key={i} style={styles.barCol}><View style={[styles.bar, { height: 100 * v / max, backgroundColor: i === 6 ? C.primary : (dark ? '#36354F' : '#DCD9FF') }]} /><Text style={[styles.day, { color: muted }]}>{['س','أ','ث','ر','خ','ج','س'][i]}</Text></View>)}</View></View><View style={[styles.priorityCard, { backgroundColor: card }]}><Text style={[styles.cardTitle, { color: text }]}>المهام حسب الأولوية</Text><PriorityRow label="عالية" count={priorityCounts.عالية} color={C.danger} dark={dark}/><PriorityRow label="متوسطة" count={priorityCounts.متوسطة} color={C.orange} dark={dark}/><PriorityRow label="منخفضة" count={priorityCounts.منخفضة} color={C.success} dark={dark}/></View></ScrollView>;
}

function SettingsScreen({ dark, card, text, muted, settings, setSettings, setTasks }) {
  return <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><Header title="الإعدادات" sub="خصص مهامي بالطريقة التي تناسبك" dark={dark}/><View style={[styles.settings, { backgroundColor: card }]}><Setting title="المظهر" sub="فاتح / تلقائي / داكن" icon={dark ? 'moon' : 'sun'} dark={dark}><View style={{ flexDirection: 'row', gap: 5 }}>{['light','auto','dark'].map(x => <Pressable key={x} onPress={() => setSettings(s => ({ ...s, theme: x }))} style={[styles.pill, settings.theme === x && { backgroundColor: C.primary }]}><Text style={{ fontSize: 9, fontWeight: '800', color: settings.theme === x ? '#fff' : muted }}>{x === 'light' ? 'فاتح' : x === 'auto' ? 'تلقائي' : 'داكن'}</Text></Pressable>)}</View></Setting><Setting title="الإشعارات" sub="تنبيه عند انتهاء جلسة التركيز" icon="bell" dark={dark}><Switch value={settings.notifications} onValueChange={v => setSettings(s => ({ ...s, notifications: v }))} trackColor={{ false: '#D5D5DF', true: '#A8A0F5' }} thumbColor={settings.notifications ? C.primary : '#fff'}/></Setting><Pressable onPress={() => Alert.alert('حذف المهام', 'هل تريد حذف جميع المهام؟', [{ text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => setTasks([]) }])} style={styles.danger}><Icon name="trash" color={C.danger}/><View style={{ flex: 1, marginHorizontal: 10 }}><Text style={{ color: C.danger, fontWeight: '900', textAlign: 'right' }}>حذف جميع المهام</Text><Text style={[styles.sub, { color: muted }]}>لا يمكن التراجع عن هذا الإجراء</Text></View></Pressable></View><View style={styles.about}><Logo dark={dark}/><Text style={{ color: text, fontWeight: '900', fontSize: 17, marginTop: 9 }}>مهامي 2.0</Text><Text style={{ color: muted, fontSize: 11, marginTop: 4 }}>رتب يومك. أنجز أكثر.</Text></View></ScrollView>;
}

function Section({ title, sub, action, onAction, text, muted }) { return <View style={styles.section}><View><Text style={[styles.h2, { color: text }]}>{title}</Text>{sub && <Text style={[styles.sub, { color: muted }]}>{sub}</Text>}</View>{action && <Pressable onPress={onAction}><Text style={{ color: C.primary, fontWeight: '900' }}>{action}</Text></Pressable>}</View>; }
function Progress({ value, dark, size = 145 }) { const r = 57, cc = 2 * Math.PI * r, d = Math.max(0, Math.min(1, value)) * cc; return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}><Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}><Circle cx={size/2} cy={size/2} r={r} stroke={dark ? '#2D2E44' : '#ECEBFF'} strokeWidth="13" fill="none"/><Circle cx={size/2} cy={size/2} r={r} stroke={C.primary} strokeWidth="13" strokeLinecap="round" strokeDasharray={`${d} ${cc}`} fill="none"/></Svg><Text style={{ fontSize: size > 150 ? 38 : 26, fontWeight: '900', color: dark ? '#fff' : C.ink }}>{Math.round(value * 100)}%</Text></View>; }
function Mini({ v, l, text, muted }) { return <View style={{ alignItems: 'center' }}><Text style={{ fontSize: 17, fontWeight: '900', color: text }}>{v}</Text><Text style={{ fontSize: 9, color: muted, marginTop: 2 }}>{l}</Text></View>; }
function Info({ title, value, sub, icon, dark }) { return <View style={[styles.info, { backgroundColor: dark ? C.darkCard : C.white }]}><View style={styles.infoIcon}><Icon name={icon}/></View><Text style={{ color: dark ? '#A0A1B5' : C.muted, fontSize: 10, marginTop: 8 }}>{title}</Text><Text style={{ color: dark ? '#fff' : C.ink, fontSize: 23, fontWeight: '900', marginTop: 2 }}>{value}</Text><Text style={{ color: dark ? '#77798E' : '#999AAA', fontSize: 9 }}>{sub}</Text></View>; }
function Task({ t, toggle, remove, dark }) { const pc = t.priority === 'عالية' ? C.danger : t.priority === 'متوسطة' ? C.orange : C.success; return <View style={[styles.task, { backgroundColor: dark ? C.darkCard : C.white }]}><Pressable onPress={() => toggle(t.id)} style={[styles.check, { borderColor: t.done ? C.success : (dark ? '#47485E' : '#D9D9E5'), backgroundColor: t.done ? C.success : 'transparent' }]}>{t.done && <Icon name="check" size={15} color="#fff"/>}</Pressable><View style={{ flex: 1 }}><Text style={[styles.taskTitle, { color: dark ? '#fff' : C.ink }, t.done && { textDecorationLine: 'line-through', opacity: .45 }]}>{t.title}</Text><View style={styles.taskMeta}><View style={[styles.priorityDot, { backgroundColor: pc }]} /><Text style={{ color: dark ? '#999BAF' : '#77798A', fontSize: 9 }}>{t.priority} · {t.time}</Text></View></View><Pressable onPress={() => remove(t.id)} hitSlop={10}><Icon name="trash" size={18} color={dark ? '#7E8094' : '#A0A0AD'}/></Pressable></View>; }
function Empty({ dark }) { return <View style={[styles.empty, { backgroundColor: dark ? C.darkCard : C.white }]}><View style={styles.emptyIcon}><Icon name="check" size={30}/></View><Text style={{ fontSize: 18, fontWeight: '900', color: dark ? '#fff' : C.ink, marginTop: 12 }}>لا توجد مهام 🎉</Text><Text style={{ color: dark ? '#999' : '#777', fontSize: 11, textAlign: 'center', marginTop: 5, lineHeight: 18 }}>استمتع بوقتك، أو أضف مهمة جديدة عندما تكون جاهزًا.</Text></View>; }
function Header({ title, sub, dark, add }) { return <View style={styles.header}><View style={{ flex: 1 }}><Text style={[styles.big, { color: dark ? '#fff' : C.ink }]}>{title}</Text><Text style={[styles.sub, { color: dark ? '#999' : '#777' }]}>{sub}</Text></View>{add ? <Pressable onPress={add} style={styles.fab}><Icon name="plus" size={24} color="#fff"/></Pressable> : <Logo dark={dark}/>}</View>; }
function Setting({ title, sub, icon, dark, children }) { return <View style={styles.setting}><View style={styles.settingIcon}><Icon name={icon}/></View><View style={{ flex: 1, marginHorizontal: 12 }}><Text style={{ fontSize: 14, fontWeight: '900', color: dark ? '#fff' : C.ink, textAlign: 'right' }}>{title}</Text><Text style={{ fontSize: 10, color: dark ? '#999' : '#777', marginTop: 3, textAlign: 'right' }}>{sub}</Text></View>{children}</View>; }
function PriorityRow({ label, count, color, dark }) { return <View style={styles.priorityRow}><View style={[styles.priorityLine, { backgroundColor: dark ? '#2A2B3E' : '#F0F0F5' }]}><View style={[styles.priorityFill, { width: `${Math.min(100, count * 15 + 5)}%`, backgroundColor: color }]} /></View><Text style={{ width: 55, textAlign: 'right', color: dark ? '#fff' : C.ink, fontWeight: '800', fontSize: 11 }}>{label}</Text><Text style={{ width: 28, color: color, fontWeight: '900', fontSize: 12 }}>{count}</Text></View>; }
function Bottom({ tab, setTab, dark, add }) { const items = [['home','الرئيسية'],['tasks','المهام'],['focus','التركيز'],['stats','إحصائيات'],['settings','الإعدادات']]; return <View style={[styles.nav, { backgroundColor: dark ? '#191A2D' : '#fff', borderTopColor: dark ? '#292A3C' : '#E9E9F0' }]}>{items.map(([n,l]) => <Nav key={n} n={n} l={l} active={tab === n} set={() => setTab(n)} dark={dark}/>)}</View>; }
function Nav({ n, l, active, set, dark }) { return <Pressable onPress={set} style={styles.navItem}><Icon name={n} color={active ? C.primary : (dark ? '#818397' : '#9697A5')} size={21}/><Text style={{ fontSize: 8, fontWeight: '900', color: active ? C.primary : (dark ? '#818397' : '#9697A5') }}>{l}</Text></Pressable>; }
function TaskModal({ visible, dark, card, text, muted, title, setTitle, priority, setPriority, close, add }) {
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [visible]);
  const submit = () => { Keyboard.dismiss(); add(); };
  return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={close}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: card }]}>
          <View style={styles.handle}/>
          <View style={styles.modalHead}><Text style={[styles.modalTitle, { color: text }]}>إضافة مهمة جديدة</Text><Pressable onPress={close}><Text style={{ color: muted, fontSize: 26 }}>×</Text></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 6 }}>
            <Text style={[styles.label, { color: text }]}>عنوان المهمة</Text>
            <TextInput ref={inputRef} value={title} onChangeText={setTitle} placeholder="مثال: مراجعة المشروع" placeholderTextColor={dark ? '#707184' : '#A2A2AE'} style={[styles.input, { backgroundColor: dark ? '#24253A' : '#F5F5FA', color: text }]} textAlign="right" autoFocus={false} showSoftInputOnFocus={true} keyboardType="default" returnKeyType="done" blurOnSubmit={false} onSubmitEditing={submit}/>
            <Text style={[styles.label, { color: text }]}>الأولوية</Text>
            <View style={styles.priorities}>{['عالية','متوسطة','منخفضة'].map(p => { const pc = p === 'عالية' ? C.danger : p === 'متوسطة' ? C.orange : C.success; return <Pressable key={p} onPress={() => setPriority(p)} style={[styles.priority, { backgroundColor: priority === p ? pc : (dark ? '#24253A' : '#F3F3F8') }]}><Text style={{ color: priority === p ? '#fff' : pc, fontWeight: '900', fontSize: 11 }}>{p}</Text></Pressable>; })}</View>
            <Pressable onPress={submit} style={styles.save}><Icon name="plus" size={20} color="#fff"/><Text style={{ color: '#fff', fontWeight: '900' }}>إضافة المهمة</Text></Pressable>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 110 }, pad: { paddingHorizontal: 16 },
  hero: { margin: 16, borderRadius: 30, padding: 21, backgroundColor: C.primary, overflow: 'hidden', minHeight: 184 },
  heroDecor1: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: '#FFFFFF16', right: -45, top: -55 },
  heroDecor2: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFFFFF12', left: -35, bottom: -40 },
  heroTop: { flexDirection: 'row', alignItems: 'center' }, hello: { color: '#fff', fontSize: 27, fontWeight: '900', textAlign: 'right' }, heroSub: { color: '#E8E6FF', fontSize: 12, lineHeight: 19, textAlign: 'right', marginTop: 6 },
  logo: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, dateRow: { marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 8 }, date: { color: '#fff', fontSize: 10, fontWeight: '700', flex: 1 }, clockBox: { borderRadius: 11, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FFFFFF20' }, clock: { color: '#fff', fontWeight: '900', fontSize: 11 },
  section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 }, h2: { fontSize: 19, fontWeight: '900', textAlign: 'right' }, sub: { fontSize: 10, marginTop: 3, textAlign: 'right' },
  progressCard: { borderRadius: 25, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 1 }, cardTitle: { fontSize: 16, fontWeight: '900', textAlign: 'right' }, mini: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 19, paddingRight: 4 },
  two: { flexDirection: 'row', gap: 11, marginBottom: 5 }, info: { flex: 1, borderRadius: 21, padding: 14, minHeight: 132, elevation: 1 }, infoIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: '#6C63FF18', alignItems: 'center', justifyContent: 'center' },
  task: { marginBottom: 9, borderRadius: 19, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, elevation: 1 }, check: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, taskTitle: { fontSize: 13, fontWeight: '900', textAlign: 'right' }, taskMeta: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 5, marginTop: 5 }, priorityDot: { width: 6, height: 6, borderRadius: 3 }, empty: { borderRadius: 22, padding: 28, alignItems: 'center', marginBottom: 10 }, emptyIcon: { width: 62, height: 62, borderRadius: 21, backgroundColor: '#EEEDFF', alignItems: 'center', justifyContent: 'center' },
  focusBanner: { borderRadius: 20, padding: 13, flexDirection: 'row', alignItems: 'center', marginTop: 7 }, bannerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  header: { padding: 20, paddingTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 90 }, big: { fontSize: 29, fontWeight: '900', textAlign: 'right' }, fab: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  summaryStrip: { marginHorizontal: 16, borderRadius: 21, padding: 15, flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18, elevation: 1 }, stripNum: { fontSize: 20, fontWeight: '900', textAlign: 'center' }, stripLabel: { fontSize: 9, marginTop: 2, textAlign: 'center' }, listTitle: { fontSize: 17, fontWeight: '900', marginHorizontal: 16, marginBottom: 10, textAlign: 'right' },
  focusCard: { margin: 16, borderRadius: 28, padding: 20, alignItems: 'center', elevation: 1 }, timerRing: { alignItems: 'center', justifyContent: 'center' }, timerCenter: { position: 'absolute', alignItems: 'center' }, timerText: { fontSize: 42, fontWeight: '900' }, timerLabel: { fontSize: 10, marginTop: 2 }, timerBtns: { flexDirection: 'row', gap: 10, marginTop: 22 }, primary: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 15 }, secondary: { paddingHorizontal: 22, paddingVertical: 14, borderRadius: 15, borderWidth: 1 }, durations: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 }, duration: { flex: 1, borderRadius: 17, paddingVertical: 15, alignItems: 'center', elevation: 1 }, tip: { margin: 16, borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center' },
  statsHero: { marginHorizontal: 16, borderRadius: 25, padding: 18, flexDirection: 'row', alignItems: 'center', elevation: 1 }, bigPercent: { fontSize: 30, fontWeight: '900', textAlign: 'right', marginTop: 3 }, chartCard: { margin: 16, borderRadius: 24, padding: 18, elevation: 1 }, chart: { height: 145, marginTop: 15, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }, barCol: { height: 130, alignItems: 'center', justifyContent: 'flex-end', gap: 7 }, bar: { width: 17, borderRadius: 8 }, day: { fontSize: 9 }, priorityCard: { marginHorizontal: 16, borderRadius: 24, padding: 18, elevation: 1 }, priorityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 17 }, priorityLine: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 }, priorityFill: { height: '100%', borderRadius: 4 },
  settings: { marginHorizontal: 16, borderRadius: 24, paddingHorizontal: 16, elevation: 1 }, setting: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#00000008' }, settingIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#F0EFFF', alignItems: 'center', justifyContent: 'center' }, pill: { paddingHorizontal: 8, paddingVertical: 7, borderRadius: 9, backgroundColor: '#F2F2F7' }, danger: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 2 }, about: { alignItems: 'center', marginTop: 18 },
  nav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 74, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 5 }, navItem: { width: 62, alignItems: 'center', gap: 4 },
  overlay: { flex: 1, backgroundColor: '#00000070', justifyContent: 'flex-end' }, modal: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 34 }, handle: { width: 45, height: 5, borderRadius: 3, backgroundColor: '#D6D6DF', alignSelf: 'center', marginBottom: 18 }, modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, modalTitle: { fontSize: 20, fontWeight: '900' }, label: { fontSize: 11, fontWeight: '800', textAlign: 'right', marginBottom: 8 }, input: { height: 54, borderRadius: 16, paddingHorizontal: 15, fontSize: 14, marginBottom: 18 }, priorities: { flexDirection: 'row', gap: 8, marginBottom: 22 }, priority: { flex: 1, borderRadius: 13, paddingVertical: 12, alignItems: 'center' }, save: { height: 55, borderRadius: 17, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
});
