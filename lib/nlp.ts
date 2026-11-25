/**
 * Lightweight, fully offline symptom extractor.
 * Turns free text ("my head is killing me and I keep throwing up, no fever")
 * into canonical symptom ids, with negation handling.
 */
import { canon } from "./diseaseData";

// symptom id -> phrases (lowercase). Longer/more specific phrases win via ordering below.
const LEXICON: Record<string, string[]> = {
  high_fever: ["fever","high temperature","high temp","temperature","feverish","burning up","running a temperature"],
  low_grade_fever: ["low grade fever","mild fever","slight fever","low-grade fever"],
  chills: ["chills","chilly","shivering","shivers","shaking with cold"],
  sweating: ["sweating","sweaty","perspiring","sweats"],
  night_sweats: ["night sweats","sweating at night","sweat at night","wake up drenched"],
  fatigue: ["fatigue","tired","tiredness","exhausted","exhaustion","no energy","low energy","lethargic","drained","worn out"],
  weakness: ["weakness","feel weak","feeling weak","weak"],
  body_ache: ["body ache","body aches","body pain","aching all over","achy","aches all over","whole body hurts"],
  muscle_pain: ["muscle pain","muscle ache","muscle aches","sore muscles","myalgia"],
  muscle_weakness: ["muscle weakness","weak muscles"],
  muscle_cramps: ["muscle cramps","cramping muscles","leg cramps"],
  headache: ["headache","head ache","head hurts","head pain","head is pounding","pounding head"],
  severe_headache: ["severe headache","terrible headache","worst headache","splitting headache","killer headache","excruciating headache"],
  throbbing_headache: ["throbbing headache","throbbing head","migraine","pulsating headache"],
  dizziness: ["dizzy","dizziness","lightheaded","light headed","light-headed","woozy","vertigo","room spinning","head spinning"],
  fainting: ["fainting","fainted","passed out","pass out","blacked out","blackout"],
  loss_of_balance: ["loss of balance","unsteady","off balance","cant balance","can't balance","losing balance"],
  confusion: ["confused","confusion","disoriented","cant think straight","can't think straight"],
  memory_loss: ["memory loss","forgetful","forgetting things","cant remember","can't remember","memory problems"],
  brain_fog: ["brain fog","foggy","cant concentrate","can't concentrate"],
  seizures: ["seizure","seizures","convulsion","convulsions","fits"],
  tremors: ["tremor","tremors","shaking hands","hands shaking","trembling"],
  numbness: ["numbness","numb","loss of feeling"],
  tingling: ["tingling","pins and needles","prickling"],
  difficulty_speaking: ["trouble speaking","difficulty speaking","slurred speech","cant speak properly","can't speak properly"],
  facial_drooping: ["face drooping","facial drooping","drooping face","face is drooping"],
  nausea: ["nausea","nauseous","feel sick","feeling sick","queasy","sick to my stomach"],
  vomiting: ["vomiting","vomit","vomited","throwing up","threw up","puking","puke"],
  diarrhea: ["diarrhea","diarrhoea","loose motion","loose motions","loose stool","loose stools","watery stool","runny stomach"],
  severe_diarrhea: ["severe diarrhea","severe diarrhoea","violent diarrhea"],
  constipation: ["constipation","constipated","cant poop","can't poop","hard stool","hard stools"],
  abdominal_pain: ["stomach pain","stomach ache","stomachache","belly pain","abdominal pain","tummy pain","tummy ache","stomach hurts","belly hurts"],
  stomach_cramps: ["stomach cramps","cramps in stomach","stomach cramp","abdominal cramps"],
  severe_abdominal_pain: ["severe stomach pain","severe abdominal pain","unbearable stomach pain","sharp stomach pain"],
  bloating: ["bloating","bloated","swollen belly","gassy and full"],
  excessive_gas: ["gas","gassy","flatulence","farting a lot"],
  heartburn: ["heartburn","acid reflux","burning chest after eating","acidity"],
  indigestion: ["indigestion","upset stomach","dyspepsia"],
  burping: ["burping","belching"],
  loss_of_appetite: ["loss of appetite","no appetite","not hungry","dont feel like eating","don't feel like eating","lost my appetite"],
  weight_loss: ["weight loss","losing weight","lost weight","unexplained weight loss"],
  weight_gain: ["weight gain","gaining weight","gained weight","putting on weight"],
  blood_in_stool: ["blood in stool","blood in poop","bloody stool","bloody stools","blood when i poop","black stool","tarry stool"],
  dark_urine: ["dark urine","dark pee","tea colored urine","tea-colored urine"],
  cough: ["cough","coughing"],
  dry_cough: ["dry cough","tickly cough","hacking cough"],
  wet_cough: ["wet cough","productive cough","cough with phlegm","phlegm","chesty cough"],
  chronic_cough: ["chronic cough","cough for weeks","persistent cough","long lasting cough","cough that wont go away"],
  blood_in_sputum: ["coughing blood","coughing up blood","blood in sputum","blood in phlegm","spitting blood"],
  sore_throat: ["sore throat","throat pain","throat hurts","scratchy throat","throat is sore","painful throat"],
  difficulty_swallowing: ["difficulty swallowing","trouble swallowing","painful swallowing","hurts to swallow","cant swallow","can't swallow"],
  hoarseness: ["hoarse","hoarseness","lost my voice","raspy voice"],
  runny_nose: ["runny nose","running nose","nose running","dripping nose"],
  nasal_congestion: ["blocked nose","stuffy nose","nasal congestion","congested","nose is blocked","stuffed up","stuffed nose"],
  sneezing: ["sneezing","sneeze","sneezes"],
  post_nasal_drip: ["post nasal drip","postnasal drip","mucus down my throat"],
  shortness_of_breath: ["shortness of breath","short of breath","breathless","breathlessness","difficulty breathing","trouble breathing","cant breathe","can't breathe","hard to breathe","out of breath","breathing difficulty"],
  wheezing: ["wheezing","wheeze","whistling breath","whistling sound when breathing"],
  rapid_breathing: ["rapid breathing","fast breathing","breathing fast"],
  chest_pain: ["chest pain","pain in chest","pain in my chest","chest hurts","chest ache"],
  chest_tightness: ["chest tightness","tight chest","tightness in chest","chest feels tight","pressure in chest","chest pressure"],
  palpitations: ["palpitations","heart pounding","heart racing","racing heart","fluttering heart","heart fluttering"],
  rapid_heartbeat: ["rapid heartbeat","fast heartbeat","fast heart rate","heart beating fast"],
  irregular_heartbeat: ["irregular heartbeat","skipped beats","skipping beats","irregular heart"],
  left_arm_pain: ["left arm pain","pain in left arm","pain in my left arm","left arm hurts"],
  jaw_pain: ["jaw pain","jaw hurts","pain in jaw"],
  bluish_lips: ["blue lips","bluish lips","lips turning blue"],
  rash: ["rash","skin rash","red spots","spots on skin","skin eruptions"],
  itching: ["itching","itchy","itch","scratching a lot"],
  hives: ["hives","welts","urticaria"],
  blisters: ["blisters","blister","fluid filled bumps"],
  redness: ["redness","red skin","skin is red","red patches"],
  dry_skin: ["dry skin","flaky skin","skin is dry"],
  scaly_skin: ["scaly skin","scales on skin","scaly patches","scaly"],
  skin_peeling: ["peeling skin","skin peeling","skin is peeling"],
  swelling: ["swelling","swollen","puffiness","puffy"],
  acne: ["acne","pimples","zits","breakouts"],
  pustules: ["pustules","pus filled","pus-filled"],
  open_sores: ["open sores","sores that wont heal","sore that won't heal","ulcers on skin"],
  burning_skin: ["burning skin","skin burning","burning sensation on skin"],
  yellowing_of_skin: ["yellow skin","yellowing of skin","skin turning yellow","yellowish skin"],
  jaundice: ["jaundice","yellow eyes","eyes turning yellow","yellowing of eyes"],
  pale_skin: ["pale skin","looking pale","pallor","pale face"],
  hair_loss: ["hair loss","losing hair","hair falling","hair fall","balding","thinning hair"],
  joint_pain: ["joint pain","joints hurt","aching joints","painful joints","joints ache","pain in joints"],
  joint_swelling: ["joint swelling","swollen joints","swollen knee","swollen ankle","swollen wrist"],
  stiffness: ["stiffness","stiff joints","morning stiffness","feel stiff","stiff"],
  back_pain: ["back pain","backache","back hurts","pain in back","pain in my back"],
  lower_back_pain: ["lower back pain","pain in lower back","low back pain"],
  neck_stiffness: ["stiff neck","neck stiffness","neck is stiff","cant bend neck","can't touch chin to chest"],
  bone_pain: ["bone pain","bones hurt","bones ache"],
  leg_pain: ["leg pain","legs hurt","pain in leg","pain in my leg"],
  shooting_pain: ["shooting pain","electric shock pain","pain shooting down leg"],
  limited_mobility: ["limited mobility","hard to move","difficulty moving","cant move properly","can't move properly"],
  frequent_urination: ["frequent urination","peeing a lot","urinating often","urinate frequently","keep peeing","going to the toilet a lot","pee frequently"],
  painful_urination: ["painful urination","burning urination","burning when i pee","burning when peeing","hurts to pee","pain when urinating","burning urine","stinging when peeing"],
  blood_in_urine: ["blood in urine","bloody urine","blood in pee","red urine","pink urine"],
  cloudy_urine: ["cloudy urine","cloudy pee"],
  strong_odor_urine: ["smelly urine","strong smelling urine","strong urine odor","urine smells"],
  urgency_to_urinate: ["urgency to urinate","sudden urge to pee","urgent need to pee","cant hold urine","can't hold urine"],
  pelvic_pain: ["pelvic pain","lower abdominal pain","pain in pelvis","pain below belly button"],
  irregular_periods: ["irregular periods","irregular period","missed periods","missed period","periods are irregular"],
  severe_menstrual_cramps: ["severe period cramps","painful periods","bad period cramps","menstrual cramps"],
  excessive_thirst: ["excessive thirst","very thirsty","always thirsty","constant thirst","thirsty all the time"],
  hunger: ["always hungry","extreme hunger","constant hunger"],
  depression: ["depressed","depression","feeling down","feel hopeless","sad all the time","persistently sad","low mood"],
  hopelessness: ["hopeless","hopelessness","no point in living","feel worthless"],
  anxiety: ["anxiety","anxious","worried all the time","nervous all the time","feeling on edge"],
  panic_attacks: ["panic attack","panic attacks","panicking"],
  mood_swings: ["mood swings","moody"],
  irritability: ["irritable","irritability","short tempered","short-tempered"],
  sleep_disturbances: ["cant sleep","can't sleep","trouble sleeping","insomnia","sleeping badly","waking up at night","sleepless","difficulty sleeping","poor sleep"],
  social_withdrawal: ["withdrawn","avoiding people","social withdrawal","isolating myself"],
  loss_of_interest: ["loss of interest","no interest","nothing interests me","lost interest"],
  red_eyes: ["red eyes","eyes are red","bloodshot eyes","pink eye"],
  itchy_eyes: ["itchy eyes","eyes itch","eyes are itchy"],
  watery_eyes: ["watery eyes","eyes watering","teary eyes","tearing"],
  eye_pain: ["eye pain","eyes hurt","pain in eye","pain in my eye"],
  blurred_vision: ["blurred vision","blurry vision","vision is blurry","cant see clearly","can't see clearly"],
  double_vision: ["double vision","seeing double"],
  sensitivity_to_light: ["sensitive to light","light sensitivity","photophobia","light hurts my eyes","bright lights hurt"],
  sensitivity_to_sound: ["sensitive to sound","sound sensitivity","noise sensitivity","noises bother me"],
  dry_eyes: ["dry eyes","eyes feel dry"],
  discharge_from_eyes: ["eye discharge","discharge from eyes","sticky eyes","pus in eye","crusty eyes"],
  swollen_eyelids: ["swollen eyelids","puffy eyelids","eyelid swelling"],
  floaters: ["floaters","spots in vision","floating spots"],
  ear_pain: ["ear pain","earache","ear ache","ear hurts","pain in ear","pain in my ear"],
  hearing_loss: ["hearing loss","cant hear well","can't hear well","muffled hearing","hard of hearing","losing hearing"],
  ringing_in_ears: ["ringing in ears","ringing in my ears","tinnitus","buzzing in ears","ears ringing"],
  discharge_from_ear: ["ear discharge","discharge from ear","fluid from ear","pus from ear"],
  fullness_in_ear: ["blocked ear","ear feels full","fullness in ear","clogged ear"],
  swollen_tonsils: ["swollen tonsils","tonsils swollen","enlarged tonsils"],
  white_patches_on_throat: ["white patches","white spots in throat","white patches on throat","white spots on tonsils"],
  swollen_lymph_nodes: ["swollen glands","swollen lymph nodes","swollen neck glands","lumps in neck","swollen nodes"],
  bad_breath: ["bad breath","halitosis"],
  loss_of_smell: ["loss of smell","cant smell","can't smell","no sense of smell","lost my smell"],
  loss_of_taste: ["loss of taste","cant taste","can't taste","lost my taste","no sense of taste"],
  nosebleed: ["nosebleed","nose bleed","bleeding nose","nose bleeds"],
  mouth_sores: ["mouth sores","mouth ulcers","ulcers in mouth","canker sores"],
  breast_lump: ["breast lump","lump in breast","lump in my breast"],
  breast_pain: ["breast pain","breast tenderness"],
  nipple_discharge: ["nipple discharge"],
  frequent_infections: ["frequent infections","keep getting infections","always getting sick"],
  dehydration: ["dehydrated","dehydration","dry mouth and thirsty"],
  cold_hands_feet: ["cold hands and feet","cold hands","cold feet"],
  cold_intolerance: ["cant tolerate cold","can't tolerate cold","always cold","feel cold all the time"],
  heat_intolerance: ["cant tolerate heat","can't tolerate heat","always hot","intolerant to heat"],
  excessive_sweating: ["excessive sweating","sweating a lot","sweating too much"],
  high_blood_pressure: ["high blood pressure","hypertension","bp is high","raised blood pressure"],
  visual_disturbances: ["visual disturbances","seeing flashes","flashing lights","zigzag lines"],
  aura: ["aura","seeing auras"],
  difficulty_conceiving: ["trouble conceiving","difficulty conceiving","cant get pregnant","can't get pregnant","infertility"],
  fracture_after_minor_fall: ["broke a bone from a small fall","fracture after minor fall"],
  loss_of_consciousness: ["lost consciousness","loss of consciousness","unconscious"],
  mucus_in_stool: ["mucus in stool","mucus in poop"],
  tenderness: ["tenderness","tender to touch"],
  sensitivity_to_touch: ["sensitive to touch","painful to touch"],
  skin_darkening: ["skin darkening","dark patches","darkened skin"],
  slow_healing: ["slow healing","wounds heal slowly","cuts take long to heal"],
  facial_pain: ["facial pain","pain in face","face hurts","pressure in face"],
  stooped_posture: ["stooped posture","hunched posture"],
  loss_of_height: ["losing height","loss of height","getting shorter"],
  noisy_breathing: ["noisy breathing","loud breathing"],
  whooping_sound: ["whooping sound","whoop when coughing"],
};

