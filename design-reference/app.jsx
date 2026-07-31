const { LabShell, OverviewScreen, BankScreen, EvidenceReview, QueueScreen, HistoryScreen, SpeakingScreen, PracticeScreen, ResultScreen, ListeningPractice, ListeningSets, WritingTasks, WritingScreen, QuestionTypes, LabFooter } = window;
const { EmptyState, Button, Toast } = window.STAGEDesignSystem_0f9c53;
const skillOf = { reading: "Reading", listening: "Listening", writing: "Writing" };
function App(){
  const [route,setRoute]=React.useState('overview');
  const [review,setReview]=React.useState(null); // 'listening' | 'reading' | null
  const [practice,setPractice]=React.useState(null); // 做题中的题目 id
  const [result,setResult]=React.useState(null);     // {answers,secs} 交卷后的结果
  const [lis,setLis]=React.useState(null);           // {id,setMode} 听力做题中
  const [sets,setSets]=React.useState(false);        // 套题总览页
  const [writing,setWriting]=React.useState(null);   // 写作界面中的任务 id
  const [types,setTypes]=React.useState(null);       // 题型说明页（值为初始科目）
  const [toast,setToast]=React.useState(null);
  const say=(m)=>{setToast(m);clearTimeout(window.__lt);window.__lt=setTimeout(()=>setToast(null),2400)};
  const go=(r)=>{setReview(null);setPractice(null);setResult(null);setLis(null);setSets(false);setWriting(null);setTypes(null);setRoute(r)};
  const startPractice=(it)=>{
    if(window.LISTENING[it.id]){setResult(null);setSets(false);setLis({id:it.id,setMode:false});return}
    if(!window.PRACTICE[it.id]){say("这套题目还没接入原型（示例为 Reading 首篇与 Listening 首段）");return}
    setResult(null);setPractice(it.id);
  };
  const startSet=()=>{setSets(false);setResult(null);setLis({id:"l1",setMode:true})};
  const openReview=(skill)=>(it)=>{
    if(it.status==="未练习"){say("该题还没有练习记录——先练习，再复盘。");return}
    if(skill==="Writing"){say("Writing 复盘界面属于后续批次");return}
    setReview(skill.toLowerCase());
  };
  /* 沉浸式做题界面（占满视口）不挂 Footer，其余页面挂全站 Footer */
  let fullBleed=false;
  let body;
  if(types!==null){
    body=<QuestionTypes initial={types}/>;
  } else if(writing){
    fullBleed=true;
    body=<WritingScreen taskId={writing} onBack={()=>setWriting(null)}
      onFinish={()=>say("本次练习已完成，草稿与用时已记入学习记录")}/>;
  } else if(lis&&result){
    fullBleed=false;
    body=<ResultScreen id={lis.id} bank="LISTENING" result={result}
      onBank={()=>{setLis(null);setResult(null)}}
      onReview={()=>{setLis(null);setResult(null);setReview('listening')}}/>;
  } else if(lis){
    fullBleed=true;
    body=<ListeningPractice id={lis.id} setMode={lis.setMode} onBank={()=>setLis(null)} onSubmit={(r)=>setResult(r)}/>;
  } else if(sets){
    body=<ListeningSets onStart={startSet} onContinue={startSet}/>;
  } else if(practice&&result){
    body=<ResultScreen id={practice} result={result}
      onBank={()=>{setPractice(null);setResult(null)}}
      onReview={()=>{setPractice(null);setResult(null);setReview('reading')}}/>;
  } else if(practice){
    fullBleed=true;
    body=<PracticeScreen id={practice} onExit={()=>setPractice(null)} onSubmit={(r)=>setResult(r)}/>;
  } else if(review){
    fullBleed=true;
    body=<EvidenceReview mode={review} onBack={()=>setReview(null)} onQueued={()=>{say("已加入复盘队列，将按建议时间提醒重测");setReview(null);setRoute('queue')}}/>;
  } else if(route==='overview'){ body=<OverviewScreen onRoute={go}/>; }
  else if(route==='writing'){ body=<WritingTasks onStart={(t)=>setWriting(t.id)}/>; }
  else if(skillOf[route]){ body=<BankScreen skill={skillOf[route]} onOpenReview={openReview(skillOf[route])} onPractice={startPractice} onSets={()=>setSets(true)} onTypes={()=>setTypes(skillOf[route])}/>; }
  else if(route==='speaking'){ body=<SpeakingScreen onDone={(t)=>{
    window.LAB_HISTORY.days[0].events.unshift({kind:"独立表达",icon:"messages-square",title:t?t.en:"Speaking",meta:"Speaking · 对照自查清单完成"});
    say("已记录一次「独立表达」事件到学习记录");setRoute('history');
  }}/>; }
  else if(route==='queue'){ body=<QueueScreen/>; }
  else if(route==='history'){ body=<HistoryScreen/>; }
  else { body=null; }
  return <LabShell route={route} onRoute={go}>
    {body}
    {fullBleed?null:<LabFooter/>}
    {toast?<div style={{position:'fixed',bottom:24,left:236,right:0,display:'grid',placeItems:'center',zIndex:40,pointerEvents:'none'}}><Toast message={toast}/></div>:null}
  </LabShell>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
