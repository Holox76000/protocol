# Protocol Questionnaire — 32 Questions Specification

## Overview

- **Total questions**: 32
- **Photos**: 4 uploads (separate from the 32 questions, handled in Section 4)
- **Sections**: 7
- **Estimated time**: 12–16 minutes
- **Required questions**: marked with ⚠️ — blocking if unanswered before proceeding

## Section Distribution

| Section | Questions | Count |
|---------|-----------|-------|
| 1 — Identity & Objective | Q1–Q3 | 3 |
| 2 — Social & Facial Context | Q4–Q8 | 5 |
| 3 — Basic Biometrics | Q9–Q12 | 4 |
| 4 — Photos | 4 uploads | — |
| 5 — Training | Q13–Q18 | 6 |
| 6 — Nutrition | Q19–Q24 | 6 |
| 7 — Health & History | Q25–Q32 | 8 |

---

## Section 1 — Identity & Objective

> Title: "Let's start with you."
> Subtitle: "These answers shape the direction of your entire Protocol."

---

### Q1 — First name

- **Label**: "What's your first name?"
- **Sublabel**: "Used to personalize your Protocol report."
- **Type**: text input
- **Placeholder**: "Thomas"
- **Pre-filled**: from registration (`users.first_name`)
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.first_name`
- **Validation**: min 1 char, max 50 chars, no numbers

---

### Q2 — Primary goal

- **Label**: "What's your primary goal with this Protocol?"
- **Sublabel**: "Pick the one that matters most right now."
- **Type**: single select — card UI (large clickable tiles, not dropdown)
- **Options**:
  | Value | Label | Sublabel |
  |-------|-------|----------|
  | `sharpen_proportions` | Sharpen my proportions | Optimize my shoulder-to-waist ratio and silhouette |
  | `build_muscle` | Build lean muscle | Increase mass in the right places |
  | `reshape` | Reshape my body | Significant change in overall physique |
  | `improve_posture` | Improve my posture and presence | Carry myself differently |
  | `full_transformation` | Full transformation | All of the above |
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.goal`

---

### Q3 — Motivation

- **Label**: "What's driving this for you right now?"
- **Sublabel**: "Be honest — this helps us prioritize what matters in your Protocol."
- **Type**: single select — card UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `relationship` | Dating and relationships — I want to be more attractive to partners |
  | `confidence` | Self-confidence — I want to feel better about how I look |
  | `professional` | Professional presence — how I'm perceived at work matters |
  | `performance` | Athletic performance — I want to look and perform like an athlete |
  | `health` | Health and longevity — I want a body that lasts |
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.motivation`

---

## Section 2 — Social & Facial Context

> Title: "Your social context."
> Subtitle: "Attractiveness is perceived differently depending on your world. These answers help us calibrate."

---

### Q4 — Age

- **Label**: "How old are you?"
- **Type**: number input
- **Placeholder**: "28"
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.age`
- **Validation**: integer, min 16, max 80
- **Red flag**: age < 18 or age > 70 → trigger admin alert at submission

---

### Q5 — Professional environment

- **Label**: "What's your professional environment?"
- **Sublabel**: "Your context affects which aspects of your appearance have the most leverage."
- **Type**: single select — card UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `corporate` | Corporate / Finance / Law — appearance signals authority |
  | `creative` | Creative / Media / Design — style and aesthetics matter |
  | `public_facing` | Public-facing / Sales / Service — first impressions are everything |
  | `physical_trades` | Physical trades / Construction — physique is the baseline |
  | `entrepreneur` | Entrepreneur / Startup — adaptable, presence varies by context |
  | `student` | Student / Early career |
  | `other` | Other |
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.professional_environment`

---

### Q6 — Facial structure (self-assessment)

- **Label**: "How would you describe your facial bone structure?"
- **Sublabel**: "Don't overthink it — your best honest read."
- **Type**: single select — card UI
- **Options**:
  | Value | Label | Description |
  |-------|-------|-------------|
  | `soft` | Soft / Round | Fuller face, less visible bone structure |
  | `average` | Average / Neutral | Balanced — nothing particularly stands out |
  | `angular` | Angular / Defined | Visible jawline, cheekbones, sharp features |
  | `mature` | Mature / Strong | Heavy bone structure, dominant features |
  | `unsure` | I'm honestly not sure | — |
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.facial_structure_self`