const NEGATORS = ["no","not","without","never","denies","denied","none","dont","don't","didnt","didn't","havent","haven't","hasnt","hasn't","cant","can't","isnt","isn't","free of","absence of","negative for"];

const norm = (t: string) =>
  t.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9'\- ]+/g, " ").replace(/\s+/g, " ").trim();

// Build flat phrase list, longest phrases first so "severe headache" beats "headache".
const PHRASES: { phrase: string; id: string; re: RegExp }[] = Object.entries(LEXICON)
  .flatMap(([id, phrases]) => phrases.map(p => ({ phrase: norm(p), id })))
  .sort((a, b) => b.phrase.length - a.phrase.length)
  .map(x => ({ ...x, re: new RegExp(`(?:^| )${x.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:s|es)?(?= |$)`, "g") }));

export interface Extraction { present: string[]; absent: string[] }

export function extractSymptoms(text: string): Extraction {
  let t = " " + norm(text) + " ";
  t = t.trim();
  const present = new Set<string>();
  const absent = new Set<string>();
  const masked = { v: t };

  for (const { id, re } of PHRASES) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    const s = masked.v;
    const hits: { start: number; end: number }[] = [];
    while ((m = re.exec(s))) {
      const start = m.index + (s[m.index] === " " ? 1 : 0);
      hits.push({ start, end: m.index + m[0].length });
      if (m[0].length === 0) re.lastIndex++;
    }
    if (!hits.length) continue;
    const cid = canon(id);
    let sMasked = s;
    for (const h of hits) {
      // look back up to 4 words for a negator
      const before = s.slice(0, h.start).trim().split(" ").slice(-4).join(" ");
      const negated = NEGATORS.some(n => new RegExp(`(?:^| )${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?: |$)`).test(before)) && !/\b(but|however|although)\b/.test(before.split(/\bno|not|without|never|don't|dont\b/).pop() || "");
      (negated ? absent : present).add(cid);
      sMasked = sMasked.slice(0, h.start) + "#".repeat(h.end - h.start) + sMasked.slice(h.end); // prevent shorter phrases re-matching
    }
    masked.v = sMasked;
  }
  for (const a of absent) if (present.has(a)) absent.delete(a);
  return { present: [...present], absent: [...absent] };
}
export const LEXICON_IDS = Object.keys(LEXICON).map(canon);
