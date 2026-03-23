// DiseaseStages.jsx — Disease Progression Stages
// DTI Project | LeafDoc AI | Unique Feature
// Shows Early / Middle / Late stage descriptions with visual indicators

const DISEASE_STAGES = {
    // ── APPLE ──────────────────────────────────────────────────────────────────
    "Apple___Apple_scab": {
      stages: [
        {
          label: "Early Stage",
          icon: "🟡",
          timeframe: "Week 1-2",
          color: "#fbbf24",
          description: "Olive-green, velvety spots (2-5mm) appear on young leaves and fruit. Spots are pale and fuzzy. Easy to miss without close inspection.",
          action: "Apply Myclobutanil fungicide immediately. Remove affected leaves.",
          urgency: "Act within 48 hours for best results.",
        },
        {
          label: "Middle Stage",
          icon: "🟠",
          timeframe: "Week 3-4",
          color: "#f97316",
          description: "Spots enlarge to 10-15mm, turn dark brown with defined edges. Fruit shows corky scabby lesions. Leaves may begin to curl and yellow.",
          action: "Increase spray frequency to every 7 days. Remove heavily infected leaves.",
          urgency: "Yield loss already beginning. Act urgently.",
        },
        {
          label: "Late Stage",
          icon: "🔴",
          timeframe: "Week 5+",
          color: "#ef4444",
          description: "Large black crusty lesions cover leaves and fruit. Significant defoliation. Fruit is cracked, deformed, and unmarketable. Entire tree may be affected.",
          action: "Remove and destroy all infected material. Apply systemic fungicide. Plan resistant variety for next season.",
          urgency: "Severe yield loss. Focus on preventing spread to other trees.",
        },
      ],
    },
  
    "Apple___Black_rot": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1-2", color: "#fbbf24", description: "Small purple-bordered spots (frogeye) appear on leaves — 3-6mm diameter with tan center. Fruit shows tiny dark specks at calyx end.", action: "Apply Captan fungicide. Remove visibly infected fruit.", urgency: "Act now before fruit infection expands." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 3-5", color: "#f97316", description: "Leaf spots enlarge with concentric rings. Fruit rot expands rapidly — brown to black, firm rot spreading from calyx. Cankers appear on branches.", action: "Remove infected fruit immediately. Apply Thiophanate-methyl. Prune infected branches.", urgency: "Fruit is becoming unmarketable. Act urgently." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 6+", color: "#ef4444", description: "Fruit completely mummified — black and shriveled, still hanging on tree. Limb cankers girdling branches causing dieback. Heavy defoliation.", action: "Remove all mummies. Cut out cankers. Apply copper dormant spray. Plan next season management.", urgency: "Crop loss complete. Prevent spread to other trees and next year's infection." },
      ],
    },
  
    "Apple___Cedar_apple_rust": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1-2", color: "#fbbf24", description: "Bright yellow-orange spots (2-5mm) appear on upper leaf surface in spring. Easy to confuse with normal yellowing.", action: "Apply Myclobutanil immediately. This is the best time to treat.", urgency: "Most responsive to treatment at this stage." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 3-4", color: "#f97316", description: "Spots enlarge to 10mm+. Tube-like spore structures (aecia) emerge from leaf undersides. Leaves become distorted.", action: "Continue fungicide spray every 10-14 days. Remove heavily infected shoots.", urgency: "Spores spreading to nearby cedars. Act to break the cycle." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 5+", color: "#ef4444", description: "Orange lesions on young fruit causing misshaping. Premature leaf drop reducing photosynthesis. Significant fruit quality reduction.", action: "Focus on next season — plant resistant varieties and remove nearby juniper trees.", urgency: "Current season affected. Prepare prevention for next year." },
      ],
    },
  
    // ── CORN ───────────────────────────────────────────────────────────────────
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1-2", color: "#fbbf24", description: "Small rectangular tan spots (2-5mm) on lower leaves, bordered by leaf veins. Spots have water-soaked appearance initially.", action: "Apply Azoxystrobin fungicide. Improve field drainage.", urgency: "Best treatment window. Act before tasseling." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 3-4", color: "#f97316", description: "Lesions expand to 2-5cm, gray-tan in color. Spots merge causing larger dead areas. Disease moves upward to ear leaves.", action: "Apply Propiconazole. Consider harvest timing to minimize losses.", urgency: "Yield impact beginning. Upper leaves critical to protect." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 5+", color: "#ef4444", description: "Entire leaves dying from multiple merging lesions. Premature plant death before grain fill complete. Stalk rot may develop.", action: "Harvest early if possible. Remove and bury crop debris. Plan resistant hybrid for next season.", urgency: "Major yield loss. Prioritize debris management to reduce next year's inoculum." },
      ],
    },
  
    "Corn_(maize)___Common_rust_": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1", color: "#fbbf24", description: "Scattered small cinnamon-brown pustules on both leaf surfaces. Pustules easily rubbed off leaving rust-colored powder on fingers.", action: "Apply Propiconazole fungicide at first pustule appearance. Monitor daily.", urgency: "Highly responsive to fungicide at this stage." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 2-3", color: "#f97316", description: "Pustules multiply rapidly. Yellow halo develops around each pustule. Large areas of both leaf surfaces covered.", action: "Apply systemic fungicide. Scout entire field — check edge rows first.", urgency: "Spreading rapidly in humid conditions. Act urgently." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 4+", color: "#ef4444", description: "Pustules turn dark brown-black as they mature. Leaves dry prematurely. Severe cases cause complete leaf death before grain fill.", action: "Harvest as soon as grain reaches maturity. Plan rust-resistant hybrid for next season.", urgency: "Yield loss significant. Focus on completing grain fill." },
      ],
    },
  
    "Corn_(maize)___Northern_Leaf_Blight": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1-2", color: "#fbbf24", description: "Long (2.5-5cm) cigar-shaped gray-green lesions on lower leaves. Water-soaked dark green border visible on fresh lesions.", action: "Apply Azoxystrobin + Propiconazole at VT/tasseling stage. Do not delay.", urgency: "Critical to treat at or before tasseling for maximum benefit." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 3-4", color: "#f97316", description: "Lesions expand to 5-15cm. Multiple lesions merging on same leaf. Disease moving up to ear leaves. Dark spores visible in humid conditions.", action: "Apply Pyraclostrobin fungicide. Remove severely infected lower leaves if practical.", urgency: "Ear leaf infection severely impacts yield. Act urgently." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 5+", color: "#ef4444", description: "Entire leaves dying. Stalk rot possible due to weakened plant. Premature plant death before grain fill complete. Field may look fire-scorched.", action: "Harvest promptly. Bury or burn crop residue. Plant NLB-resistant hybrid next season.", urgency: "30-50% yield loss possible. Focus on residue management." },
      ],
    },
  
    // ── GRAPE ──────────────────────────────────────────────────────────────────
    "Grape___Black_rot": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1-2", color: "#fbbf24", description: "Tan circular spots (2-5mm) with dark brown borders on leaves. Tiny black pimple-like structures visible in spot centers with hand lens.", action: "Apply Myclobutanil fungicide immediately. Remove infected leaves.", urgency: "Best treatment window before berry infection begins." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 3-4", color: "#f97316", description: "Leaf spots enlarge and multiply. Berries turn light brown then rapidly to dark brown and shrivel. Infected clusters show 30-50% berry loss.", action: "Apply Mancozeb every 7 days. Remove infected clusters immediately.", urgency: "Berry infection is irreversible. Protect remaining healthy clusters." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 5+", color: "#ef4444", description: "Berries completely mummified — black, hard, shriveled. Mummies remain attached spreading disease next season. Cane infections visible.", action: "Remove ALL mummies from vine and ground. Apply copper dormant spray. Plan intensive spray program for next season.", urgency: "Total cluster loss in affected areas. Mummy removal is critical for next year." },
      ],
    },
  
    // ── POTATO ─────────────────────────────────────────────────────────────────
    "Potato___Early_blight": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1-2", color: "#fbbf24", description: "Small dark brown spots (3-5mm) with target-like concentric rings on oldest lower leaves. Yellow halo may be present.", action: "Apply Mancozeb or Chlorothalonil fungicide. Remove infected lower leaves.", urgency: "Act before disease spreads to upper leaves." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 3-4", color: "#f97316", description: "Spots enlarge to 10-15mm. Multiple spots merging causing large dead areas. Disease moving up plant. Stems may show dark lesions.", action: "Increase spray frequency to every 7 days. Hill up plants to protect tubers.", urgency: "Significant defoliation reducing tuber yield. Act urgently." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 5+", color: "#ef4444", description: "Severe defoliation with most leaves dead. Tuber yield significantly reduced. Tubers may show dark sunken lesions if harvested early.", action: "Allow tubers to mature 2 weeks after vine death. Plan 3-year rotation for next season.", urgency: "Yield loss 20-30%. Focus on protecting tubers during harvest." },
      ],
    },
  
    "Potato___Late_blight": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Day 1-3", color: "#fbbf24", description: "Pale green to gray water-soaked spots on leaf edges or tips. Spots appear greasy. White fuzzy growth on underside in humid morning conditions.", action: "Apply Ridomil Gold MZ IMMEDIATELY. This disease spreads in 48-72 hours. Remove infected foliage.", urgency: "⚠️ EMERGENCY — This disease can destroy entire field in 3-5 days." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Day 4-7", color: "#f97316", description: "Spots rapidly expand. Dark brown to black lesions on stems. Entire branches collapsing. White mold visible across large areas in morning.", action: "Continue Ridomil Gold every 5 days. Stop ALL overhead irrigation. Remove and bag infected plants.", urgency: "🚨 CRITICAL — Disease doubling every 24 hours in wet weather." },
        { label: "Late Stage", icon: "🔴", timeframe: "Day 8+", color: "#ef4444", description: "Entire field may collapse rapidly. Tubers show reddish-brown dry rot. Field smells of decay. Complete crop failure possible.", action: "Consider destroying entire crop to prevent soil contamination. Do not harvest diseased tubers — they will rot in storage.", urgency: "🔴 CROP FAILURE — Consult agricultural officer immediately." },
      ],
    },
  
    // ── TOMATO ─────────────────────────────────────────────────────────────────
    "Tomato___Bacterial_spot": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1", color: "#fbbf24", description: "Tiny water-soaked spots (1-3mm) on leaves with yellow halo. Spots appear dark and greasy. First appear on lower/older leaves.", action: "Apply copper hydroxide bactericide immediately. Switch to drip irrigation.", urgency: "Act now — bacteria spread rapidly in rain and wind." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 2-3", color: "#f97316", description: "Spots enlarge and turn brown/black. Raised scabby lesions appear on fruit reducing market value. Leaves yellowing and dropping.", action: "Apply copper + Mancozeb combination spray every 7 days. Remove infected leaves.", urgency: "Fruit quality deteriorating. Protect remaining healthy fruit urgently." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 4+", color: "#ef4444", description: "Severe defoliation exposing fruit to sunscald. Large scabby lesions on most fruit. Unmarketable condition for fresh market.", action: "Consider for processing/cooking rather than fresh market. Plan crop rotation for next season.", urgency: "Market loss significant. Plan next season with resistant varieties." },
      ],
    },
  
    "Tomato___Early_blight": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1-2", color: "#fbbf24", description: "Small dark brown spots (3-5mm) with concentric bullseye rings on oldest lower leaves. Yellow chlorotic zone surrounds each spot.", action: "Remove infected lower leaves. Apply Mancozeb or neem oil spray. Add mulch to prevent soil splash.", urgency: "Best treatment window. Remove leaves before spores spread." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 3-4", color: "#f97316", description: "Disease rapidly moves up plant. Multiple spots merging. Leaves turning yellow then brown and dropping. Dark stem lesions near soil.", action: "Apply systemic fungicide Azoxystrobin every 10 days. Stake plants to improve airflow.", urgency: "Significant defoliation underway. Protect upper leaves urgently." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 5+", color: "#ef4444", description: "Most lower leaves dead and dropped. Only top leaves remaining. Fruit exposed to sunscald. Dark lesions on stems may cause plant collapse.", action: "Apply systemic fungicide. Ensure good nutrition to support remaining foliage. Plan resistant variety next season.", urgency: "30-40% yield loss likely. Focus on fruit protection." },
      ],
    },
  
    "Tomato___Late_blight": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Day 1-2", color: "#fbbf24", description: "Pale grayish-green water-soaked spots on leaves. Spots appear at leaf margins or tips first. Greasy texture when touched.", action: "Apply Ridomil Gold MZ IMMEDIATELY. Remove and bag all infected foliage. Stop overhead irrigation NOW.", urgency: "⚠️ EMERGENCY — Can destroy entire crop in 48-72 hours in cool wet weather." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Day 3-5", color: "#f97316", description: "Rapid expansion to dark brown-black lesions. White fuzzy mold on leaf undersides. Stem lesions causing branch death. Firm dark spots on fruit.", action: "Continue Metalaxyl spray every 5 days. Remove heavily infected plants entirely. Disinfect tools between plants.", urgency: "🚨 CRITICAL — Field-wide infection possible within days." },
        { label: "Late Stage", icon: "🔴", timeframe: "Day 6+", color: "#ef4444", description: "Rapid plant collapse. Black-brown firm rot on fruit. Entire field may show epidemic. Smell of rotting vegetation.", action: "Destroy infected plants. Do not compost. Consult agricultural officer. Plan fungicide rotation for next season.", urgency: "🔴 EPIDEMIC — Immediate action to prevent total crop loss." },
      ],
    },
  
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1-2", color: "#fbbf24", description: "Slight upward cupping of youngest leaves. Mild yellowing at leaf margins. Plant may look slightly stunted. Easy to miss.", action: "Remove and destroy infected plants immediately — no cure exists. Apply insecticide to control whitefly vector.", urgency: "Remove now before whiteflies spread virus to healthy plants." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 3-4", color: "#f97316", description: "Severe upward curling and cupping of all new leaves. Pronounced yellow margins. Plant noticeably stunted with bushy appearance.", action: "Destroy plant. Spray remaining healthy plants with Imidacloprid for whitefly control. Install yellow sticky traps.", urgency: "Plant has no recovery — remove to protect neighbors." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 5+", color: "#ef4444", description: "Complete stunting — plant barely growing. Flowers drop without fruit set. Older leaves may show mosaic pattern. No fruit production.", action: "Remove entire plant. Focus on protecting remaining healthy plants with insect-proof nets and insecticides.", urgency: "Total yield loss from this plant. Prevent spread urgently." },
      ],
    },
  
    "Tomato___Leaf_Mold": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1", color: "#fbbf24", description: "Pale green to yellow spots on upper leaf surface. Olive-green velvety mold just beginning on lower leaf surface.", action: "Improve ventilation immediately. Apply Mancozeb. Reduce humidity by spacing plants wider.", urgency: "Very responsive to treatment at this stage." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 2-3", color: "#f97316", description: "Yellow spots enlarge covering much of leaf. Dense olive-brown mold on leaf underside. Infected leaves curling and wilting.", action: "Apply Difenoconazole fungicide. Remove infected leaves. Increase airflow with pruning.", urgency: "Rapid defoliation possible. Act urgently." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 4+", color: "#ef4444", description: "Severe defoliation. Most leaves infected. Plant very weak. Fruit quality affected by reduced photosynthesis.", action: "Apply systemic fungicide. Maintain nutrition with foliar spray. Plan resistant variety next season.", urgency: "Significant yield loss likely. Focus on protecting fruit." },
      ],
    },
  
    "Tomato___Septoria_leaf_spot": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1-2", color: "#fbbf24", description: "Many small circular spots (3-5mm) with dark border and grey center on lowest leaves. Tiny black specks visible in spot centers.", action: "Remove all infected lower leaves. Apply Mancozeb. Add mulch to prevent soil splash.", urgency: "Remove infected leaves immediately before spores mature." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 3-4", color: "#f97316", description: "Disease rapidly moves up plant. Heavily spotted leaves turning yellow. Significant defoliation of lower half of plant.", action: "Apply Chlorothalonil every 7 days. Stake plants. Avoid wetting foliage when watering.", urgency: "Rapid defoliation reducing yield. Protect upper leaves urgently." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 5+", color: "#ef4444", description: "Most leaves defoliated leaving only top cluster. Fruit exposed to sunscald. Stem lesions may cause plant collapse.", action: "Apply systemic fungicide. Use shade netting to prevent sunscald on exposed fruit. Plan crop rotation.", urgency: "40-50% yield loss possible. Focus on fruit protection." },
      ],
    },
  
    "Tomato___Spider_mites_Two_spotted_spider_mite": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1", color: "#fbbf24", description: "Tiny yellow-white stippling dots on upper leaf surface. Fine webbing barely visible on leaf underside. Check with hand lens.", action: "Spray forceful water jets on leaf undersides. Apply neem oil spray every 3 days.", urgency: "Most responsive to treatment now — population doubles every week." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 2-3", color: "#f97316", description: "Heavy stippling giving leaves bronzed appearance. Dense webbing clearly visible on leaf underside. Leaves starting to turn yellow.", action: "Apply Abamectin miticide on leaf undersides. Avoid broad-spectrum insecticides — they kill natural predators.", urgency: "Population exploding. Chemical treatment now essential." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 4+", color: "#ef4444", description: "Leaves completely bronzed then turning dry and brown. Severe webbing covering entire plant. Rapid defoliation and plant death possible.", action: "Apply Spiromesifen miticide. Rotate chemicals to prevent resistance. Remove most affected leaves.", urgency: "Plant survival threatened. Aggressive treatment essential." },
      ],
    },
  
    "Tomato___Target_Spot": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1-2", color: "#fbbf24", description: "Small brown spots (3-5mm) with concentric rings on lower leaves. Spots may have yellow halo.", action: "Apply Mancozeb + Carbendazim combination spray. Remove infected leaves.", urgency: "Act early for best results." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 3-4", color: "#f97316", description: "Spots enlarge and merge causing large dead areas. Stem lesions darkening. Disease spreading to fruit.", action: "Apply Tebuconazole systemic fungicide every 10 days.", urgency: "Stem and fruit infection significantly reduces yield." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 5+", color: "#ef4444", description: "Large dead areas on most leaves. Fruit spots causing post-harvest rot. Severe defoliation.", action: "Plan resistant variety and better drainage for next season.", urgency: "Significant losses. Focus on fruit harvest timing." },
      ],
    },
  
    "Tomato___Tomato_mosaic_virus": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1-2", color: "#fbbf24", description: "Faint mosaic pattern of light and dark green on youngest leaves. Slight distortion of new growth.", action: "Remove and destroy infected plants immediately — no cure. Disinfect all tools with 10% bleach.", urgency: "Remove now before mechanical spread to healthy plants." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 3-4", color: "#f97316", description: "Pronounced mosaic and leaf distortion. Fern-like narrow leaves. Stunted plant growth. Fruit shows yellow spots.", action: "Destroy plant. Wash hands thoroughly before touching other plants. Control aphids with insecticide.", urgency: "No recovery — remove to protect neighboring plants." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 5+", color: "#ef4444", description: "Severely stunted plant with distorted fruit. Internal brown discoloration of fruit. Near-total yield loss.", action: "Remove plant. Deep clean greenhouse or field tools. Plant ToMV-resistant varieties next season.", urgency: "Total yield loss. Focus on prevention for next crop." },
      ],
    },
  
    "Squash___Powdery_mildew": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1", color: "#fbbf24", description: "Small white powdery spots (10-20mm) on upper surface of older leaves. Spots look like flour dusted on leaf surface.", action: "Apply potassium bicarbonate or neem oil spray immediately. Remove most affected leaves.", urgency: "Highly responsive to treatment at this stage." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 2-3", color: "#f97316", description: "White powder covers most of leaf surface. Leaves starting to yellow and curl. Powdery coating now on both leaf surfaces.", action: "Apply Myclobutanil fungicide. Remove heavily infected leaves. Improve plant spacing.", urgency: "Rapid spread — spores airborne. Act immediately." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 4+", color: "#ef4444", description: "Entire leaves covered in white powder then turning brown and dying. Stems infected. Plant severely weakened. Fruit production stops.", action: "Remove infected plants or severely prune. Apply sulfur fungicide on remaining healthy growth.", urgency: "Plant near end of productive life. Protect remaining healthy plants." },
      ],
    },
  
    "Strawberry___Leaf_scorch": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1-2", color: "#fbbf24", description: "Small purple to red spots (2-5mm) on upper leaf surface of older leaves. Spots have indefinite margins.", action: "Remove infected leaves. Apply Captan fungicide. Switch to drip irrigation.", urgency: "Remove infected leaves before spores mature." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 3-4", color: "#f97316", description: "Spots enlarge. Centers turn gray-brown while margins remain purple-red. Leaf margins appear scorched. Multiple spots merging.", action: "Apply Myclobutanil systemic fungicide every 10 days. Remove most infected leaves.", urgency: "Significant defoliation weakening plant before fruiting." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 5+", color: "#ef4444", description: "Most leaves severely scorched and dying. Plant very weak. Poor fruit production and quality. Runners also infected.", action: "Renovate bed after fruiting — mow and thin. Plan resistant variety next season.", urgency: "Plant productivity severely reduced." },
      ],
    },
  
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1-2", color: "#fbbf24", description: "Dark brown irregular spots on older leaves with yellow halo. Spots appear first on basal leaves near ground.", action: "Apply copper hydroxide spray. Remove infected leaves. Improve canopy airflow.", urgency: "Act before defoliation begins." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 3-4", color: "#f97316", description: "Spots multiply and enlarge. Severe yellowing with defoliation starting from older leaves upward. Vine weakening.", action: "Apply Mancozeb + Carbendazim spray every 7 days.", urgency: "Defoliation impacts fruit sugar content and next year's bud set." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 5+", color: "#ef4444", description: "Severe defoliation — most leaves dropped. Fruit quality and sugar levels reduced. Vine very weak affecting next year's crop.", action: "Apply foliar nutrition to support remaining leaves. Plan intensive spray program starting next March.", urgency: "This and next season both impacted." },
      ],
    },
  
    "Orange___Haunglongbing_(Citrus_greening)": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Month 1-3", color: "#fbbf24", description: "Asymmetric yellow blotching (blotchy mottle) on one or two branches. Fruit on affected branches may be small and lopsided.", action: "Remove and destroy the entire tree — no cure exists. Control psyllid insect vector aggressively on all remaining trees.", urgency: "⚠️ Remove immediately to prevent spread. This disease is fatal to the tree." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Month 4-12", color: "#f97316", description: "Multiple branches showing blotchy mottle. Fruit small, lopsided, green at bottom. Twig dieback beginning. Tree producing less fruit.", action: "Tree must be destroyed. Continue intensive psyllid control on all neighboring trees.", urgency: "Disease spread to neighboring trees happening now via psyllid insects." },
        { label: "Late Stage", icon: "🔴", timeframe: "Year 2+", color: "#ef4444", description: "Entire tree affected. Fruit bitter and worthless. Extensive branch dieback. Tree will die within 3-5 years.", action: "Remove and destroy entire tree including roots. Replace with certified disease-free nursery stock. Maintain psyllid control program.", urgency: "🔴 Complete loss — report to local horticulture department." },
      ],
    },
  
    "Peach___Bacterial_spot": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1-2", color: "#fbbf24", description: "Small water-soaked angular spots on leaves. Spots turn brown with yellow halo. First appears on young leaves after rain.", action: "Apply copper hydroxide bactericide immediately. Avoid all overhead irrigation.", urgency: "Act before shot-hole symptoms develop." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 3-4", color: "#f97316", description: "Spots fall out leaving shot-hole appearance. Sunken dark spots on fruit reducing market value. Twig cankers with gummy ooze.", action: "Apply copper + Mancozeb combination. Remove infected twigs. Avoid nitrogen overfertilization.", urgency: "Fruit quality significantly impacted. Protect remaining healthy fruit." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 5+", color: "#ef4444", description: "Severe defoliation. Most fruit with scabby lesions — unmarketable fresh. Twig cankers causing branch death.", action: "Apply copper dormant spray in autumn. Plan resistant variety for new plantings.", urgency: "Market loss significant. Focus on orchard sanitation." },
      ],
    },
  
    "Pepper__bell___Bacterial_spot": {
      stages: [
        { label: "Early Stage", icon: "🟡", timeframe: "Week 1", color: "#fbbf24", description: "Small water-soaked spots (2-3mm) on leaves with yellow halo. Spots appear after rain or irrigation.", action: "Apply copper oxychloride bactericide immediately. Switch to drip irrigation.", urgency: "Most responsive to treatment now." },
        { label: "Middle Stage", icon: "🟠", timeframe: "Week 2-3", color: "#f97316", description: "Spots enlarge and turn brown-black. Raised scabby lesions on fruit. Premature leaf drop reducing photosynthesis.", action: "Apply copper + Streptomycin combination spray every 7 days. Remove infected leaves and fruit.", urgency: "Fruit quality rapidly deteriorating. Act urgently." },
        { label: "Late Stage", icon: "🔴", timeframe: "Week 4+", color: "#ef4444", description: "Severe defoliation. Most fruit with scabby lesions. Plant very weak. Market value significantly reduced.", action: "Plan crop rotation and copper seed treatment for next season.", urgency: "Market loss severe. Remove infected crop debris thoroughly." },
      ],
    },
  };
  
  // Default stages for diseases not in database or healthy plants
  const HEALTHY_STAGES = {
    stages: [
      { label: "Currently Healthy", icon: "✅", timeframe: "Now", color: "#4ade80", description: "No disease signs detected. Your plant looks good!", action: "Continue current management practices.", urgency: "Monitor weekly for any early signs." },
      { label: "Watch For", icon: "👁️", timeframe: "Next 2-4 weeks", color: "#fbbf24", description: "Early disease signs: unusual spots, color changes, wilting, or abnormal growth.", action: "Scout plant twice a week, especially after rain.", urgency: "Early detection gives you the best treatment options." },
      { label: "Prevention", icon: "🛡️", timeframe: "Ongoing", color: "#6ee7b7", description: "Preventive care keeps your plant healthy all season long.", action: "Maintain proper spacing, irrigation, and fertilization. Apply preventive organic spray monthly.", urgency: "Prevention is always better and cheaper than treatment." },
    ],
  };
  
  const DEFAULT_STAGES = {
    stages: [
      { label: "Early Stage", icon: "🟡", timeframe: "Week 1-2", color: "#fbbf24", description: "Initial infection — limited spots or lesions on older leaves. Plant still mostly healthy.", action: "Apply appropriate fungicide or bactericide immediately. Remove infected plant parts.", urgency: "Best treatment window. Act within 48 hours." },
      { label: "Middle Stage", icon: "🟠", timeframe: "Week 3-4", color: "#f97316", description: "Disease spreading to more leaves. Visible yield impact beginning. Plant showing stress.", action: "Increase spray frequency. Remove severely infected leaves. Improve plant spacing for airflow.", urgency: "Yield loss beginning. Act urgently to limit spread." },
      { label: "Late Stage", icon: "🔴", timeframe: "Week 5+", color: "#ef4444", description: "Severe infection — widespread plant damage. Significant yield reduction.", action: "Focus on preventing spread to other plants. Plan resistant variety for next season.", urgency: "Major losses likely. Consult agricultural expert." },
    ],
  };
  
  export default function DiseaseStages({ diseaseClassId, lang }) {
    const isHealthy = diseaseClassId?.toLowerCase().includes("healthy");
    const stageData = isHealthy
      ? HEALTHY_STAGES
      : (DISEASE_STAGES[diseaseClassId] || DEFAULT_STAGES);
  
    return (
      <div style={D.card}>
        {/* Header */}
        <div style={D.header}>
          <span style={{ fontSize: 18 }}>📸</span>
          <span style={D.headerTitle}>
            {lang === "hi" ? "रोग प्रगति चरण" : "Disease Progression Stages"}
          </span>
          <span style={D.badge}>
            {lang === "hi" ? "3 चरण" : "3 Stages"}
          </span>
        </div>
  
        <p style={D.subtitle}>
          {lang === "hi"
            ? "पहचानें कि आपका पौधा किस चरण में है और तुरंत क्या करें।"
            : "Identify which stage your plant is at and what to do immediately."}
        </p>
  
        {/* Stage cards */}
        <div style={D.stagesGrid}>
          {stageData.stages.map((stage, idx) => (
            <div
              key={idx}
              style={{
                ...D.stageCard,
                borderColor: stage.color,
                background: `${stage.color}14`,
              }}
            >
              {/* Stage header */}
              <div style={D.stageHeader}>
                <span style={{ fontSize: 20 }}>{stage.icon}</span>
                <div>
                  <div style={{ ...D.stageLabel, color: stage.color }}>{stage.label}</div>
                  <div style={D.stageTime}>{stage.timeframe}</div>
                </div>
              </div>
  
              {/* Description */}
              <p style={D.stageDesc}>{stage.description}</p>
  
              {/* Action */}
              <div style={{ ...D.actionBox, borderColor: `${stage.color}44`, background: `${stage.color}10` }}>
                <div style={{ ...D.actionTitle, color: stage.color }}>
                  {lang === "hi" ? "✅ अभी करें:" : "✅ Do Now:"}
                </div>
                <div style={D.actionText}>{stage.action}</div>
              </div>
  
              {/* Urgency */}
              <div style={D.urgencyText}>⏰ {stage.urgency}</div>
            </div>
          ))}
        </div>
  
        {/* Help note */}
        <div style={D.note}>
          💡 {lang === "hi"
            ? "यदि आप चरण पहचानने में असमर्थ हैं तो नजदीकी कृषि विभाग से संपर्क करें।"
            : "If unsure which stage your plant is at, consult your nearest Krishi Vigyan Kendra (KVK)."}
        </div>
      </div>
    );
  }
  
  const D = {
    card: { background: "rgba(10,40,18,0.6)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 18, padding: "20px", backdropFilter: "blur(16px)" },
    header: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
    headerTitle: { fontFamily: "'Clash Display',sans-serif", fontSize: 15, fontWeight: 700, color: "#bbf7d0", flex: 1 },
    badge: { background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 },
    subtitle: { fontSize: 12, color: "#6ee7b7", marginBottom: 14, lineHeight: 1.5 },
    stagesGrid: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 },
    stageCard: { border: "1px solid", borderRadius: 14, padding: "14px" },
    stageHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
    stageLabel: { fontSize: 13, fontWeight: 800, fontFamily: "'Clash Display',sans-serif" },
    stageTime: { fontSize: 10, color: "#6ee7b7", fontWeight: 500, marginTop: 1 },
    stageDesc: { fontSize: 12, color: "#a7f3d0", lineHeight: 1.65, marginBottom: 10 },
    actionBox: { border: "1px solid", borderRadius: 8, padding: "8px 10px", marginBottom: 8 },
    actionTitle: { fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 },
    actionText: { fontSize: 11, color: "#d1fae5", lineHeight: 1.6 },
    urgencyText: { fontSize: 10, color: "#6ee7b7", fontStyle: "italic" },
    note: { background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 10, padding: "10px 12px", fontSize: 11, color: "#4b7a57", lineHeight: 1.6 },
  };