---

### Q7 — Social perception

- **Label**: "How do people typically perceive you? Select up to 3."
- **Sublabel**: "Think about first impressions — how strangers or new acquaintances see you."
- **Type**: multi-select (up to 3) — tag UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `approachable` | Approachable / Friendly |
  | `intimidating` | Intimidating / Intense |
  | `forgettable` | Forgettable / Invisible |
  | `trustworthy` | Trustworthy / Reliable |
  | `attractive` | Physically attractive |
  | `average_looking` | Average-looking |
  | `professional` | Professional / Put-together |
  | `awkward` | Awkward / Unsure of himself |
  | `young_for_age` | Young for my age |
  | `unsure` | I genuinely don't know |
- **Required**: ⚠️ yes (min 1, max 3)
- **DB field**: `protocol_responses.social_perception` (JSONB array of strings)

---

### Q8 — Typical clothing style

- **Label**: "What's your typical day-to-day clothing style?"
- **Sublabel**: "Not your aspirational style — what you actually wear most days."
- **Type**: single select — card UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `formal` | Formal — suits, dress shirts, ties |
  | `smart_casual` | Smart casual — chinos, button-downs, clean sneakers |
  | `casual` | Casual — jeans, t-shirts, hoodies |
  | `athletic` | Athletic — gym clothes, track pants, trainers |
  | `workwear` | Workwear — boots, functional clothing |
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.typical_clothing`

---

## Section 3 — Basic Biometrics

> Title: "Your measurements."
> Subtitle: "These numbers are the foundation of your proportion analysis. Measure before filling this in if you can."

---

### Q9 — Height

- **Label**: "What's your height?"
- **Type**: number input with unit toggle (cm / ft+in)
- **Placeholder (cm)**: "180"
- **Placeholder (ft)**: "5" + "11"
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.height_cm` (always stored in cm)
- **Validation**: 130 cm – 230 cm
- **UI note**: show unit selector (cm / imperial). Convert to cm before storing.

---

### Q10 — Current weight

- **Label**: "What's your current weight?"
- **Type**: number input with unit toggle (kg / lbs)
- **Placeholder**: "78"
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.weight_kg` (always stored in kg)
- **Validation**: 40 kg – 200 kg
- **Red flag at submission**: BMI < 17 or > 35 (calculated from height + weight) → trigger admin alert

---

### Q11 — Weight trend (6 months)

- **Label**: "How has your weight changed over the last 6 months?"
- **Type**: single select — card UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `stable` | Stable — within 2 kg |
  | `slight_gain` | Slight gain — 2–5 kg up |
  | `significant_gain` | Significant gain — more than 5 kg up |
  | `slight_loss` | Slight loss — 2–5 kg down |
  | `significant_loss` | Significant loss — more than 5 kg down |
  | `yoyo` | Up and down — inconsistent |
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.weight_trend_6mo`

---

### Q12 — Waist circumference

- **Label**: "What's your waist circumference?"
- **Sublabel**: "Measure around your navel with a tape measure. Standing relaxed, not sucking in."
- **Type**: number input with unit toggle (cm / inches)
- **Placeholder**: "85"
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.waist_circumference_cm` (always stored in cm)
- **Validation**: 50 cm – 160 cm
- **Helper**: show a small diagram of where to measure (inline image or SVG illustration)

---

## Section 4 — Photos

> Title: "Your photos."
> Subtitle: "4 photos. This is the most important part of the assessment."

**MANDATORY INSTRUCTION SCREEN** (shown before uploads, must read + check):

```
BEFORE YOU START: Photo Protocol

