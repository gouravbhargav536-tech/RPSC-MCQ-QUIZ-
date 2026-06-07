import { Question } from '../types';

export interface SeedQuestion {
  category: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  teacherInsight: string;
  wrongOptionsAnalysis: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  patternYear: string;
}

export const sampleQuizzes: SeedQuestion[] = [
  {
    category: 'rajasthan_current_affairs',
    question: 'राजस्थान सरकार द्वारा हाल ही में शुरू की गई "मुख्यमंत्री आयुष्मान दुर्घटना बीमा योजना" के तहत अधिकतम बीमा राशि कितनी है? / What is the maximum insurance coverage under the recently launched "Mukhyamantri Ayushman Durghatna Bima Yojana" by the Rajasthan government?',
    options: {
      A: '₹5 लाख (5 Lakhs)',
      B: '₹10 लाख (10 Lakhs)',
      C: '₹25 लाख (25 Lakhs)',
      D: '₹50 लाख (50 Lakhs)'
    },
    correctAnswer: 'B',
    explanation: 'इस योजना को पूर्ववर्ती चिरंजीवी दुर्घटना बीमा योजना के स्थान पर नवीनतम बजट के तहत ₹10 लाख की दुर्घटना सहायता राशि के साथ संचालित किया जा रहा है। / This scheme is operated with ₹10 Lakh accident assistance under the latest budget in place of the former Chiranjeevi Durghatna Yojana.',
    teacherInsight: 'याद रखो बालकों, स्वास्थ्य बीमा अलग है (स्वास्थ्य बीमा अब आयुष्मान भारत के तहत है) और दुर्घटना बीमा में मुख्य राशि ₹10 लाख की गयी है। भ्रमित न हों!',
    wrongOptionsAnalysis: {
      A: '₹5 लाख पुरानी सीमा थी जिसे चिरंजीवी योजना के शुरुआती चरणों में लागू किया गया था।',
      B: '₹10 लाख वर्तमान सही स्वीकृत दुर्घटना बीमा राशि है।',
      C: '₹25 लाख आयुष्मान भारत स्वास्थ्य बीमा के तहत निःशुल्क इलाज की सीमा है, दुर्घटना सहायता की नहीं।',
      D: '₹50 लाख अनुग्रह सहायता योजना विशेष परिस्थितियों में दी जाती है, सामान्य दुर्घटना बीमा में नहीं।'
    },
    patternYear: 'RPSC 2025-2026'
  },
  {
    category: 'rajasthan_current_affairs',
    question: 'राजस्थान के किस जिले में देश का पहला "कोयला आधारित सौर ऊर्जा संयंत्र (Coal-assisted Solar Power Plant)" स्थापित करने की घोषणा की गई है? / In which district of Rajasthan has the country\'s first Coal-assisted Solar Power Plant been announced to be established?',
    options: {
      A: 'जैसलमेर (Jaisalmer)',
      B: 'बाड़मेर (Barmer)',
      C: 'बीकानेर (Bikaner)',
      D: 'जोधपुर (Jodhpur)'
    },
    correctAnswer: 'C',
    explanation: 'बीकानेर जिले में तापीय ऊर्जा के साथ सौर संयोजन के लिए भारत के पहले हाइब्रिड कोयला-आधारित सौर ऊर्जा संयंत्र की नींव रखी गई है। / The foundation of India\'s first hybrid coal-assisted solar power plant has been laid in Bikaner district.',
    teacherInsight: 'राजस्थान का बीकानेर और जैसलमेर सौर ऊर्जा के सबसे बड़े केंद्र हैं! बीकानेर में इस नए प्रयोग से प्रदूषण कम होगा और हरित ऊर्जा का उत्पादन बढ़ेगा।',
    wrongOptionsAnalysis: {
      A: 'जैसलमेर में बड़े एकल सौर पार्क हैं, लेकिन यह हाइब्रिड कोयला-सौर संयंत्र नहीं है।',
      B: 'बाड़मेर लिग्नाइट कोयला उत्पादन और तेल क्षेत्र के लिए प्रसिद्ध है।',
      C: 'बीकानेर हाइब्रिड कोयला-सौर संयंत्र का सही स्थान है।',
      D: 'जोधपुर का भड़ला दुनिया का सबसे बड़ा सौर पार्क है, किन्तु यह तकनीक भिन्न है।'
    },
    patternYear: 'RPSC 2024'
  },
  {
    category: 'national_current_affairs',
    question: '69वें राष्ट्रीय फिल्म पुरस्कारों में किस फिल्म को सर्वश्रेष्ठ फीचर फिल्म का पुरस्कार दिया गया? / Which film was awarded the Best Feature Film at the 69th National Film Awards?',
    options: {
      A: 'आरआरआर (RRR)',
      B: 'गंगूबाई काठियावाड़ी (Gangubai Kathiawadi)',
      C: 'रॉकेट्री: द नंबी इफेक्ट (Rocketry: The Nambi Effect)',
      D: 'द कश्मीर फाइल्स (The Kashmir Files)'
    },
    correctAnswer: 'C',
    explanation: 'आर माधवन द्वारा निर्देशित "रॉकेट्री: द नंबी इफेक्ट" ने सर्वश्रेष्ठ फीचर फिल्म का राष्ट्रीय पुरस्कार जीता। / "Rocketry: The Nambi Effect" directed by R. Madhavan won the Best Feature Film Award.',
    teacherInsight: 'ध्यान रहे, RRR ने लोकप्रिय मनोरंजक फिल्म का पुरस्कार जीता था, पर मुख्य सर्वश्रेष्ठ फीचर फिल्म रॉकेट्री ही थी। ऐसे प्रश्न आरपीएससी बार-बार पूछता है!',
    wrongOptionsAnalysis: {
      A: 'RRR ने सर्वश्रेष्ठ मनोरंजक फिल्म (Wholesome Entertainment) का राष्ट्रीय पुरस्कार जीता था।',
      B: 'गंगूबाई काठियावाड़ी के लिए आलिया भट्ट ने सर्वश्रेष्ठ अभिनेत्री का पुरस्कार जीता।',
      C: 'रॉकेट्री सर्वश्रेष्ठ फीचर फिल्म श्रेणी में शीर्ष घोषित की गई थी।',
      D: 'द कश्मीर फाइल्स ने राष्ट्रीय एकता पर आधारित सर्वश्रेष्ठ फिल्म (नरगिस दत्त पुरस्कार) जीती।'
    },
    patternYear: 'RPSC 2024 Mixed'
  },
  {
    category: 'national_current_affairs',
    question: 'भारत ने किस देश को हराकर पुरुष हॉकी एशियाई चैंपियंस ट्रॉफी 2024 का खिताब जीता? / India defeated which country to win the Men\'s Hockey Asian Champions Trophy 2024?',
    options: {
      A: 'पाकिस्तान (Pakistan)',
      B: 'चीन (China)',
      C: 'जापान (Japan)',
      D: 'दक्षिण कोरिया (South Korea)'
    },
    correctAnswer: 'B',
    explanation: 'भारत ने फाइनल में चीन को 1-0 से हराकर रिकॉर्ड पांचवीं बार एशियाई चैंपियंस ट्रॉफी का खिताब अपने नाम किया। / India defeated China 1-0 in the final to win the Asian Champions Trophy for a record fifth time.',
    teacherInsight: 'एशियाई खेलों और हॉकी ट्रॉफियों के देश-विजेता परीक्षाओं में बहुत महत्वपूर्ण होते हैं। हॉकी हमारा राष्ट्रीय खेल है, इसे बिल्कुल याद रखें!',
    wrongOptionsAnalysis: {
      A: 'पाकिस्तान ने कांस्य पदक के लिए खेला था और वह शीर्ष पर नहीं पहुंच पाया।',
      B: 'चीन उपविजेता था जिसे भारतीय टीम ने रोमांचक फाइनल में मात दी।',
      C: 'जापान ग्रुप स्टेज में ही बाहर हो गया था।',
      D: 'दक्षिण कोरिया सेमीफाइनल में हार गया था।'
    },
    patternYear: 'RPSC Standard'
  },
  {
    category: 'rajasthan_gk',
    question: 'राजस्थान का प्रसिद्ध "भटनेर किला" किस नदी के मुहाने पर स्थित है? / On the banks of which river is the famous "Bhatner Fort" of Rajasthan located?',
    options: {
      A: 'चम्बल नदी (Chambal River)',
      B: 'घग्गर नदी (Ghaggar River)',
      C: 'लूनी नदी (Luni River)',
      D: 'बनास नदी (Banas River)'
    },
    correctAnswer: 'B',
    explanation: 'भटनेर का किला हनुमानगढ़ में प्राचीन सरस्वती (वर्तमान घग्गर नदी) के मार्ग पर स्थित है। इसे उत्तर भड़ किवाड़ भी कहा जाता है। / Bhatner Fort is located in Hanumangarh on the basin of Ghaggar (ancient Saraswati) river.',
    teacherInsight: 'भटनेर सबसे पुराना किला माना जाता है जहाँ सर्वाधिक विदेशी आक्रमण हुए थे। घग्गर नदी आंतरिक प्रवाह की सबसे बड़ी नदी है, इसे याद रखना!',
    wrongOptionsAnalysis: {
      A: 'चम्बल नदी दक्षिण-पूर्वी राजस्थान में बहती है और चित्तौड़गढ़ के पास भैंसरोडगढ़ दुर्ग इसके किनारे है।',
      B: 'घग्गर नदी हनुमानगढ़ की मुख्य नदी है जहाँ भटनेर दुर्ग सुरक्षित रूप से खड़ा है।',
      C: 'लूनी नदी पश्चिमी मरुस्थल की जीवन रेखा है, इसके पास सिवाना या जालौर दुर्ग स्थित हैं।',
      D: 'बनास नदी के तट पर टोंक और कुम्भलगढ़ का क्षेत्र आता है, न कि हनुमानगढ़।'
    },
    patternYear: 'RPSC Old Pattern'
  },
  {
    category: 'rajasthan_gk',
    question: 'प्रसिद्ध स्वतंत्रता सेनानी "सागरमल गोपा" का संबंध राजस्थान की किस रियासत से था? / Famous freedom fighter "Sagarmal Gopa" belonged to which princely state of Rajasthan?',
    options: {
      A: 'जोधपुर (Jodhpur)',
      B: 'जैसलमेर (Jaisalmer)',
      C: 'जयपुर (Jaipur)',
      D: 'कोटा (Kota)'
    },
    correctAnswer: 'B',
    explanation: 'सागरमल गोपा जैसलमेर रियासत के स्वतंत्रता सेनानी थे जिन्होंने "जैसलमेर में गुंडाराज" पुस्तक लिखी थी। उन्हें जेल में अमानवीय यातनाएं देकर जिंदा जला दिया गया था। / Sagarmal Gopa was a freedom fighter from Jaisalmer who wrote the book "Gundaraj in Jaisalmer".',
    teacherInsight: 'जैसलमेर के महारावल जवाहर सिंह के समय की अति क्रूर घटना थी। सागरमल गोपा की कुर्बानी राजस्थान के इतिहास का एक अमिट स्वर्णिम अध्याय है। रट लो इसे!',
    wrongOptionsAnalysis: {
      A: 'जोधपुर रियासत से बालमुकुंद बिस्सा जुड़े थे जो भूख हड़ताल के कारण शहीद हुए।',
      B: 'जैसलमेर सागरमल गोपा का जन्मस्थान तथा कार्यक्षेत्र था।',
      C: 'जयपुर में अर्जुन लाल सेठी जैसे क्रांतिकारी सक्रिय थे।',
      D: 'कोटा से नैनूराम शर्मा और केसरी सिंह बारहठ जुड़े हुए थे।'
    },
    patternYear: 'RPSC Historic'
  },
  {
    category: 'indian_gk',
    question: 'भारतीय संविधान के किस अनुच्छेद के तहत वित्तीय आपातकाल घोषित किया जा सकता है? / Under which Article of the Indian Constitution can Financial Emergency be declared?',
    options: {
      A: 'अनुच्छेद 352 (Article 352)',
      B: 'अनुच्छेद 356 (Article 356)',
      C: 'अनुच्छेद 360 (Article 360)',
      D: 'अनुच्छेद 368 (Article 368)'
    },
    correctAnswer: 'C',
    explanation: 'अनुच्छेद 360 राष्ट्रपति को वित्तीय आपातकाल लगाने की शक्ति देता है। भारत में अब तक एक बार भी वित्तीय आपातकाल नहीं लगा है। / Article 360 empowers the President to declare Financial Emergency. In India, it has never been declared so far.',
    teacherInsight: 'अनुच्छेद 352 राष्ट्रीय आपातकाल, 356 राष्ट्रपति शासन और 360 वित्तीय आपातकाल है। परीक्षा में यह तिकड़ी हमेशा पूछी जाती है!',
    wrongOptionsAnalysis: {
      A: 'अनुच्छेद 352 के तहत राष्ट्रीय आपातकाल युद्ध या बाह्य आक्रमण के आधार पर लगाया जाता है।',
      B: 'अनुच्छेद 356 राज्यों में संवैधानिक तंत्र विफल होने पर राष्ट्रपति शासन लगाने की अनुमति देता है।',
      C: 'अनुच्छेद 360 वित्तीय आपातकाल का एकमात्र संवैधानिक ढांचा है।',
      D: 'अनुच्छेद 368 संविधान संशोधन की प्रक्रिया से संबंधित है, आपातकाल से नहीं।'
    },
    patternYear: 'RPSC Standard'
  },
  {
    category: 'science',
    question: 'मानव शरीर में रक्त का थक्का बनने के लिए कौन सा विटामिन आवश्यक है? / Which vitamin is essential for blood clotting in the human body?',
    options: {
      A: 'विटामिन ए (Vitamin A)',
      B: 'विटामिन सी (Vitamin C)',
      C: 'विटामिन डी (Vitamin D)',
      D: 'विटामिन के (Vitamin K)'
    },
    correctAnswer: 'D',
    explanation: 'विटामिन K यकृत में प्रोथ्रोम्बिन के संश्लेषण के लिए आवश्यक है जो रक्त का थक्का बनाने में मुख्य कारक है। / Vitamin K is essential for prothrombin synthesis in liver which is crucial for blood coagulation.',
    teacherInsight: 'थक्का (Clotting) = विटामिन K। यदि इसकी कमी हो जाए, तो छोटी सी चोट पर भी रक्त बहना नहीं रुकता। इसे अच्छे से नोट बुक में लिख लो!',
    wrongOptionsAnalysis: {
      A: 'विटामिन ए रतौंधी और आंखों की रोशनी से संबंधित है।',
      B: 'विटामिन सी स्कर्वी रोग रोकने और रोग प्रतिरोधक क्षमता बढ़ाने के लिए आवश्यक है।',
      C: 'विटामिन डी हड्डियों की मजबूती और कैल्शियम अवशोषण के काम आता है।',
      D: 'विटामिन के रक्त स्राव को रोकने तथा रक्त का थक्का जमाने के लिए मुख्य पोषक तत्व है।'
    },
    patternYear: 'RPSC Science Core'
  },
  {
    category: 'science',
    question: 'एक प्रकाश वर्ष (Light Year) निम्नलिखित में से किस भौतिक राशि की इकाई है? / A light year is a unit of which of the following physical quantities?',
    options: {
      A: 'समय (Time)',
      B: 'दूरी (Distance)',
      C: 'प्रकाश की तीव्रता (Intensity of Light)',
      D: 'द्रव्यमान (Mass)'
    },
    correctAnswer: 'B',
    explanation: 'प्रकाश वर्ष खगोलीय दूरी की इकाई है, जो प्रकाश द्वारा एक वर्ष में वैक्यूम में तय की गई दूरी के बराबर होती है। / A light-year is a unit of astronomical distance, representing the distance covered by light in a vacuum in one year.',
    teacherInsight: 'प्रश्न में "वर्ष" देखकर छात्र अक्सर "समय" पर टिक कर देते हैं जो कि भारी गलती है! प्रकाश वर्ष हमेशा विशाल दूरियों को मापने की इकाई है। याद रखिएगा!',
    wrongOptionsAnalysis: {
      A: 'समय की इकाई सेकंड, मिनट या वर्ष होती है न कि प्रकाश वर्ष।',
      B: 'दूरी ही इसका सही उत्तर है। खगोल विज्ञान में तारों की दूरी इसी से नापी जाती है।',
      C: 'प्रकाश की तीव्रता की इकाई कंडेला (Candela) होती है।',
      D: 'द्रव्यमान की दूरी या प्रकाश से कोई सीधा संबंध यहाँ स्थापित नहीं होता।'
    },
    patternYear: 'RPSC General Science'
  },
  {
    category: 'hindi',
    question: '"पवन" शब्द का शुद्ध संधि-विच्छेद कौन-सा है? / What is the correct sandhi-vichhed of the word "Pawan"?',
    options: {
      A: 'प + वन (Pa + Wan)',
      B: 'पौ + अन (Pau + An)',
      C: 'पो + अन (Po + An)',
      D: 'पव + अन (Paw + An)'
    },
    correctAnswer: 'C',
    explanation: 'यह अयादि स्वर संधि का उदाहरण है। नियमानुसार ओ + अ = अव बनता है, अतः पो + अन = पवन बनता है। / This is an example of Ayadi Sandhi: O + A = Av. Hence, Po + An = Pawan.',
    teacherInsight: 'यदि "पावन" पूछा जाये तो "पौ + अन" होगा, और "पवन" पूछा जाये तो "पो + अन"। मात्रा का यह अंतर परीक्षा में अंक कटवा देता है, सजग रहें!',
    wrongOptionsAnalysis: {
      A: 'प+वन संधि विच्छेद का कोई तार्किक रूप या नियम नहीं है।',
      B: '"पौ + अन" अयादि संधि के अनुसार "पावन" शब्द का निर्माण करता है।',
      C: '"पो + अन" से "पवन" शब्द का बिल्कुल सही और शुद्ध निर्माण होता है।',
      D: 'पव+अन व्याकरण की दृष्टि से संधि करने योग्य प्रामाणिक पद विच्छेद नहीं है।'
    },
    patternYear: 'RPSC LDC / SI'
  },
  {
    category: 'english',
    question: 'Identify the correct option to fill in the blank: "Neither of the plans ________ accepted by the committee yesterday."',
    options: {
      A: 'was',
      B: 'were',
      C: 'are',
      D: 'have been'
    },
    correctAnswer: 'A',
    explanation: 'Syllabi rule: "Neither of" is followed by a plural noun but takes a singular verb. "Yesterday" signifies past tense, so "was" is correct.',
    teacherInsight: 'Remember children, "Neither of" always singular verb pulls. People see "plans" and mark "were" which is incorrect. Guard your 2 marks!',
    wrongOptionsAnalysis: {
      A: 'was is correct because "Neither of" triggers singular agreement and "yesterday" dictates a past state.',
      B: 'were is incorrect as it refers to a plural verb, failing the singular agreement required by "Neither of".',
      C: 'are is plural and present tense, while we require singular past tense.',
      D: 'have been is plural and present perfect, which violates both temporal indicators and the agreement rule.'
    },
    patternYear: 'RPSC RAS General English'
  },
  {
    category: 'mathematics',
    question: 'यदि किसी वृत्त की त्रिज्या में 10% की वृद्धि की जाती है, तो उसके क्षेत्रफल में कितने प्रतिशत की वृद्धि होगी? / If the radius of a circle is increased by 10%, by what percentage will its area increase?',
    options: {
      A: '10%',
      B: '20%',
      C: '21%',
      D: '25%'
    },
    correctAnswer: 'C',
    explanation: 'क्षेत्रफल त्रिज्या के वर्ग पर निर्भर करता है (A = πr²)। प्रतिशत परिवर्तन = 10 + 10 + (10 * 10)/100 = 21%। / Area depends on square of radius. Effective percentage change = 10 + 10 + 100/100 = 21%.',
    teacherInsight: 'आरपीएससी का अत्यंत प्रिय प्रश्न! ऐसे सूत्र (x + y + xy/100) का उपयोग करके सीधे हल निकाल लिया करो, समय बचेगा!',
    wrongOptionsAnalysis: {
      A: '10% गलत जवाब है। क्षेत्रफल द्वि-आयामी (Two-Dimensional) होता है, अतः वृद्धि कभी भी रैखिक नहीं हो सकती।',
      B: '20% सामान्य जोड़ है लेकिन सह-प्रगामी परिवर्तन (Compound change) भूल जाने की वजह से अक्सर गलत होता है।',
      C: '21% बिल्कुल सही सूत्र आधारित गणना है। (10 + 10 + 1) = 21%.',
      D: '25% अतिमानक गणना है जिसके पीछे कोई गणितीय प्रमाण नहीं बनता।'
    },
    patternYear: 'RPSC Patwar / LDC'
  },
  {
    category: 'reasoning',
    question: 'यदि किसी कूट भाषा में "RPSC" को "SOTB" लिखा जाता है (नियम: एकांतर परिवर्तन +1, -1), तो इस नियम के अनुसार "EXAM" को क्या लिखा जाएगा? / If "RPSC" is written as "SOTB" (using alternating +1, -1 letters), what will "EXAM" be written as under the same rule?',
    options: {
      A: 'FWBL',
      B: 'FWZL',
      C: 'FYBL',
      D: 'FXBL'
    },
    correctAnswer: 'A',
    explanation: 'एकांतर श्रृंखला का नियम: E(+1)=F, X(-1)=W, A(+1)=B, M(-1)=L. अतः "FWBL" सही उत्तर है। / Alternating rule: E(+1)=F, X(-1)=W, A(+1)=B, M(-1)=L. Hence "FWBL" is correct.',
    teacherInsight: 'अल्फाबेट श्रृंखला के ऐसे कोडिंग-डिकोडिंग प्रश्नों में प्रत्येक अक्षर के संख्या पद (Position value) को मन में रट लो। चुटकियों में हल होगा!',
    wrongOptionsAnalysis: {
      A: 'FWBL सही कूट है (E+1=F, X-1=W, A+1=B, M-1=L).',
      B: 'FWZL गलत है क्योंकि A की कोडिंग +1 होकर B बननी चाहिए, न कि -1 होकर Z।',
      C: 'FYBL गलत है क्योंकि X(-1) = W होता है, न कि Y।',
      D: 'FXBL गलत है क्योंकि X की कोडिंग में से 1 घटाना होगा, जिससे W मिलेगा।'
    },
    patternYear: 'RPSC Reasoning Core'
  }
];
