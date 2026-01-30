// AI Health Assistant Data - Symptom to Condition Mapping

export interface Symptom {
    id: string;
    name: string;
    category: string;
    icon: string;
}

export interface Condition {
    id: string;
    name: string;
    description: string;
    symptoms: string[];
    severity: 'mild' | 'moderate' | 'severe' | 'emergency';
    specialist: string;
    urgency: string;
    homeRemedies?: string[];
    whenToSeeDoctor: string;
}

export interface SpecialistMapping {
    specialist: string;
    icon: string;
    color: string;
    conditions: string[];
}

// Common Symptoms Database
export const SYMPTOMS: Symptom[] = [
    // Head & Brain
    { id: 's1', name: 'Headache', category: 'Head', icon: 'head' },
    { id: 's2', name: 'Dizziness', category: 'Head', icon: 'refresh' },
    { id: 's3', name: 'Blurred Vision', category: 'Head', icon: 'eye' },
    { id: 's4', name: 'Memory Issues', category: 'Head', icon: 'brain' },

    // Fever & General
    { id: 's5', name: 'Fever', category: 'General', icon: 'thermometer' },
    { id: 's6', name: 'Fatigue', category: 'General', icon: 'battery-low' },
    { id: 's7', name: 'Body Pain', category: 'General', icon: 'body' },
    { id: 's8', name: 'Weakness', category: 'General', icon: 'fitness' },
    { id: 's9', name: 'Weight Loss', category: 'General', icon: 'trending-down' },
    { id: 's10', name: 'Weight Gain', category: 'General', icon: 'trending-up' },

    // Respiratory
    { id: 's11', name: 'Cough', category: 'Respiratory', icon: 'medical' },
    { id: 's12', name: 'Cold/Runny Nose', category: 'Respiratory', icon: 'water' },
    { id: 's13', name: 'Breathing Difficulty', category: 'Respiratory', icon: 'fitness' },
    { id: 's14', name: 'Chest Pain', category: 'Respiratory', icon: 'heart' },
    { id: 's15', name: 'Sore Throat', category: 'Respiratory', icon: 'mic' },

    // Digestive
    { id: 's16', name: 'Stomach Pain', category: 'Digestive', icon: 'body' },
    { id: 's17', name: 'Nausea', category: 'Digestive', icon: 'sad' },
    { id: 's18', name: 'Vomiting', category: 'Digestive', icon: 'arrow-up' },
    { id: 's19', name: 'Diarrhea', category: 'Digestive', icon: 'water' },
    { id: 's20', name: 'Constipation', category: 'Digestive', icon: 'remove' },
    { id: 's21', name: 'Loss of Appetite', category: 'Digestive', icon: 'restaurant' },

    // Skin
    { id: 's22', name: 'Skin Rash', category: 'Skin', icon: 'bandage' },
    { id: 's23', name: 'Itching', category: 'Skin', icon: 'hand-left' },
    { id: 's24', name: 'Skin Discoloration', category: 'Skin', icon: 'color-palette' },
    { id: 's25', name: 'Acne/Pimples', category: 'Skin', icon: 'ellipse' },
    { id: 's26', name: 'Hair Loss', category: 'Skin', icon: 'cut' },

    // Heart
    { id: 's27', name: 'Chest Tightness', category: 'Heart', icon: 'heart' },
    { id: 's28', name: 'Palpitations', category: 'Heart', icon: 'pulse' },
    { id: 's29', name: 'Swelling in Legs', category: 'Heart', icon: 'footsteps' },

    // Bones & Joints
    { id: 's30', name: 'Joint Pain', category: 'Bones', icon: 'body' },
    { id: 's31', name: 'Back Pain', category: 'Bones', icon: 'body' },
    { id: 's32', name: 'Neck Pain', category: 'Bones', icon: 'body' },
    { id: 's33', name: 'Muscle Cramps', category: 'Bones', icon: 'fitness' },

    // Mental Health
    { id: 's34', name: 'Anxiety', category: 'Mental', icon: 'alert' },
    { id: 's35', name: 'Depression', category: 'Mental', icon: 'sad' },
    { id: 's36', name: 'Sleep Problems', category: 'Mental', icon: 'moon' },
    { id: 's37', name: 'Stress', category: 'Mental', icon: 'flash' },

    // Eyes
    { id: 's38', name: 'Eye Pain', category: 'Eyes', icon: 'eye' },
    { id: 's39', name: 'Red Eyes', category: 'Eyes', icon: 'eye' },
    { id: 's40', name: 'Watery Eyes', category: 'Eyes', icon: 'water' },

    // Ears
    { id: 's41', name: 'Ear Pain', category: 'Ears', icon: 'ear' },
    { id: 's42', name: 'Hearing Loss', category: 'Ears', icon: 'ear' },
    { id: 's43', name: 'Ringing in Ears', category: 'Ears', icon: 'notifications' },

    // Urinary
    { id: 's44', name: 'Frequent Urination', category: 'Urinary', icon: 'water' },
    { id: 's45', name: 'Burning Urination', category: 'Urinary', icon: 'flame' },
    { id: 's46', name: 'Blood in Urine', category: 'Urinary', icon: 'alert-circle' },

    // Tropical & Infections
    { id: 's47', name: 'Chills', category: 'Tropical', icon: 'snow' },
    { id: 's48', name: 'Severe Headache', category: 'Tropical', icon: 'head' },
    { id: 's49', name: 'Muscle/Joint Pain', category: 'Tropical', icon: 'body' },
    { id: 's50', name: 'Yellow Skin/Eyes', category: 'Tropical', icon: 'color-filter' },
    { id: 's51', name: 'Mosquito Bites', category: 'Tropical', icon: 'bug' },

    // Hormonal & Metabolism
    { id: 's52', name: 'Excessive Thirst', category: 'Hormonal', icon: 'water' },
    { id: 's53', name: 'Heat Intolerance', category: 'Hormonal', icon: 'flame' },
    { id: 's54', name: 'Excessive Sweating', category: 'Hormonal', icon: 'water' },
    { id: 's55', name: 'Tremors', category: 'Hormonal', icon: 'walk' },

    // Pediatric
    { id: 's56', name: 'Constant Crying', category: 'Pediatric', icon: 'sad' },
    { id: 's57', name: 'Refusing Feed', category: 'Pediatric', icon: 'restaurant' },
    { id: 's58', name: 'Diaper Rash', category: 'Pediatric', icon: 'bandage' },
];