For your analysis to be accurate, photos MUST be taken under these exact conditions:

✓ Morning, empty stomach (before eating or drinking)
✓ Wearing ONLY fitted underwear or short boxer briefs
✓ Neutral lighting — overhead light, no direct sunlight, no flash
✓ Plain background — white or light wall
✓ Phone at chest height, horizontal distance ~2 meters
✓ Standing relaxed — arms slightly away from body
✓ Look straight ahead, don't flex, don't suck in

You'll take 4 photos:
  1. Front facing (face visible)
  2. Side profile (left side)
  3. Back
  4. Close-up of face

Your photos are encrypted and stored privately. They are never shared
and will be deleted after 12 weeks unless you opt to keep them for
progress tracking.

[ ] I've read the instructions and I'm ready to upload my photos
```

The checkbox is required to unlock the upload UI.

---

### Photo 1 — Front facing

- **Label**: "Front facing"
- **Sublabel**: "Full body, face visible, looking straight ahead."
- **Type**: photo upload
- **DB field**: `protocol_responses.photo_front_url`
- **Required**: ⚠️ yes
- **Accepted formats**: jpg, jpeg, png, heic
- **Max size**: 10 MB
- **HEIC**: convert to JPEG client-side before upload
- **Storage path**: `user-photos/{user_id}/front-{uuid}.jpg`

---

### Photo 2 — Side profile

- **Label**: "Side profile (left side)"
- **Sublabel**: "Full body, left side facing camera, arms relaxed."
- **Type**: photo upload
- **DB field**: `protocol_responses.photo_side_url`
- **Required**: ⚠️ yes
- **Same constraints as Photo 1**
- **Storage path**: `user-photos/{user_id}/side-{uuid}.jpg`

---

### Photo 3 — Back

- **Label**: "Back"
- **Sublabel**: "Full body, back to camera, arms relaxed."
- **Type**: photo upload
- **DB field**: `protocol_responses.photo_back_url`
- **Required**: ⚠️ yes
- **Same constraints as Photo 1**
- **Storage path**: `user-photos/{user_id}/back-{uuid}.jpg`

---

### Photo 4 — Face close-up

- **Label**: "Face close-up"
- **Sublabel**: "From shoulders up. Neutral expression, looking directly at the camera."
- **Type**: photo upload
- **DB field**: `protocol_responses.photo_face_url`
- **Required**: ⚠️ yes
- **Same constraints as Photo 1**
- **Storage path**: `user-photos/{user_id}/face-{uuid}.jpg`

---

### Photo confirmation checkbox

- **Label**: "I confirm these photos follow the protocol instructions above."
- **Type**: checkbox
- **DB field**: `protocol_responses.photos_taken_correctly`
- **Required**: ⚠️ yes (must be checked to submit section 4)

---

## Section 5 — Training

> Title: "Your training."
> Subtitle: "Your current reality, not your ideal. Be honest."

---

### Q13 — Training experience level

- **Label**: "What's your current training experience level?"
- **Type**: single select — card UI
- **Options**:
  | Value | Label | Description |
  |-------|-------|-------------|
  | `beginner` | Beginner | Less than 6 months of consistent training |
  | `novice` | Novice | 6 months to 1.5 years |
  | `intermediate` | Intermediate | 1.5 to 4 years |
  | `experienced` | Experienced | 4 to 8 years |
  | `advanced` | Advanced | 8+ years, trained seriously |
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.training_experience`

---

### Q14 — Sessions per week

