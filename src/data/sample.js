// SYNTHETIC SAMPLE. Written by hand for this demo. These are not real calls and not SquadStack data.
// "ref" = what the caller said. "hyp" = what a speech recogniser might have heard.
// Errors were inserted on purpose, modelled on the kinds of mistakes SquadStack's public Arth V2 post
// describes (a wrong number such as छब्बीस -> छत्तीस or bees -> tees, a "nahi" heard as "haan",
// a misheard promise to pay). Hindi is in Devanagari and English in Latin, like the public benchmark;
// three calls are romanised Hinglish to show both scripts work.

export const SAMPLE_LABEL = 'Synthetic sample: 20 hand-written Hinglish calls, errors inserted on purpose. Not real calls, not SquadStack data.';

export const SAMPLE_CALLS = [
  // ---------- BFSI: EMI reminder ----------
  { id: 'BF-101', campaign: 'BFSI · EMI reminder', turns: [
    { ref: 'हां बोलिए', hyp: 'हां बोलिए' },
    { ref: 'हां पता है EMI pending है', hyp: 'हां पता है EMI pending है' },
    { ref: 'छब्बीस तारीख को कर दूंगा पक्का', hyp: 'छत्तीस तारीख को कर दूंगा पक्का' },
    { ref: 'ठीक है thank you', hyp: 'ठीक है thank you' },
  ] },
  { id: 'BF-102', campaign: 'BFSI · EMI reminder', turns: [
    { ref: 'hello haan bol raha hoon', hyp: 'hello haan bol raha hoon' },
    { ref: 'EMI bees tareekh ko kar dunga', hyp: 'EMI tees tareekh ko kar dunga' },
    { ref: 'nahi abhi salary nahi aayi', hyp: 'haan abhi salary nahi aayi' },
  ] },
  { id: 'BF-103', campaign: 'BFSI · EMI reminder', turns: [
    { ref: 'जी बोलिए', hyp: 'जी बोलिए' },
    { ref: 'मैंने तो पिछले हफ्ते ही भर दिया था', hyp: 'मैंने तो पिछले हफ्ते ही भर दिया था' },
    { ref: 'तीन हजार चार सौ पचास रुपये', hyp: 'तीन हजार चार सौ पचास रुपये' },
    { ref: 'नहीं मुझे दोबारा call मत करो', hyp: 'नहीं मुझे दोबारा call मत करो' },
  ] },
  { id: 'BF-104', campaign: 'BFSI · EMI reminder', turns: [
    { ref: 'हां', hyp: 'हां' },
    { ref: 'बहुत परेशानी है घर में पापा गुजर गए पिछले महीने', hyp: 'बहुत परेशानी है घर में पापा गुजर गए पिछले महीने' },
    { ref: 'मुझे किसी इंसान से बात करनी है', hyp: 'मुझे किसी इन सान से बात करनी है' },
  ] },
  { id: 'BF-105', campaign: 'BFSI · EMI reminder', turns: [
    { ref: 'interest ज्यादा है उसको थोड़ा कम करिए', hyp: 'interest ज्यादा है उसको थोड़ा कम करिए' },
    { ref: 'साढ़े तीन हजार तक दे सकता हूं महीने का', hyp: 'तीन हजार तक दे सकता हूं महीने का' },
    { ref: 'नहीं इससे ज्यादा नहीं होगा', hyp: 'नहीं इससे ज्यादा नहीं होगा' },
  ] },

  { id: 'BF-106', campaign: 'BFSI · EMI reminder', turns: [
    { ref: 'हां सुन रहा हूं', hyp: 'हां सुन रहा हूं' },
    { ref: 'पिछली वाली तो कल ही भर दी थी', hyp: 'पिछली वाली तो कल ही भर दूंगी थी' },
    { ref: 'ये वाली सोमवार तक भर दूंगा', hyp: 'ये वाली सोमवार तक भर दो' },
  ] },

  // ---------- Logistics: cash-on-delivery confirmation ----------
  { id: 'LG-201', campaign: 'Logistics · COD confirmation', turns: [
    { ref: 'हां order मैंने ही किया था', hyp: 'हां order मैंने ही किया था' },
    { ref: 'कल शाम को दे दो पांच बजे के बाद', hyp: 'कल शाम को दे दो पांच बजे के बाद' },
    { ref: 'हां बारह सौ निन्यानवे cash दे दूंगा', hyp: 'हां बारह सौ निन्यानवे cash दे दूंगा' },
  ] },
  { id: 'LG-202', campaign: 'Logistics · COD confirmation', turns: [
    { ref: 'नहीं मैंने ये order नहीं किया', hyp: 'मैंने ये order किया' },
    { ref: 'cancel कर दीजिए', hyp: 'cancel कर दीजिए' },
  ] },
  { id: 'LG-203', campaign: 'Logistics · COD confirmation', turns: [
    { ref: 'pincode दो शून्य एक तीन शून्य एक है', hyp: 'pincode दो शून्य एक तीन शून्य एक है' },
    { ref: 'address में flat नंबर चौवन लिखा है', hyp: 'address में flat नंबर छप्पन लिखा है' },
    { ref: 'हां ठीक है', hyp: 'हां ठीक है' },
  ] },
  { id: 'LG-204', campaign: 'Logistics · COD confirmation', turns: [
    { ref: 'haan bhaiya parso dena', hyp: 'haan bhaiya parso dena' },
    { ref: 'paise paanch sau ready rakhunga', hyp: 'paise paanch sau ready rakhunga' },
    { ref: 'nahi nahi subah mat aana', hyp: 'haan haan subah mat aana' },
  ] },

  // ---------- Marketplace: supplier lead qualification ----------
  { id: 'MK-301', campaign: 'Marketplace · supplier lead', turns: [
    { ref: 'हां जी corrugated box चाहिए', hyp: 'हां जी corrugated box चाहिए' },
    { ref: 'अगर sample हो जाता है तो पांच से दस हजार piece लगेंगे three ply', hyp: 'अगर sample हो जाता है तो पांच से दस हजार piece लगेंगे free ply' },
    { ref: 'rate कितना पड़ेगा per piece', hyp: 'rate कितना पड़ेगा per piece' },
  ] },
  { id: 'MK-302', campaign: 'Marketplace · supplier lead', turns: [
    { ref: 'हमें चालीस quintal चाहिए हर महीने', hyp: 'हमें चालीस quintal चाहिए हर महीने' },
    { ref: 'delivery पंद्रह दिन में चाहिए', hyp: 'delivery पचास दिन में चाहिए' },
    { ref: 'हां GST bill चाहिए', hyp: 'हां GST bill चाहिए' },
  ] },
  { id: 'MK-303', campaign: 'Marketplace · supplier lead', turns: [
    { ref: 'अभी requirement नहीं है', hyp: 'अभी requirement है' },
    { ref: 'दो महीने बाद call करना', hyp: 'दो महीने बाद call करना' },
  ] },
  { id: 'MK-304', campaign: 'Marketplace · supplier lead', turns: [
    { ref: 'budget डेढ़ लाख तक है', hyp: 'budget डेढ़ लाख तक है' },
    { ref: 'हां अगले हफ्ते visit कर सकते हैं', hyp: 'हां अगले हफ्ते visit कर सकते हैं' },
  ] },

  // ---------- Education: counselling call ----------
  { id: 'ED-401', campaign: 'Education · counselling', turns: [
    { ref: 'yeah science yeah science', hyp: 'yeah thanks yeah science' },
    { ref: 'बारहवीं में अस्सी percent आए थे', hyp: 'बारहवीं में अस्सी percent आए थे' },
    { ref: 'fees कितनी है पूरे course की', hyp: 'fees कितनी है पूरे course की' },
  ] },
  { id: 'ED-402', campaign: 'Education · counselling', turns: [
    { ref: 'हां demo class चाहिए', hyp: 'हां demo class चाहिए' },
    { ref: 'शनिवार को ग्यारह बजे ठीक रहेगा', hyp: 'शनिवार को बारह बजे ठीक रहेगा' },
    { ref: 'नहीं weekday में नहीं हो पाएगा', hyp: 'नहीं weekday में नहीं हो पाएगा' },
  ] },
  { id: 'ED-403', campaign: 'Education · counselling', turns: [
    { ref: 'मुझे अपने senior से बात करवाइए', hyp: 'मुझे अपने सीन यर से बात करवाइए' },
    { ref: 'पहले वाले counsellor ने गलत बताया था', hyp: 'पहले वाले counsellor ने गलत बताया था' },
  ] },

  // ---------- Travel: booking follow-up ----------
  { id: 'TR-501', campaign: 'Travel · booking follow-up', turns: [
    { ref: 'हां goa package देखा था', hyp: 'हां goa package देखा था' },
    { ref: 'चार लोग हैं दो बच्चे', hyp: 'चार लोग हैं दो बच्चे' },
    { ref: 'सत्ताईस को निकलना है', hyp: 'सत्ताईस को निकलना है' },
    { ref: 'पैंतीस हजार per person ज्यादा है', hyp: 'पैंतालीस हजार per person ज्यादा है' },
  ] },
  { id: 'TR-502', campaign: 'Travel · booking follow-up', turns: [
    { ref: 'नहीं booking नहीं करनी अभी', hyp: 'booking करनी अभी' },
    { ref: 'phone मत करो बार बार', hyp: 'phone मत करो बार बार' },
  ] },
  { id: 'TR-503', campaign: 'Travel · booking follow-up', turns: [
    { ref: 'haan ji', hyp: 'haan ji' },
    { ref: 'advance kal tak de dunga', hyp: 'advance kal tak de dunga' },
    { ref: 'das hazaar abhi baaki ka baad mein', hyp: 'das hazaar abhi baaki ka baad mein' },
  ] },
];