// Conditions Database with Symptom Mapping
export const CONDITIONS: Condition[] = [
    {
        id: 'c1',
        name: 'Common Cold',
        description: 'A viral infection affecting the nose and throat',
        symptoms: ['Cold/Runny Nose', 'Cough', 'Sore Throat', 'Fever', 'Fatigue'],
        severity: 'mild',
        specialist: 'General Physician',
        urgency: 'Can wait 2-3 days',
        homeRemedies: ['Rest', 'Drink warm fluids', 'Honey and ginger tea', 'Steam inhalation'],
        whenToSeeDoctor: 'If symptoms persist beyond 7 days or fever exceeds 102°F',
    },
    {
        id: 'c2',
        name: 'Viral Fever',
        description: 'Fever caused by viral infection',
        symptoms: ['Fever', 'Body Pain', 'Fatigue', 'Headache', 'Weakness'],
        severity: 'mild',
        specialist: 'General Physician',
        urgency: 'Within 2-3 days if fever persists',
        homeRemedies: ['Rest', 'Stay hydrated', 'Light diet', 'Paracetamol for fever'],
        whenToSeeDoctor: 'If fever exceeds 103°F or lasts more than 3 days',
    },
    {
        id: 'c3',
        name: 'Migraine',
        description: 'Severe recurring headache, often with other symptoms',
        symptoms: ['Headache', 'Nausea', 'Blurred Vision', 'Dizziness'],
        severity: 'moderate',
        specialist: 'Neurologist',
        urgency: 'Schedule within a week',
        homeRemedies: ['Rest in dark room', 'Cold compress', 'Avoid bright lights', 'Stay hydrated'],
        whenToSeeDoctor: 'If headaches are frequent or affect daily activities',
    },
    {
        id: 'c4',
        name: 'Gastritis',
        description: 'Inflammation of the stomach lining',
        symptoms: ['Stomach Pain', 'Nausea', 'Vomiting', 'Loss of Appetite'],
        severity: 'moderate',
        specialist: 'Gastroenterologist',
        urgency: 'Within a week',
        homeRemedies: ['Eat smaller meals', 'Avoid spicy food', 'Avoid alcohol', 'Antacids'],
        whenToSeeDoctor: 'If symptoms persist or you see blood in vomit',
    },
    {
        id: 'c5',
        name: 'Hypertension',
        description: 'High blood pressure condition',
        symptoms: ['Headache', 'Dizziness', 'Chest Tightness', 'Blurred Vision'],
        severity: 'moderate',
        specialist: 'Cardiologist',
        urgency: 'Schedule within a week',
        homeRemedies: ['Reduce salt intake', 'Exercise regularly', 'Manage stress', 'Limit alcohol'],
        whenToSeeDoctor: 'Regular monitoring recommended, immediately if BP is very high',
    },
    {
        id: 'c6',
        name: 'Diabetes Symptoms',
        description: 'Signs that may indicate diabetes',
        symptoms: ['Frequent Urination', 'Fatigue', 'Weight Loss', 'Blurred Vision', 'Weakness'],
        severity: 'moderate',
        specialist: 'Endocrinologist',
        urgency: 'Get tested within a week',
        homeRemedies: ['Reduce sugar intake', 'Exercise', 'Eat balanced diet'],
        whenToSeeDoctor: 'Get blood sugar tested if symptoms persist',
    },
    {
        id: 'c7',
        name: 'Allergic Reaction',
        description: 'Immune response to allergens',
        symptoms: ['Skin Rash', 'Itching', 'Cold/Runny Nose', 'Watery Eyes', 'Cough'],
        severity: 'mild',
        specialist: 'Dermatologist',
        urgency: 'Within a few days',
        homeRemedies: ['Avoid allergen', 'Antihistamines', 'Cold compress', 'Calamine lotion'],
        whenToSeeDoctor: 'If rash spreads or breathing becomes difficult',
    },
    {
        id: 'c8',
        name: 'Urinary Tract Infection',
        description: 'Bacterial infection in urinary system',
        symptoms: ['Burning Urination', 'Frequent Urination', 'Stomach Pain', 'Fever'],
        severity: 'moderate',
        specialist: 'Urologist',
        urgency: 'Within 2-3 days',
        homeRemedies: ['Drink plenty of water', 'Cranberry juice', 'Maintain hygiene'],
        whenToSeeDoctor: 'If symptoms persist beyond 2 days or blood in urine',
    },
    {
        id: 'c9',
        name: 'Anxiety Disorder',
        description: 'Persistent worry and fear affecting daily life',
        symptoms: ['Anxiety', 'Sleep Problems', 'Palpitations', 'Fatigue', 'Stress'],
        severity: 'moderate',
        specialist: 'Psychiatrist',
        urgency: 'Schedule when comfortable',
        homeRemedies: ['Deep breathing', 'Regular exercise', 'Meditation', 'Limit caffeine'],
        whenToSeeDoctor: 'If anxiety affects daily activities or relationships',
    },
    {
        id: 'c10',
        name: 'Conjunctivitis',
        description: 'Pink eye - inflammation of the eye',
        symptoms: ['Red Eyes', 'Watery Eyes', 'Eye Pain', 'Itching'],
        severity: 'mild',
        specialist: 'Ophthalmologist',
        urgency: 'Within 2-3 days',
        homeRemedies: ['Warm compress', 'Avoid touching eyes', 'Good hygiene'],
        whenToSeeDoctor: 'If vision is affected or symptoms worsen',
    },
    {
        id: 'c11',
        name: 'Arthritis',
        description: 'Joint inflammation causing pain and stiffness',
        symptoms: ['Joint Pain', 'Muscle Cramps', 'Weakness', 'Fatigue'],
        severity: 'moderate',
        specialist: 'Orthopedic',
        urgency: 'Schedule within a week',
        homeRemedies: ['Hot/cold therapy', 'Gentle exercise', 'Weight management'],
        whenToSeeDoctor: 'If joint pain affects mobility',
    },
    {
        id: 'c12',
        name: 'Ear Infection',
        description: 'Infection in the ear canal or middle ear',
        symptoms: ['Ear Pain', 'Hearing Loss', 'Fever', 'Headache'],
        severity: 'moderate',
        specialist: 'ENT Specialist',
        urgency: 'Within 2-3 days',
        homeRemedies: ['Warm compress on ear', 'Pain relievers', 'Keep ear dry'],
        whenToSeeDoctor: 'If pain is severe or discharge from ear',
    },
    {
        id: 'c13',
        name: 'Heart Warning Signs',
        description: 'Symptoms that may indicate heart problems',
        symptoms: ['Chest Pain', 'Chest Tightness', 'Palpitations', 'Breathing Difficulty', 'Swelling in Legs'],
        severity: 'severe',
        specialist: 'Cardiologist',
        urgency: 'URGENT - See doctor immediately',
        whenToSeeDoctor: 'Immediately if symptoms are severe',
    },
    {
        id: 'c14',
        name: 'Stroke Warning Signs',
        description: 'Emergency symptoms of possible stroke',
        symptoms: ['Headache', 'Dizziness', 'Blurred Vision', 'Weakness', 'Memory Issues'],
        severity: 'emergency',
        specialist: 'Neurologist',
        urgency: 'EMERGENCY - Call ambulance immediately',
        whenToSeeDoctor: 'Call emergency services immediately',
    },
    {
        id: 'c15',
        name: 'Dengue Fever',
        description: 'Mosquito-borne viral infection',
        symptoms: ['Fever', 'Severe Headache', 'Muscle/Joint Pain', 'Skin Rash', 'Nausea'],
        severity: 'severe',
        specialist: 'General Physician',
        urgency: 'See doctor within 24 hours',
        homeRemedies: ['Complete bed rest', 'High fluid intake', 'Papaya leaf extract', 'Avoid aspirin/ibuprofen'],
        whenToSeeDoctor: 'Immediately if you notice bleeding or severe stomach pain',
    },
    {
        id: 'c16',
        name: 'Malaria',
        description: 'Parasitic infection transmitted by mosquitoes',
        symptoms: ['Fever', 'Chills', 'Headache', 'Vomiting', 'Fatigue'],
        severity: 'severe',
        specialist: 'General Physician',
        urgency: 'See doctor immediately for blood test',
        homeRemedies: ['Rest', 'Hydration', 'Follow prescribed antimalarial course'],
        whenToSeeDoctor: 'Immediately upon suspected symptoms in endemic areas',
    },
    {
        id: 'c17',
        name: 'Jaundice / Hepatitis',
        description: 'Liver inflammation or bile duct issues',
        symptoms: ['Yellow Skin/Eyes', 'Loss of Appetite', 'Fatigue', 'Nausea', 'Dark Urine'],
        severity: 'severe',
        specialist: 'Gastroenterologist',
        urgency: 'See doctor within 24 hours',
        homeRemedies: ['Low-fat diet', 'Avoid alcohol', 'Boiled water only', 'Sugarcane juice'],
        whenToSeeDoctor: 'If yellowing of eyes/skin is prominent',
    },
    {
        id: 'c18',
        name: 'Hyperthyroidism',
        description: 'Overactive thyroid gland producing too much hormone',
        symptoms: ['Weight Loss', 'Heart Palpitations', 'Excessive Sweating', 'Heat Intolerance', 'Tremors'],
        severity: 'moderate',
        specialist: 'Endocrinologist',
        urgency: 'Schedule within a week',
        homeRemedies: ['Stress management', 'Anti-inflammatory diet'],
        whenToSeeDoctor: 'If you experience sudden weight loss or racing heart',
    },
];

