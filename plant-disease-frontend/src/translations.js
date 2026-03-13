/**
 * translations.js — LeafDoc AI
 * DTI Project | Hindi Language Support
 * 
 * Complete English ↔ Hindi translations for all UI text.
 * Place in: src/translations.js
 */

export const TRANSLATIONS = {
    en: {
      // Header
      tagline: "Plant Disease Detection",
      accuracy_badge: "EfficientNet-B3 · 99%+ Accuracy",
      history: "History",
      outbreak_map: "Outbreak Map",
      offline_mode: "Offline Mode",
  
      // Home screen
      home_title: "LeafDoc AI",
      home_subtitle: "Upload a leaf photo for instant AI-powered disease diagnosis",
      drag_drop: "Drag & drop a leaf photo here",
      or_text: "or",
      browse_files: "Browse Files",
      supports: "Supports JPG, PNG · Max 10MB",
      detect_btn: "🔬 Detect Disease",
      detecting: "Analyzing...",
      remove_image: "Remove",
      supported_crops: "Supported Crops",
      scan_history: "Scan History",
      clear_all: "Clear all",
      just_now: "just now",
      ago: "ago",
  
      // Result screen
      new_scan: "← New Scan",
      primary_diagnosis: "Primary Diagnosis",
      confidence: "Confidence",
      high_confidence: "High confidence — reliable diagnosis",
      medium_confidence: "Medium confidence — consider retesting",
      low_confidence: "Low confidence — please consult an expert",
      other_possibilities: "Other Possibilities",
      about_disease: "About This Disease",
      symptoms: "Symptoms",
      causes: "Causes",
      treatment_options: "Treatment Options",
      organic: "Organic",
      chemical: "Chemical",
      prevention: "Prevention",
      scan_another: "📷 Scan Another Leaf",
      disease_detected: "Disease Detected",
      healthy_plant: "Healthy Plant",
      offline_badge: "Offline Mode · On-device AI",
  
      // Severity
      healthy: "Healthy",
      low_risk: "Low Risk",
      medium_risk: "Medium Risk",
      high_risk: "High Risk",
      unknown: "Unknown",
  
      // Weather widget
      env_risk_title: "Environmental Risk Analysis",
      innovation2: "Innovation #2",
      env_risk_desc: "Check if today's weather conditions increase disease spread risk in your area.",
      city_placeholder: "Enter your city (e.g. Delhi, Pune...)",
      check_btn: "Check",
      use_location: "📍 Use My Location",
      temperature: "Temp",
      humidity: "Humidity",
      rainfall: "Rainfall",
      wind: "Wind",
      change_location: "📍 Change Location",
      low_risk_label: "Low Risk",
      moderate_risk: "Moderate Risk",
      high_risk_label: "High Risk",
      critical_risk: "Critical Risk",
      contributing_factors: "Contributing factors:",
      action: "Action",
  
      // Offline mode
      offline_title: "Offline Mode",
      offline_sub: "On-device AI · No internet required",
      model_ready: "Offline model ready! Upload a leaf image to diagnose.",
      diagnose_offline: "🔬 Diagnose Offline",
      download_model: "⬇️ Download Model (~25MB)",
      offline_accuracy: "Offline accuracy ~92–95% vs 99%+ online. For critical decisions, verify online when available.",
      model_runs: "Model runs in your browser",
      no_data_leaves: "No data leaves device",
      inference_time: "~2s inference time",
      disease_classes: "38 disease classes",
  
      // Outbreak map
      outbreak_title: "Disease Outbreak Map",
      outbreak_sub: "India · Real-time community reports · Innovation #3",
      total_reports: "Total Reports",
      states_affected: "States Affected",
      most_reported: "🔥 Most Reported Nationally",
      states_by_level: "📍 States by Outbreak Level",
  
      // Disclaimer
      disclaimer_text: "This is an AI-based preliminary diagnosis. For high-value crops, please consult a certified agricultural expert.",
    },
  
    hi: {
      // Header
      tagline: "पौधा रोग पहचान",
      accuracy_badge: "EfficientNet-B3 · 99%+ सटीकता",
      history: "इतिहास",
      outbreak_map: "प्रकोप मानचित्र",
      offline_mode: "ऑफलाइन मोड",
  
      // Home screen
      home_title: "लीफडॉक AI",
      home_subtitle: "तत्काल AI-आधारित रोग निदान के लिए पत्ती की फोटो अपलोड करें",
      drag_drop: "यहाँ पत्ती की फोटो खींचें और छोड़ें",
      or_text: "या",
      browse_files: "फ़ाइल चुनें",
      supports: "JPG, PNG समर्थित · अधिकतम 10MB",
      detect_btn: "🔬 रोग पहचानें",
      detecting: "विश्लेषण हो रहा है...",
      remove_image: "हटाएं",
      supported_crops: "समर्थित फसलें",
      scan_history: "स्कैन इतिहास",
      clear_all: "सब हटाएं",
      just_now: "अभी",
      ago: "पहले",
  
      // Result screen
      new_scan: "← नया स्कैन",
      primary_diagnosis: "प्राथमिक निदान",
      confidence: "विश्वास स्तर",
      high_confidence: "उच्च विश्वास — विश्वसनीय निदान",
      medium_confidence: "मध्यम विश्वास — पुनः परीक्षण पर विचार करें",
      low_confidence: "कम विश्वास — कृपया किसी विशेषज्ञ से मिलें",
      other_possibilities: "अन्य संभावनाएं",
      about_disease: "इस रोग के बारे में",
      symptoms: "लक्षण",
      causes: "कारण",
      treatment_options: "उपचार विकल्प",
      organic: "जैविक",
      chemical: "रासायनिक",
      prevention: "रोकथाम",
      scan_another: "📷 दूसरी पत्ती स्कैन करें",
      disease_detected: "रोग पाया गया",
      healthy_plant: "स्वस्थ पौधा",
      offline_badge: "ऑफलाइन मोड · डिवाइस पर AI",
  
      // Severity
      healthy: "स्वस्थ",
      low_risk: "कम जोखिम",
      medium_risk: "मध्यम जोखिम",
      high_risk: "उच्च जोखिम",
      unknown: "अज्ञात",
  
      // Weather widget
      env_risk_title: "पर्यावरणीय जोखिम विश्लेषण",
      innovation2: "नवाचार #2",
      env_risk_desc: "जांचें कि आज का मौसम आपके क्षेत्र में रोग फैलने का जोखिम बढ़ाता है या नहीं।",
      city_placeholder: "अपना शहर दर्ज करें (जैसे दिल्ली, पुणे...)",
      check_btn: "जांचें",
      use_location: "📍 मेरी लोकेशन उपयोग करें",
      temperature: "तापमान",
      humidity: "नमी",
      rainfall: "वर्षा",
      wind: "हवा",
      change_location: "📍 स्थान बदलें",
      low_risk_label: "कम जोखिम",
      moderate_risk: "मध्यम जोखिम",
      high_risk_label: "उच्च जोखिम",
      critical_risk: "गंभीर जोखिम",
      contributing_factors: "योगदान करने वाले कारक:",
      action: "कार्रवाई",
  
      // Offline mode
      offline_title: "ऑफलाइन मोड",
      offline_sub: "डिवाइस पर AI · इंटरनेट की जरूरत नहीं",
      model_ready: "ऑफलाइन मॉडल तैयार है! निदान के लिए पत्ती की तस्वीर अपलोड करें।",
      diagnose_offline: "🔬 ऑफलाइन निदान करें",
      download_model: "⬇️ मॉडल डाउनलोड करें (~25MB)",
      offline_accuracy: "ऑफलाइन सटीकता ~92–95% बनाम 99%+ ऑनलाइन। महत्वपूर्ण निर्णयों के लिए उपलब्ध होने पर ऑनलाइन सत्यापित करें।",
      model_runs: "मॉडल आपके ब्राउज़र में चलता है",
      no_data_leaves: "कोई डेटा डिवाइस नहीं छोड़ता",
      inference_time: "~2 सेकंड परिणाम समय",
      disease_classes: "38 रोग श्रेणियां",
  
      // Outbreak map
      outbreak_title: "रोग प्रकोप मानचित्र",
      outbreak_sub: "भारत · वास्तविक समय सामुदायिक रिपोर्ट · नवाचार #3",
      total_reports: "कुल रिपोर्ट",
      states_affected: "प्रभावित राज्य",
      most_reported: "🔥 राष्ट्रीय स्तर पर सबसे अधिक रिपोर्ट",
      states_by_level: "📍 प्रकोप स्तर के अनुसार राज्य",
  
      // Disclaimer
      disclaimer_text: "यह AI-आधारित प्रारंभिक निदान है। उच्च मूल्य की फसलों के लिए कृपया किसी प्रमाणित कृषि विशेषज्ञ से परामर्श लें।",
    }
  };
  
  export const CROP_NAMES = {
    en: {
      "🍎": "Apple", "🫐": "Blueberry", "🍒": "Cherry", "🌽": "Corn",
      "🍇": "Grape", "🍊": "Orange", "🍑": "Peach", "🫑": "Pepper",
      "🥔": "Potato", "🎃": "Pumpkin", "🍓": "Raspberry", "🌱": "Soybean",
      "🍈": "Squash", "🍓": "Strawberry", "🍅": "Tomato",
    },
    hi: {
      "🍎": "सेब", "🫐": "ब्लूबेरी", "🍒": "चेरी", "🌽": "मक्का",
      "🍇": "अंगूर", "🍊": "संतरा", "🍑": "आड़ू", "🫑": "शिमला मिर्च",
      "🥔": "आलू", "🎃": "कद्दू", "🍓": "रास्पबेरी", "🌱": "सोयाबीन",
      "🍈": "स्क्वैश", "🍓": "स्ट्रॉबेरी", "🍅": "टमाटर",
    }
  };
  
  // Disease name translations (display names)
  export const DISEASE_NAME_TRANSLATIONS = {
    "Tomato — Late blight":          { hi: "टमाटर — पछेती झुलसा" },
    "Tomato — Early blight":         { hi: "टमाटर — अगेती झुलसा" },
    "Tomato — Bacterial spot":       { hi: "टमाटर — जीवाणु धब्बा" },
    "Tomato — Leaf Mold":            { hi: "टमाटर — पत्ती फफूंद" },
    "Tomato — Septoria leaf spot":   { hi: "टमाटर — सेप्टोरिया पत्ती धब्बा" },
    "Tomato — Spider mites":         { hi: "टमाटर — मकड़ी के कण" },
    "Tomato — Target Spot":          { hi: "टमाटर — लक्ष्य धब्बा" },
    "Tomato — Yellow Leaf Curl Virus": { hi: "टमाटर — पीली पत्ती मुड़ने का वायरस" },
    "Tomato — mosaic virus":         { hi: "टमाटर — मोज़ेक वायरस" },
    "Tomato — healthy":              { hi: "टमाटर — स्वस्थ" },
    "Potato — Late blight":          { hi: "आलू — पछेती झुलसा" },
    "Potato — Early blight":         { hi: "आलू — अगेती झुलसा" },
    "Potato — healthy":              { hi: "आलू — स्वस्थ" },
    "Pepper bell — Bacterial spot":  { hi: "शिमला मिर्च — जीवाणु धब्बा" },
    "Pepper bell — healthy":         { hi: "शिमला मिर्च — स्वस्थ" },
    "Apple — Apple scab":            { hi: "सेब — पपड़ी रोग" },
    "Apple — Black rot":             { hi: "सेब — काला सड़न" },
    "Apple — Cedar apple rust":      { hi: "सेब — देवदार सेब जंग" },
    "Apple — healthy":               { hi: "सेब — स्वस्थ" },
    "Corn — Cercospora leaf spot":   { hi: "मक्का — सर्कोस्पोरा पत्ती धब्बा" },
    "Corn — Common rust":            { hi: "मक्का — सामान्य जंग" },
    "Corn — Northern Leaf Blight":   { hi: "मक्का — उत्तरी पत्ती झुलसा" },
    "Corn — healthy":                { hi: "मक्का — स्वस्थ" },
    "Grape — Black rot":             { hi: "अंगूर — काला सड़न" },
    "Grape — Esca":                  { hi: "अंगूर — एस्का रोग" },
    "Grape — Leaf blight":           { hi: "अंगूर — पत्ती झुलसा" },
    "Grape — healthy":               { hi: "अंगूर — स्वस्थ" },
    "Peach — Bacterial spot":        { hi: "आड़ू — जीवाणु धब्बा" },
    "Peach — healthy":               { hi: "आड़ू — स्वस्थ" },
    "Strawberry — Leaf scorch":      { hi: "स्ट्रॉबेरी — पत्ती झुलसा" },
    "Strawberry — healthy":          { hi: "स्ट्रॉबेरी — स्वस्थ" },
    "Cherry — Powdery mildew":       { hi: "चेरी — चूर्णिल फफूंदी" },
    "Cherry — healthy":              { hi: "चेरी — स्वस्थ" },
    "Squash — Powdery mildew":       { hi: "स्क्वैश — चूर्णिल फफूंदी" },
    "Soybean — healthy":             { hi: "सोयाबीन — स्वस्थ" },
    "Blueberry — healthy":           { hi: "ब्लूबेरी — स्वस्थ" },
    "Raspberry — healthy":           { hi: "रास्पबेरी — स्वस्थ" },
    "Orange — Haunglongbing":        { hi: "संतरा — हुआनलोंगबिंग रोग" },
  };