- **Label**: "How many training sessions do you do per week?"
- **Sublabel**: "Your current average, not your goal."
- **Type**: number stepper (tap +/–) or slider
- **Range**: 0–14
- **Display**: "X sessions / week"
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.sessions_per_week`
- **Validation**: integer, 0–14

---

### Q15 — Session duration

- **Label**: "How long is a typical training session?"
- **Type**: single select — card UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `30` | Under 30 minutes |
  | `45` | 30–45 minutes |
  | `60` | 45–60 minutes |
  | `75` | 60–75 minutes |
  | `90` | 75–90 minutes |
  | `120` | 90 minutes or more |
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.session_duration_minutes` (store as integer)

---

### Q16 — Training location

- **Label**: "Where do you train?"
- **Type**: single select — card UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `commercial_gym` | Commercial gym — full equipment |
  | `home_gym` | Home gym — some equipment |
  | `bodyweight` | Bodyweight only — no equipment |
  | `outdoor` | Outdoor — parks, tracks |
  | `mixed` | Mixed — varies by week |
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.training_location`

---

### Q17 — Preferred activities

- **Label**: "What training activities do you currently do or prefer? Select all that apply."
- **Type**: multi-select — tag UI (no max)
- **Options**:
  | Value | Label |
  |-------|-------|
  | `strength_training` | Strength training (barbell, dumbbell) |
  | `calisthenics` | Calisthenics / Bodyweight |
  | `hiit` | HIIT / Circuit training |
  | `running` | Running / Jogging |
  | `cycling` | Cycling |
  | `swimming` | Swimming |
  | `martial_arts` | Martial arts / Combat sports |
  | `team_sports` | Team sports |
  | `yoga_pilates` | Yoga / Pilates |
  | `none` | None — I'm starting from scratch |
- **Required**: ⚠️ yes (min 1)
- **DB field**: `protocol_responses.preferred_activities` (JSONB array)

---

### Q18 — Daily activity level

- **Label**: "How active are you on a typical non-training day?"
- **Type**: single select — card UI
- **Options**:
  | Value | Label | Description |
  |-------|-------|-------------|
  | `sedentary` | Sedentary | Desk job, mostly sitting, minimal walking |
  | `lightly_active` | Lightly active | Some walking, mostly seated work |
  | `moderately_active` | Moderately active | On my feet regularly, some manual activity |
  | `very_active` | Very active | Physical job, lots of movement |
  | `extremely_active` | Extremely active | Manual labor or very high daily movement |
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.daily_activity_level`

---

## Section 6 — Nutrition

> Title: "Your nutrition."
> Subtitle: "No judgment. What you actually eat, not what you think you should eat."

---

### Q19 — Dietary profile

- **Label**: "How would you describe your current diet?"
- **Type**: single select — card UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `omnivore` | Omnivore — I eat everything |
  | `flexitarian` | Flexitarian — mostly plants, occasional meat |
  | `vegetarian` | Vegetarian — no meat, fish ok |
  | `vegan` | Vegan — no animal products |
  | `keto` | Ketogenic / Low-carb |
  | `paleo` | Paleo |
  | `intermittent_fasting` | Intermittent fasting |
  | `other` | Other |
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.dietary_profile`
- **Conditional**: if `other` → show text input below ("Please describe your diet briefly") → stored in `protocol_responses.other_diet_specified`

---

### Q20 — Food allergies / intolerances

- **Label**: "Do you have any food allergies or intolerances?"
- **Sublabel**: "Select all that apply, or 'None'."
- **Type**: multi-select — tag UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `none` | None |
  | `gluten` | Gluten / Wheat |
  | `dairy` | Dairy / Lactose |
  | `nuts` | Tree nuts |
  | `peanuts` | Peanuts |
  | `eggs` | Eggs |
  | `soy` | Soy |
  | `shellfish` | Shellfish |
  | `fish` | Fish |
  | `other` | Other |
- **Required**: ⚠️ yes (min 1 — select 'None' if no allergies)
- **DB field**: `protocol_responses.food_allergies` (JSONB array)

---

### Q21 — Eating habits

- **Label**: "Which of these describe your current eating habits? Select up to 3."
- **Type**: multi-select (up to 3) — tag UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `consistent` | Consistent — I eat at the same times every day |
  | `irregular` | Irregular — I skip meals or eat at random times |
  | `social_eating` | Social eating — most meals are social |
  | `meal_prep` | I meal prep in advance |
  | `fast_food` | I eat fast food or takeout regularly |
  | `emotional_eating` | I eat when stressed or emotional |
  | `low_appetite` | Low appetite — I struggle to eat enough |
  | `high_appetite` | High appetite — I struggle not to overeat |
  | `calorie_tracking` | I track calories or macros |
- **Required**: ⚠️ yes (min 1, max 3)
- **DB field**: `protocol_responses.eating_habits` (JSONB array)

---

### Q22 — Meals per day

- **Label**: "How many meals or eating sessions do you have per day on average?"
- **Sublabel**: "Count snacks as 0.5 if they're small."
- **Type**: number stepper (tap +/–) or single select
- **Options**: 1, 2, 3, 4, 5, 6+
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.meals_per_day` (integer)