// Specialist Mapping
export const SPECIALISTS: SpecialistMapping[] = [
    { specialist: 'General Physician', icon: 'person', color: '#2196F3', conditions: ['Common Cold', 'Viral Fever', 'General Checkup'] },
    { specialist: 'Cardiologist', icon: 'heart', color: '#F44336', conditions: ['Hypertension', 'Heart Disease', 'Chest Pain'] },
    { specialist: 'Neurologist', icon: 'pulse', color: '#9C27B0', conditions: ['Migraine', 'Headaches', 'Nerve Problems'] },
    { specialist: 'Dermatologist', icon: 'bandage', color: '#FF9800', conditions: ['Skin Rash', 'Acne', 'Allergies'] },
    { specialist: 'Gastroenterologist', icon: 'restaurant', color: '#4CAF50', conditions: ['Gastritis', 'Digestion Issues', 'Stomach Pain'] },
    { specialist: 'Orthopedic', icon: 'body', color: '#795548', conditions: ['Joint Pain', 'Back Pain', 'Fractures'] },
    { specialist: 'Ophthalmologist', icon: 'eye', color: '#00BCD4', conditions: ['Eye Problems', 'Vision Issues', 'Conjunctivitis'] },
    { specialist: 'ENT Specialist', icon: 'ear', color: '#E91E63', conditions: ['Ear Infection', 'Throat Problems', 'Sinus'] },
    { specialist: 'Endocrinologist', icon: 'fitness', color: '#673AB7', conditions: ['Diabetes', 'Thyroid', 'Hormonal Issues'] },
    { specialist: 'Psychiatrist', icon: 'happy', color: '#3F51B5', conditions: ['Anxiety', 'Depression', 'Mental Health'] },
    { specialist: 'Urologist', icon: 'water', color: '#009688', conditions: ['UTI', 'Kidney Issues', 'Urinary Problems'] },
];

