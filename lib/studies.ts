/**
 * Scientific reference base — injected into every AI generation prompt.
 * Sources: peer-reviewed journals in evolutionary psychology, human biology,
 * body composition, and physical attractiveness research.
 */

export const SCIENTIFIC_REFERENCE_BASE = `
## Scientific Reference Base

The following peer-reviewed studies are the empirical foundation of this protocol.
Cite relevant studies by [Author, Year] when making specific claims or giving ratios/ranges.
Do not fabricate citations — only use studies listed here.

### Male Physical Attractiveness — Body Shape & Proportions

[Lavrakas, 1975] Female preferences for male physiques. Journal of Research in Personality, 9:324-334.
Key finding: Women rated male bodies with developed upper bodies and medium-sized lower bodies as most attractive, establishing early evidence for sex-specific physical preferences in body shape.

[Maisey et al., 1999] Characteristics of male attractiveness for women. The Lancet, 353(9163).
Key finding: Waist-to-chest ratio (WCR) was the strongest predictor of male bodily attractiveness to women, outperforming BMI and WHR as a predictor of rated appeal.

[Hughes & Gallup, 2003] Sex differences in morphological predictors of sexual behavior: Shoulder to hip and waist to hip ratios. Evolution and Human Behavior, 24:173-178.
Key finding: Men with higher shoulder-to-hip ratios (SHR) reported earlier sexual debut, more sexual partners, and more extra-pair copulations. SHR predicted sexual behavior history more strongly than WHR, confirming the inverted-triangle torso as a functional signal of male quality.

[Sell, Lukaszewski & Townsley, 2017] Cues of upper body strength account for most of the variance in men's bodily attractiveness. Proceedings of the Royal Society B, 284:20171819.
Key finding: Perceived upper body strength accounted for ~70% of variance in men's attractiveness ratings, dominating over height and weight. Developed chest and shoulders were the primary drivers of male bodily attractiveness across multiple study designs.

[Lassek & Gaulin, 2009] Costs and benefits of fat-free muscle mass in men. Evolution and Human Behavior, 30(5):322-328.
Key finding: Men's fat-free muscle mass (FFMM) positively predicted number of sexual partners, indicating muscularity is a fitness-relevant cue that directly influences mating success.

[Frederick & Haselton, 2007] Why is muscularity sexy? Tests of the fitness indicator hypothesis. Personality and Social Psychology Bulletin, 33(8):1167-1183.
Key finding: Women preferred moderately muscular men for short-term relationships and slightly less muscular men for long-term relationships, consistent with muscularity signaling genetic quality. Extreme muscularity was not preferred.

[Dixson, Halliwell, East, Wignarajah & Anderson, 2003] Masculine somatotype and hirsutism as determinants of sexual attractiveness to women. Archives of Sexual Behavior, 32(1):29-39.
Key finding: Women rated male bodies with moderate muscularity, moderate body hair, and V-shaped torso as most attractive. Extreme muscularity was not preferred, indicating optimum-seeking preferences for male build.

[Fan, Dai, Liu & Wu, 2005] Visual perception of male body attractiveness. Proceedings of the Royal Society B, 272(1560):219-226.
Key finding: Male body attractiveness was best predicted by a volumetric model integrating chest, waist, and hip circumferences. Waist-to-chest ratio predicted attractiveness better than height or weight alone.

[Tovée, Reinhardt, Emery & Cornelissen, 1998] Optimal BMI and perceptions of male attractiveness. Proceedings of the Royal Society B.
Key finding: Attractiveness for male bodies peaks at low-to-moderate BMI with visible muscle definition; attractiveness declined sharply at both underweight/frail and overweight ranges.

### Body Fat & Composition

[Tovée & Cornelissen, 1999] Visual cues to female physical attractiveness. Proceedings of the Royal Society B, 266:211-218.
Key finding: BMI was a stronger predictor of female attractiveness than WHR, with optimal attractiveness near BMI 20-21, challenging WHR-primacy models.

[Crossley, Cornelissen & Tovée, 2012] What is an attractive body? Using an interactive 3D program to create the ideal body. PLOS ONE, 7(11):e50601.
Key finding: Men preferred female bodies with lower BMI than women preferred for themselves. The divergence was greatest at higher BMIs, suggesting men are more sensitive to overweight cues than women's self-assessment.

[Tovée, Mason, Emery, McClusky & Cohen-Tovée, 1997] Supermodels: Stick insects or hourglasses? The Lancet, 350(9089):1474-1475.
Key finding: Supermodels' BMIs were significantly below the range identified as most attractive in normal population studies, confirming fashion industry standards diverge from evolved attractiveness preferences.

[Singh & Singh, 2011] Shape and significance of feminine beauty: An evolutionary perspective. Sex Roles, 64(9-10):723-731.
Key finding: WHR and BMI jointly predict female attractiveness. Cross-cultural data support WHR as a primary fertility cue while BMI serves as a secondary signal of current nutritional condition.

### Posture, Dominance & Perceived Stature

[Carney, Cuddy & Yap, 2010] Power posing: Brief nonverbal displays affect neuroendocrine levels and risk tolerance. Psychological Science, 21(10):1363-1368.
Key finding: Holding expansive, high-power postures for 2 minutes increased testosterone and decreased cortisol, and increased risk tolerance. Postural feedback shapes hormonal and behavioral dominance expression.

[Sell, Tooby & Cosmides, 2009] Formidability and the logic of human anger. PNAS, 106(35):15073-15078.
Key finding: Physically stronger men (measured by grip strength and arm circumference) felt more entitled to favorable treatment, had lower thresholds for anger, and achieved better outcomes from confrontations, linking physical formidability to social leverage.

[Harmon-Jones & Peterson, 2009] Supine body position reduces neural response to anger provocation. Psychological Science, 20(10):1209-1210.
Key finding: Physical posture directly modulates emotional processing at the neural level. Collapsed/supine postures reduce approach motivation; upright postures maintain approach-oriented emotional states.

[Sell, Cosmides, Tooby, Krauss, von Rueden & Gurven, 2009] Human adaptations for the visual assessment of strength and fighting ability. Proceedings of the Royal Society B, 276:575-584.
Key finding: Observers accurately estimated men's physical strength from faces, bodies, and arm photographs alone — even from unfamiliar targets — suggesting evolved perceptual mechanisms for formidability assessment.

### Height & Social Dominance

[Stulp, Buunk, Verhulst & Pollet, 2015] Human height is positively related to interpersonal dominance. PLOS ONE, 10(2):e0117860.
Key finding: Taller men were rated as more dominant in face-to-face interactions and displayed more actual dominance behaviors, supporting height as a reliable social status signal.

[Judge & Cable, 2004] The effect of physical height on workplace success and income. Journal of Applied Psychology, 89(3):428-441.
Key finding: Taller individuals earned significantly higher salaries and were rated as more effective leaders across multiple occupational samples. Height predicted career success via perceived authority.

[Blaker, Rompa, Dessing, Vriend, Herschberg & van Vugt, 2013] The height leadership advantage in men and women. Group Processes & Intergroup Relations, 16(1):17-27.
Key finding: Taller individuals were more likely to emerge as leaders and were rated as more dominant and effective, with the effect consistent across both sexes but stronger for men.

[Pawlowski, Dunbar & Lipowicz, 2000] Tall men have more reproductive success. Nature, 403:156.
Key finding: Taller men had more children and were less likely to remain childless in a Polish population sample, providing direct evidence linking height to male reproductive success.

[Stulp, Buunk & Pollet, 2013] Women want taller men more than men want shorter women. Personality and Individual Differences, 54(8):877-883.
Key finding: Women's stated preferences for male height were stronger and more consistent than men's preferences for shorter female partners, with women preferring men ~8 inches taller than themselves.

[Nettle, 2002] Height and reproductive success in a cohort of British men. Human Nature, 13(4):473-491.
Key finding: Taller British men had higher reproductive success. Height effects on mating outcomes, while present, were modest and population-specific.

[Stulp, Buunk & Pollet, 2015] Does natural selection favour taller stature among the tallest people on earth? Proceedings of the Royal Society B.
Key finding: Among contemporary Dutch men and women, taller height was associated with higher lifetime reproductive success, providing evidence of ongoing natural selection on adult stature.

[Stulp, Buunk, Pollet & Verhulst, 2012] High and mighty: Height increases authority in professional refereeing. Evolutionary Psychology, 10(3):588-601.
Key finding: Taller football referees were perceived as more authoritative and made more confident decisions. Height functions as a dominance signal in competitive professional contexts.

[Rudolph, Wells, Weller & Baltes, 2009] A meta-analysis of weight-based bias in the workplace. Journal of Vocational Behavior, 74(1):1-10.
Key finding: Overweight and obese employees faced significant discrimination in hiring, performance evaluations, and promotions. Weight stigma is a meaningful occupational barrier, larger for women than men.

### Facial Attractiveness & Overall Appearance

[Feingold, 1992] Good-looking people are not what we think. Psychological Bulletin, 111(2):304-341.
Key finding: Meta-analysis showing attractiveness was only weakly associated with social skills and personality traits overall, but strongly associated with social confidence. The "what is beautiful is good" stereotype is largely unfounded except for social boldness.

[Little, Jones & DeBruine, 2011] Facial attractiveness: Evolutionary based research. Philosophical Transactions of the Royal Society B, 366:1638-1659.
Key finding: Facial attractiveness reflects multiple fitness cues including symmetry, averageness, sexual dimorphism, and skin condition. These preferences show cross-cultural consistency pointing to evolved mechanisms.

[Rhodes, 2006] The evolutionary psychology of facial beauty. Annual Review of Psychology, 57:199-226.
Key finding: Facial attractiveness cues — averageness, symmetry, sexual dimorphism — reflect genetic quality, developmental health, and hormonal condition. These preferences are at least partly evolved.

[Langlois, Kalakanis, Rubenstein, Larson, Hallam & Smoot, 2000] Maxims or myths of beauty? Psychological Bulletin, 126(3):390-423.
Key finding: Meta-analysis of 900+ studies: attractiveness effects on social outcomes are large and consistent. Attractive people are treated better and have better social outcomes. Effects cannot be attributed solely to cultural transmission.

[Perrett et al., 1998] Effects of sexual dimorphism on facial attractiveness. Nature, 394:884-887.
Key finding: Facial attractiveness was enhanced by increasing femininity in female faces. Preferences for masculinity in male faces were context-dependent, with some cultures preferring more feminized male faces.

### Mate Preferences & Evolutionary Foundations

[Singh, 1993] Adaptive significance of female physical attractiveness: Role of waist-to-hip ratio. Journal of Personality and Social Psychology, 65(2):293-307.
Key finding: WHR of ~0.7 was rated most attractive across female body silhouettes. WHR was proposed as a reliable cue to female health, fertility, and reproductive value, independent of overall body weight.

[Singh & Young, 1995] Body weight, waist-to-hip ratio, breasts, and hips in female attractiveness. Ethology and Sociobiology, 16(6):483-507.
Key finding: WHR and breast size independently predicted female attractiveness. Low WHR (0.7) was preferred across all body weight categories.

[Buss, 1989] Sex differences in human mate preferences: Evolutionary hypotheses tested in 37 cultures. Behavioral and Brain Sciences, 12(1):1-49.
Key finding: Across 37 cultures, men prioritized physical attractiveness and youth in mates while women prioritized resource acquisition potential, confirming sex-differentiated evolved mate preferences.

[Gangestad & Simpson, 2000] The evolution of human mating: Trade-offs and strategic pluralism. Behavioral and Brain Sciences, 23(4):573-644.
Key finding: Humans evolved a dual-strategy mating system. Individuals flexibly pursue committed partnerships or short-term pairings based on environmental conditions and individual characteristics.

[Li & Kenrick, 2006] Sex similarities and differences in preferences for short-term mates. Journal of Personality and Social Psychology, 90(3):468-489.
Key finding: Men prioritized physical attractiveness in short-term mating more than women did. Women showed selectivity for genetic quality signals even in short-term contexts.

[Kenrick & Keefe, 1992] Age preferences in mates reflect sex differences in reproductive strategies. Behavioral and Brain Sciences, 15(1):75-133.
Key finding: Men's mate age preferences remained stable across adulthood (consistently preferring younger women) while women's preferred age gap decreased as they aged, consistent with evolved reproductive value assessment.

[Singh & Randall, 2007] Beauty is in the eye of the plastic surgeon: WHR and women's attractiveness. Personality and Individual Differences, 43:329-340.
Key finding: Plastic surgeons' aesthetic judgments of female body attractiveness were strongly predicted by WHR, confirming WHR preferences are robust even among professionals trained to evaluate bodies analytically.

### Ovulatory Cycle & Hormonal Modulation of Preferences

[Gangestad, Garver-Apgar, Simpson & Cousins, 2007] Changes in women's mate preferences across the ovulatory cycle. Journal of Personality and Social Psychology, 92(1):151-163.
Key finding: Women showed stronger preferences for markers of genetic quality (symmetry, dominance, masculinity) near ovulation, supporting the dual mating strategy hypothesis.

[Gangestad & Thornhill, 2008] Human oestrus. Proceedings of the Royal Society B, 275:991-1000.
Key finding: Meta-analysis confirmed ovulatory cycle shifts in women's behavior and preferences — near ovulation, preferences for symmetry, muscularity, and masculinity cues increased robustly.

[Little, Jones & DeBruine, 2008] Preferences for variation in masculinity in real male faces change across the menstrual cycle. Personality and Individual Differences, 45(5):478-482.
Key finding: Women's preferences for facial masculinity were higher during the fertile phase than the luteal phase of the menstrual cycle, consistent with ovulatory quality-seeking.

[Gangestad, Simpson, Cousins, Garver-Apgar & Christensen, 2004] Women's preferences for male behavioral displays change across the menstrual cycle. Psychological Science, 15(3):203-207.
Key finding: Near ovulation, women showed stronger preference for men displaying social presence, direct competition, and physical confidence. In luteal phase, preferences shifted toward kindness and investment.

### Symmetry & Developmental Health

[Thornhill & Gangestad, 1994] Human fluctuating asymmetry and sexual behavior. Psychological Science, 5(5):297-302.
Key finding: Men with lower fluctuating asymmetry (more symmetric bodies) had more sexual partners and earlier sexual debut, linking physical symmetry to human mating success.

[Jones et al., 2001] Facial symmetry and judgments of apparent health. Evolution and Human Behavior, 22(6):417-429.
Key finding: Facial symmetry was positively associated with health ratings and attractiveness, supporting the hypothesis that symmetry signals developmental stability and genetic quality.

### Cross-Cultural & Ecological Modulation

[Tovée, Swami, Furnham & Mangalparsad, 2006] Changing perceptions of attractiveness as observers are exposed to a different culture. Evolution and Human Behavior, 27(6):443-456.
Key finding: South African observers preferred heavier female bodies than British observers. After British observers were exposed to South African culture, their preferences shifted toward higher BMI, demonstrating cultural modulation of attractiveness norms.

[Singh, Dixson, Jessop, Morgan & Dixson, 2010] Cross-cultural consensus for waist-hip ratio and women's attractiveness. Evolution and Human Behavior, 31(3):176-181.
Key finding: Across cultures including Papua New Guinea and Cameroon, men consistently preferred female WHR near 0.7, validating WHR as a near-universal attractiveness cue independent of Western media influence.

[Swami & Tovée, 2005] Resource security impacts men's female body size preferences. PLOS ONE.
Key finding: Men experiencing resource insecurity preferred heavier female body sizes than resource-secure men, supporting the hypothesis that body weight preferences are calibrated to environmental food availability cues.

[Sorokowski & Pawlowski, 2008] Attractiveness of leg length: Report from 27 nations. Evolution and Human Behavior, 29(5):351-360.
Key finding: Across 27 countries, longer-than-average legs were rated as more attractive in both sexes, but the preference was stronger and more consistent for male targets.

### Social Status, Height & Professional Success

[von Rueden, Gurven & Kaplan, 2008] Multiple dimensions of male social status in an Amazonian society. Evolution and Human Behavior, 29(6):402-415.
Key finding: Among Tsimane forager-horticulturalists, male social status was multi-dimensional: physical formidability, coalition support, and resource provision each contributed. Physical strength was most relevant for younger men.

[Buunk, Stulp & Pollet, 2012] Height predicts jealousy differently for men and women. Evolution and Human Behavior, 29(2):133-139.
Key finding: Taller men reported less jealousy over rival physical dominance, while height did not protect women against jealousy over rival attractiveness, suggesting height serves different intrasexual functions by sex.

[Wass, Waldenstrom, Rossner & Hellberg, 1997] Android body fat distribution impairs IVF pregnancy rates. Human Reproduction, 12(9):2057-2060.
Key finding: Women with android (central/abdominal) fat distribution had significantly lower IVF pregnancy rates than women with gynoid distribution, directly linking WHR-related fat patterning to fertility outcomes.

### Body Image & Psychological Well-Being

[Swami et al., 2010] The attractive female body weight and female body dissatisfaction in 26 countries. Personality and Individual Differences, 48(4):412-416.
Key finding: Preferred female body weight varied by world region and correlated with local resource scarcity, urbanization, and media exposure to thin ideals, demonstrating biocultural co-determination of attractiveness norms.

[Swami et al., 2015] Associations between positive body image and indicators of mental health. Body Image.
Key finding: Positive body image was associated with higher self-esteem, lower depression, and greater life satisfaction across both sexes, establishing body image as a core component of psychological well-being.

[Alleva, Martijn, Van Breukelen, Jansen & Karos, 2015] Expand your body: Feasibility of a new body image intervention. Body Image.
Key finding: Focusing on body functionality rather than appearance reduced body dissatisfaction in women, providing evidence that functional framing is a clinically viable approach to improving body image.

[Sorokowska et al., 2012] Leg length preferences in a semi-nomadic Himba population in Namibia. Body Image, 9(1):103-107.
Key finding: Himba semi-nomadic Namibians preferred average rather than elongated leg-to-body ratios, contrasting with urbanized Western samples and confirming leg length preferences are partly culturally modulated.

### Voice, Chemosignals & Non-Visual Attractiveness

[Puts, Hodges, Cárdenas & Gaulin, 2007] Men's voices as dominance signals: Vocal F0 predicts dominance but not attractiveness. Evolution and Human Behavior, 28(5):340-344.
Key finding: Lower vocal pitch (F0) predicted peer-rated dominance among men but did not independently predict attractiveness, suggesting voice pitch signals fighting ability rather than general mate quality.

[Saxton, Lyndon, Little & Roberts, 2008] Androstenone modulates women's attributions of men's attractiveness. Hormones and Behavior, 54(5):597-601.
Key finding: Women exposed to androstenone (a putative male pheromone) rated men's faces and bodies as more attractive, suggesting chemosignaling contributes to physical attractiveness assessment beyond visual cues.
`.trim();