---

### Q23 — Meal prep availability

- **Label**: "How much time can you realistically spend on food prep per week?"
- **Type**: single select — card UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `none` | None — I need quick, grab-and-go options |
  | `minimal` | Minimal — 30 minutes or less |
  | `moderate` | Moderate — 1 to 2 hours on weekends |
  | `high` | High — I enjoy cooking, 3+ hours available |
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.meal_prep_availability`

---

### Q24 — Supplement use

- **Label**: "Which supplements do you currently take? Select all that apply."
- **Type**: multi-select — tag UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `none` | None |
  | `protein_powder` | Protein powder (whey, plant-based) |
  | `creatine` | Creatine |
  | `pre_workout` | Pre-workout |
  | `multivitamin` | Multivitamin |
  | `omega3` | Omega-3 / Fish oil |
  | `vitamin_d` | Vitamin D |
  | `bcaa` | BCAAs / EAAs |
  | `fat_burner` | Fat burner / Thermogenic |
  | `other` | Other |
- **Required**: ⚠️ yes (min 1 — select 'None' if no supplements)
- **DB field**: `protocol_responses.supplement_use` (JSONB array)

---

## Section 7 — Health & History

> Title: "Your health."
> Subtitle: "This section helps us build a Protocol that's safe and realistic for your body."

---

### Q25 — Injuries

- **Label**: "Do you have any current or past injuries that affect your training?"
- **Sublabel**: "Select all that apply."
- **Type**: multi-select — tag UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `none` | None |
  | `shoulder` | Shoulder (rotator cuff, AC joint) |
  | `lower_back` | Lower back |
  | `knee` | Knee (ACL, meniscus, patellar) |
  | `hip` | Hip |
  | `elbow` | Elbow (tendonitis, tennis/golfer's) |
  | `wrist` | Wrist or hand |
  | `ankle` | Ankle or foot |
  | `neck` | Neck or cervical spine |
  | `other` | Other |
- **Required**: ⚠️ yes (min 1 — select 'None' if no injuries)
- **DB field**: `protocol_responses.injuries` (JSONB array)
- **Conditional**: if any injury selected (other than 'none') → show text input "Describe briefly (optional)" → stored in `protocol_responses.injuries_other`
- **Red flag**: multiple major injuries + age > 55 → trigger admin alert

---

### Q26 — Medical conditions

- **Label**: "Do you have any medical conditions relevant to physical training?"
- **Sublabel**: "This is confidential. Only your Protocol coach sees this."
- **Type**: multi-select — tag UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `none` | None |
  | `cardiovascular` | Cardiovascular condition (heart disease, hypertension) |
  | `diabetes` | Diabetes (Type 1 or 2) |
  | `asthma` | Asthma or respiratory condition |
  | `joint_disease` | Joint disease (arthritis, etc.) |
  | `hormonal` | Hormonal condition (thyroid, etc.) |
  | `neurological` | Neurological condition |
  | `disordered_eating` | History of disordered eating |
  | `mental_health_eating` | Mental health condition affecting relationship with food |
  | `other` | Other |
- **Required**: ⚠️ yes (min 1 — select 'None' if none)
- **DB field**: `protocol_responses.medical_conditions` (JSONB array)
- **Conditional**: if any selected → show text input "Describe briefly (optional)" → stored in `protocol_responses.medical_conditions_other`
- **Red flag**: `disordered_eating` or `mental_health_eating` selected → trigger admin alert before submission

---

### Q27 — Current medications

- **Label**: "Are you currently taking any medications that could affect your training or physique?"
- **Type**: multi-select — tag UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `none` | None |
  | `corticosteroids` | Corticosteroids |
  | `beta_blockers` | Beta blockers |
  | `ssri_snri` | Antidepressants (SSRI / SNRI) |
  | `hormones` | Hormone therapy (TRT, HRT, etc.) |
  | `blood_pressure` | Blood pressure medication |
  | `blood_thinners` | Blood thinners |
  | `other` | Other |
- **Required**: ⚠️ yes (min 1 — select 'None' if none)
- **DB field**: `protocol_responses.medications` (JSONB array)
- **Conditional**: if any selected → show text input (optional) → stored in `protocol_responses.medications_other`

---

### Q28 — Sleep

- **Label**: "How many hours of sleep do you get on average per night?"
- **Type**: number stepper or single select
- **Options**: "Less than 5", "5–6", "6–7", "7–8", "8–9", "More than 9"
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.sleep_hours`

