export type ProtocolQuestionnaire = {
  firstName?:           string;
  goal?:                string;
  age?:                 number;
  height_cm?:           number;
  weight_kg?:           number;
  trainingExperience?:  string;
  trainingLocation?:    string;
  sessionsPerWeek?:     number;
  preferredActivities?: string[];
  concernAreas?:        string[];
  professionalEnv?:     string;
  injuries?:            string[];
  dietaryProfile?:      string;
  sleepHours?:          string;
  stressLevel?:         number;
};