// AI Analysis Function
export function analyzeSymptoms(selectedSymptoms: string[]): {
    possibleConditions: Condition[];
    recommendedSpecialist: string;
    urgencyLevel: string;
    advice: string;
} {
    if (selectedSymptoms.length === 0) {
        return {
            possibleConditions: [],
            recommendedSpecialist: 'General Physician',
            urgencyLevel: 'Not enough information',
            advice: 'Please select at least one symptom to get recommendations.',
        };
    }

    // Score each condition based on matching symptoms
    const conditionScores = CONDITIONS.map(condition => {
        const matchingSymptoms = condition.symptoms.filter(s =>
            selectedSymptoms.includes(s)
        );
        const score = matchingSymptoms.length / condition.symptoms.length;
        return { condition, score, matchCount: matchingSymptoms.length };
    });

    // Filter conditions with at least some match
    const relevantConditions = conditionScores
        .filter(cs => cs.matchCount >= 1) // Match at least one symptom
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(cs => cs.condition);

    // Determine urgency
    const hasEmergency = relevantConditions.some(c => c.severity === 'emergency');
    const hasSevere = relevantConditions.some(c => c.severity === 'severe');

    let urgencyLevel = 'Low - Can schedule a routine appointment';
    if (hasEmergency) {
        urgencyLevel = '🚨 EMERGENCY - Seek immediate medical attention!';
    } else if (hasSevere) {
        urgencyLevel = '⚠️ High - Please see a doctor within 24 hours';
    } else if (relevantConditions.some(c => c.severity === 'moderate')) {
        urgencyLevel = 'Moderate - Schedule an appointment this week';
    }

    // Determine recommended specialist
    const specialistCounts: Record<string, number> = {};
    relevantConditions.forEach(c => {
        specialistCounts[c.specialist] = (specialistCounts[c.specialist] || 0) + 1;
    });
    const recommendedSpecialist = Object.entries(specialistCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'General Physician';

    // Generate advice
    let advice = '';
    if (hasEmergency) {
        advice = 'Your symptoms may indicate a serious condition. Please call emergency services or go to the nearest hospital immediately.';
    } else if (hasSevere) {
        advice = 'Your symptoms require prompt medical attention. Please schedule an appointment with a doctor as soon as possible.';
    } else if (relevantConditions.length > 0) {
        advice = `Based on your symptoms, we recommend consulting a ${recommendedSpecialist}. Meanwhile, rest and stay hydrated.`;
    } else {
        advice = 'Your symptoms don\'t match any specific condition in our database. For personalized advice, please consult a General Physician.';
    }

    return {
        possibleConditions: relevantConditions,
        recommendedSpecialist,
        urgencyLevel,
        advice,
    };
}

// Health Tips
export const HEALTH_TIPS = [
    { id: 't1', title: 'Stay Hydrated', tip: 'Drink at least 8 glasses of water daily', icon: 'water' },
    { id: 't2', title: 'Regular Exercise', tip: '30 minutes of physical activity daily', icon: 'fitness' },
    { id: 't3', title: 'Balanced Diet', tip: 'Include fruits and vegetables in every meal', icon: 'nutrition' },
    { id: 't4', title: 'Quality Sleep', tip: 'Get 7-8 hours of sleep every night', icon: 'moon' },
    { id: 't5', title: 'Mental Wellness', tip: 'Practice meditation or deep breathing', icon: 'happy' },
    { id: 't6', title: 'Regular Checkups', tip: 'Annual health checkups are important', icon: 'medkit' },
];