---

### Q29 — Stress level

- **Label**: "How would you rate your current stress level?"
- **Type**: 5-point scale (tap to select)
- **Scale labels**:
  - 1 = Very low — relaxed and balanced
  - 2 = Low — mostly calm
  - 3 = Moderate — manageable but present
  - 4 = High — regularly stressed
  - 5 = Very high — chronically stressed
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.stress_level` (integer 1–5)

---

### Q30 — Training consistency (past 12 months)

- **Label**: "How consistent have you been with training over the past 12 months?"
- **Type**: single select — card UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `very_consistent` | Very consistent — trained regularly throughout |
  | `mostly_consistent` | Mostly consistent — a few gaps but generally on track |
  | `inconsistent` | Inconsistent — started and stopped multiple times |
  | `barely_trained` | Barely trained — mostly inactive |
  | `not_trained` | Haven't trained at all |
- **Required**: ⚠️ yes
- **DB field**: `protocol_responses.training_consistency`

---

### Q31 — Areas of concern

- **Label**: "Which areas of your body are you most self-conscious about or want to improve most?"
- **Sublabel**: "Select up to 3. This helps us prioritize your Protocol."
- **Type**: multi-select (up to 3) — tag UI
- **Options**:
  | Value | Label |
  |-------|-------|
  | `shoulders` | Shoulders — too narrow or not wide enough |
  | `chest` | Chest — underdeveloped or shape |
  | `arms` | Arms — too thin or lacking definition |
  | `waist` | Waist — too wide or lacking definition |
  | `back` | Back — weak or lacks V-taper |
  | `legs` | Legs — unbalanced or underdeveloped |
  | `posture` | Posture — rounded or collapsed |
  | `neck` | Neck — too thin relative to head |
  | `overall_skinniness` | Overall skinniness — I look too thin |
  | `overall_softness` | Overall softness — I look too soft |
- **Required**: ⚠️ yes (min 1, max 3)
- **DB field**: `protocol_responses.concern_areas` (JSONB array)

---

### Q32 — Notes for coach

- **Label**: "Anything else your coach should know before building your Protocol?"
- **Sublabel**: "Optional. Past attempts, specific constraints, context that doesn't fit above."
- **Type**: textarea
- **Placeholder**: "e.g. I had a bad experience with X, I travel frequently, I'm recovering from..."
- **Required**: no (optional)
- **DB field**: `protocol_responses.coach_notes` (TEXT)
- **Max length**: 1000 chars

---

## Additional DB Fields Required

The following fields are needed beyond the original schema draft:

```sql
-- Add to protocol_responses:
motivation TEXT,
supplement_use JSONB,
sleep_hours TEXT,
stress_level INTEGER,
training_consistency TEXT,
concern_areas JSONB,
coach_notes TEXT
```

Full updated schema at implementation time.

---

## Red Flags — Admin Alert Triggers

Detected at submission (`POST /api/questionnaire/submit`). Admin is notified via email BEFORE marking as submitted.

| Condition | Field(s) | Action |
|-----------|----------|--------|
| Age < 18 | `age` | Block + admin alert |
| Age > 70 | `age` | Admin alert, allow submission |
| BMI < 17 | `height_cm` + `weight_kg` | Admin alert |
| BMI > 35 | `height_cm` + `weight_kg` | Admin alert |
| Disordered eating history | `medical_conditions` contains `disordered_eating` | Admin alert |
| Mental health affecting eating | `medical_conditions` contains `mental_health_eating` | Admin alert |
| Multiple injuries + age > 55 | `injuries` has 2+ non-'none' values AND `age > 55` | Admin alert |

---

## Validation Summary

| # | Question | Required | Type | Special |
|---|----------|----------|------|---------|
| Q1 | First name | ⚠️ | text | Pre-filled |
| Q2 | Primary goal | ⚠️ | single select | — |
| Q3 | Motivation | ⚠️ | single select | — |
| Q4 | Age | ⚠️ | number | Red flag < 18 or > 70 |
| Q5 | Professional environment | ⚠️ | single select | — |
| Q6 | Facial structure | ⚠️ | single select | — |
| Q7 | Social perception | ⚠️ | multi-select (max 3) | min 1 |
| Q8 | Clothing style | ⚠️ | single select | — |
| Q9 | Height | ⚠️ | number | Unit conversion |
| Q10 | Weight | ⚠️ | number | BMI red flag |
| Q11 | Weight trend | ⚠️ | single select | — |
| Q12 | Waist | ⚠️ | number | Unit conversion |
| — | 4 photos | ⚠️ | upload | HEIC → JPG, 10MB max |
| Q13 | Training experience | ⚠️ | single select | — |
| Q14 | Sessions/week | ⚠️ | number | 0–14 |
| Q15 | Session duration | ⚠️ | single select | — |
| Q16 | Training location | ⚠️ | single select | — |
| Q17 | Preferred activities | ⚠️ | multi-select | min 1 |
| Q18 | Daily activity level | ⚠️ | single select | — |
| Q19 | Dietary profile | ⚠️ | single select | Conditional text |
| Q20 | Allergies | ⚠️ | multi-select | min 1 |
| Q21 | Eating habits | ⚠️ | multi-select (max 3) | min 1 |
| Q22 | Meals/day | ⚠️ | number | — |
| Q23 | Meal prep | ⚠️ | single select | — |
| Q24 | Supplements | ⚠️ | multi-select | min 1 |
| Q25 | Injuries | ⚠️ | multi-select | Conditional text, red flag |
| Q26 | Medical conditions | ⚠️ | multi-select | Conditional text, red flag |
| Q27 | Medications | ⚠️ | multi-select | Conditional text |
| Q28 | Sleep | ⚠️ | select | — |
| Q29 | Stress level | ⚠️ | scale 1–5 | — |
| Q30 | Training consistency | ⚠️ | single select | — |
| Q31 | Areas of concern | ⚠️ | multi-select (max 3) | min 1 |
| Q32 | Coach notes | optional | textarea | 1000 chars max |
