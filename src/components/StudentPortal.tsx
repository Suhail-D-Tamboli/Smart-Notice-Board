import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import StudentRegistrationForm from './StudentRegistrationForm';
import { subscribeToPushNotifications } from '../services/pushNotificationService';
import './StudentPortal.css';
import StudentPortalHome from './StudentPortalHome';
import ChatBot from './ChatBot';

interface Notice {
  _id: string;
  title: string;
  description: string;
  date: string;
  semester?: string;
  department?: string;
  createdBy: string;
  createdAt: string;
  file?: string;
  poster?: string;
  summary?: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  semester?: string;
  department?: string;
  createdBy: string;
  createdAt: string;
  file?: string;
  registrationFields?: string[];
  hasRegistrationForm?: boolean;
  poster?: string;
}

interface StudentPortalProps {
  user: any;
  logout: () => void;
}

// Improved translation function with actual text translation simulation
const translateText = async (text: string, targetLang: string): Promise<string> => {
  // In a real implementation, this would call a translation API
  // For now, we'll simulate translations with actual translated text
  if (!text) return text;
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Return actual translated text based on language
  switch (targetLang) {
    case 'kn': // Kannada
      // This is a simple mapping for demonstration
      const kannadaMap: Record<string, string> = {
        'Welcome': 'ಸ್ವಾಗತ',
        'Notice': 'ಸೂಚನೆ',
        'Event': 'ಕಾರ್ಯಕ್ರಮ',
        'Important': 'ಮಹತ್ವದ',
        'Update': 'ಅಪ್ಡೇಟ್',
        'Meeting': 'ಸಭೆ',
        'Exam': 'ಪರೀಕ್ಷೆ',
        'Schedule': 'ವೇಳಾಪಟ್ಟಿ',
        'New': 'ಹೊಸ',
        'Annual': 'ವಾರ್ಷಿಕ',
        'Department': 'ವಿಭಾಗ',
        'Student': 'ವಿದ್ಯಾರ್ಥಿ',
        'Teacher': 'ಶಿಕ್ಷಕ',
        'Campus': 'ಶಿಬಿರ',
        'University': 'ವಿಶ್ವವಿದ್ಯಾಲಯ',
        'Library': 'ಗ್ರಂಥಾಲಯ',
        'Holiday': 'ರಜೆ',
        'Festival': 'ಉತ್ಸವ',
        'Sports': 'ಕ್ರೀಡೆ',
        'Cultural': 'ಸಾಂಸ್ಕೃತಿಕ',
        'Information': 'ಮಾಹಿತಿ',
        'Technology': 'ತಂತ್ರಜ್ಞಾನ',
        'Science': 'ವಿಜ್ಞಾನ',
        'Mathematics': 'ಗಣಿತ',
        'English': 'ಇಂಗ್ಲೀಷ್',
        'Kannada': 'ಕನ್ನಡ',
        'Hindi': 'ಹಿಂದಿ',
        'Results': 'ಫಲಿತಾಂಶಗಳು',
        'Admission': 'ಪ್ರವೇಶ',
        'Scholarship': 'ಚೇತನಾ ವೇತನ',
        'Registration': 'ನೋಂದಣಿ',
        'Submission': 'ಸಲ್ಲಿಕೆ',
        'Deadline': 'ಕೊನೆಯ ದಿನಾಂಕ',
        'Seminar': 'ಸೆಮಿನಾರ್',
        'Workshop': 'ಕಾರ್ಯಾಗಾರ',
        'Competition': 'ಸ್ಪರ್ಧೆ',
        'Conference': 'ಸಮ್ಮೇಳನ',
        'Examination': 'ಪರೀಕ್ಷೆ',
        'Timetable': 'ಸಮಯಪಟ್ಟಿ',
        'Syllabus': 'ಅಧ್ಯಯನಕ್ರಮ',
        'Assignment': 'ಕೆಲಸ ನೀಡುವಿಕೆ',
        'Project': 'ಯೋಜನೆ',
        'Internship': 'ಅಂತರ್ವಾಸ',
        'Placement': 'ಸ್ಥಳಾಂತರ',
        'Training': 'ತರಬೇತಿ',
        'Certificate': 'ಪ್ರಮಾಣಪತ್ರ',
        'Degree': 'ಪದವಿ',
        'Diploma': 'ಡಿಪ್ಲೊಮಾ',
        'Graduation': 'ಪದವೀಕರಣ',
        'Postgraduate': 'ಸ್ನಾತಕೋತ್ತರ',
        'Undergraduate': 'ಪೂರ್ವಸ್ನಾತಕ',
        'Research': 'ಸಂಶೋಧನೆ',
        'Publication': 'ಪ್ರಕಟಣೆ',
        'Hostel': 'ಛಾತ್ರಾವಾಸ',
        'Canteen': 'ಕೆಂಟೀನ್',
        'Transport': 'ಸಾರಿಗೆ',
        'Medical': 'ವೈದ್ಯಕೀಯ',
        'Emergency': 'ತುರ್ತು',
        'Contact': 'ಸಂಪರ್ಕಿಸಿ',
        'Phone': 'ದೂರವಾಣಿ',
        'Email': 'ಇಮೇಲ್',
        'Website': 'ಜಾಲತಾಣ',
        'Address': 'ವಿಳಾಸ',
        'Location': 'ಸ್ಥಳ',
        'Map': 'ನಕ್ಷೆ',
        'Directions': 'ದಿಕ್ಕುಗಳು',
        'Rules': 'ನಿಯಮಗಳು',
        'Regulations': 'ನಿಯಂತ್ರಣಗಳು',
        'Policy': 'ನೀತಿ',
        'Guidelines': 'ಮಾರ್ಗಸೂಚಿಗಳು',
        'Code': 'ಸಂಕೇತ',
        'Conduct': 'ನಡೆಯುವಿಕೆ',
        'Discipline': 'ಅನುಶಾಸನ',
        'Attendance': 'ಹಾಜರಾತಿ',
        'Marks': 'ಅಂಕಗಳು',
        'Grades': 'ಶ್ರೇಣಿಗಳು',
        'Evaluation': 'ಮೌಲ್ಯೀಕರಣ',
        'Assessment': 'ಮೌಲ್ಯಾಂಕನ',
        'Feedback': 'ಪ್ರತಿಕ್ರಿಯೆ',
        'Complaint': 'ಫ complain',
        'Suggestion': 'ಸಲಹೆ',
        'Improvement': 'ಸುಧಾರಣೆ',
        'Development': 'ಅಭಿವೃದ್ಧಿ',
        'Facilities': 'ಸೌಕರ್ಯಗಳು',
        'Infrastructure': 'ಮೂಲಭೂತ ಸೌಕರ್ಯ',
        'Equipment': 'ಉಪಕರಣಗಳು',
        'Resources': 'ಸಂಪನ್ಮೂಲಗಳು',
        'Fees': 'ಶುಲ್ಕಗಳು',
        'Payment': 'ಪಾವತಿ',
        'Refund': 'ಹಿಂದಿರುಗಾಟ',
        'Loan': 'ಸಾಲ',
        'Financial': 'ಹಣಕಾಸಿನ',
        'Aid': 'ಸಹಾಯ',
        'Support': 'ಬೆಂಬಲ',
        'Counseling': 'ಸಲಹೆ ನೀಡುವಿಕೆ',
        'Career': 'ವೃತ್ತಿ',
        'Guidance': 'ಮಾರ್ಗದರ್ಶನ',
        'Alumni': 'ಹಳೆಯ ವಿದ್ಯಾರ್ಥಿಗಳು',
        'Association': 'ಸಂಘಟನೆ',
        'Club': 'ಚಟುವಟಿಕೆ ಸಮಿತಿ',
        'Society': 'ಸಮಾಜ',
        'Committee': 'ಕಮಿಟಿ',
        'Board': 'ಮಂಡಳಿ',
        'Council': 'ಪರಿಷತ್ತು',
        'Faculty': 'ಸಿಬ್ಬಂದಿ',
        'Staff': 'ಸಿಬ್ಬಂದಿ',
        'Administration': 'ನಿರ್ವಹಣೆ',
        'Management': 'ನಿರ್ವಹಣೆ',
        'Director': 'ನಿರ್ದೇಶಕ',
        'Principal': 'ಮುಖ್ಯಸ್ಥ',
        'Dean': 'ಡೀನ್',
        'HOD': 'ವಿಭಾಗ ಮುಖ್ಯಸ್ಥ',
        'Professor': 'ಪ್ರೊಫೆಸರ್',
        'Assistant': 'ಸಹಾಯಕ',
        'Lecturer': 'ಉಪನ್ಯಾಸಕ',
        'Instructor': 'ಪ್ರಶಿಕ್ಷಕ',
        'Coordinator': 'ಸಮನ್ವಯಕರ್ತ',
        'Convener': 'ಸಭೆ ಮುಖ್ಯಸ್ಥ',
        'Secretary': 'ಕಾರ್ಯದರ್ಶಿ',
        'Treasurer': 'ಕೋಷಾಧ್ಯಕ್ಷ',
        'President': 'ಅಧ್ಯಕ್ಷ',
        'Vice': 'ಉಪ',
        'Chairman': 'ಅಧ್ಯಕ್ಷರು',
        'Member': 'ಸದಸ್ಯ',
        'Guest': 'ಅತಿಥಿ',
        'Speaker': 'ಭಾಷಣಕಾರ',
        'Participant': 'ಭಾಗವಹಿಸುವವರು',
        'Audience': 'ಶ್ರೋತೃಗಳು',
        'Public': 'ಸಾರ್ವಜನಿಕ',
        'Community': 'ಸಮುದಾಯ',
        'Local': 'ಸ್ಥಳೀಯ',
        'Regional': 'ಪ್ರಾದೇಶಿಕ',
        'National': 'ರಾಷ್ಟ್ರೀಯ',
        'International': 'ಅಂತರರಾಷ್ಟ್ರೀಯ',
        'Global': 'ಜಾಗತಿಕ',
        'World': 'ಪ್ರಪಂಚ',
        'Earth': 'ಭೂಮಿ',
        'Environment': 'ಪರಿಸರ',
        'Climate': 'ಹವಾಮಾನ',
        'Weather': 'ಹವಾಮಾನ',
        'Season': 'ಋತು',
        'Spring': 'ಬಸಂತ',
        'Summer': 'ಬೇಸಿಗೆ',
        'Monsoon': 'ಮಳೆ',
        'Autumn': 'ಶರತ್',
        'Winter': 'ಶಿಶಿರ',
        'Celebration': 'ಆಚರಣೆ',
        'Ceremony': 'ಅನುಷ್ಠಾನ',
        'Anniversary': 'ವಾರ್ಷಿಕೋತ್ಸವ',
        'Birthday': 'ಜನ್ಮದಿನ',
        'Convocation': 'ಸಮಾವೇಶ',
        'Inauguration': 'ಆರಂಭ',
        'Launch': 'ಆರಂಭ',
        'Opening': 'ಆರಂಭ',
        'Closing': 'ಮುಚ್ಚುವಿಕೆ',
        'End': 'ಅಂತ್ಯ',
        'Finish': 'ಮುಗಿಯುವಿಕೆ',
        'Complete': 'ಪೂರ್ಣ',
        'Full': 'ಸಂಪೂರ್ಣ',
        'Total': 'ಒಟ್ಟು',
        'All': 'ಎಲ್ಲಾ',
        'Every': 'ಪ್ರತಿ',
        'Each': 'ಪ್ರತಿಯೊಂದು',
        'Any': 'ಯಾವುದೇ',
        'Some': 'ಕೆಲವು',
        'Many': 'ಅನೇಕ',
        'Few': 'ಕೆಲವು',
        'Several': 'ಹಲವಾರು',
        'Various': 'ವಿವಿಧ',
        'Different': 'ಭಿನ್ನ',
        'Other': 'ಇತರ',
        'Another': 'ಮತ್ತೊಂದು',
        'Next': 'ಮುಂದಿನ',
        'Previous': 'ಹಿಂದಿನ',
        'Last': 'ಕೊನೆಯ',
        'First': 'ಮೊದಲ',
        'Second': 'ಎರಡನೇ',
        'Third': 'ಮೂರನೇ',
        'Fourth': 'ನಾಲ್ಕನೇ',
        'Fifth': 'ಐದನೇ',
        'Sixth': 'ಆರನೇ',
        'Seventh': 'ಏಳನೇ',
        'Eighth': 'ಎಂಟನೇ',
        'Ninth': 'ಒಂಬತ್ತನೇ',
        'Tenth': 'ಹತ್ತನೇ'
      };
      
      // Simple word replacement for demonstration
      let translatedText = text;
      Object.keys(kannadaMap).forEach(englishWord => {
        const kannadaWord = kannadaMap[englishWord];
        translatedText = translatedText.replace(new RegExp('\\b' + englishWord + '\\b', 'gi'), kannadaWord);
      });
      
      return translatedText;
      
    case 'hi': // Hindi
      // This is a simple mapping for demonstration
      const hindiMap: Record<string, string> = {
        'Welcome': 'स्वागत है',
        'Notice': 'नोटिस',
        'Event': 'कार्यक्रम',
        'Important': 'महत्वपूर्ण',
        'Update': 'अपडेट',
        'Meeting': 'बैठक',
        'Exam': 'परीक्षा',
        'Schedule': 'कार्यक्रम',
        'New': 'नया',
        'Annual': 'वार्षिक',
        'Department': 'विभाग',
        'Student': 'छात्र',
        'Teacher': 'शिक्षक',
        'Campus': 'परिसर',
        'University': 'विश्वविद्यालय',
        'Library': 'पुस्तकालय',
        'Holiday': 'छुट्टी',
        'Festival': 'उत्सव',
        'Sports': 'खेलकूद',
        'Cultural': 'सांस्कृतिक',
        'Information': 'जानकारी',
        'Technology': 'प्रौद्योगिकी',
        'Science': 'विज्ञान',
        'Mathematics': 'गणित',
        'English': 'अंग्रेज़ी',
        'Kannada': 'कन्नड़',
        'Hindi': 'हिंदी',
        'Results': 'परिणाम',
        'Admission': 'प्रवेश',
        'Scholarship': 'छात्रवृत्ति',
        'Registration': 'पंजीकरण',
        'Submission': 'जमा करना',
        'Deadline': 'अंतिम तिथि',
        'Seminar': 'सेमिनार',
        'Workshop': 'कार्यशाला',
        'Competition': 'प्रतियोगिता',
        'Conference': 'सम्मेलन',
        'Examination': 'परीक्षा',
        'Timetable': 'समय सारिणी',
        'Syllabus': 'पाठ्यक्रम',
        'Assignment': 'कार्य',
        'Project': 'परियोजना',
        'Internship': 'इंटर्नशिप',
        'Placement': 'नौकरी',
        'Training': 'प्रशिक्षण',
        'Certificate': 'प्रमाणपत्र',
        'Degree': 'डिग्री',
        'Diploma': 'डिप्लोमा',
        'Graduation': 'स्नातक',
        'Postgraduate': 'स्नातकोत्तर',
        'Undergraduate': 'पूर्वस्नातक',
        'Research': 'अनुसंधान',
        'Publication': 'प्रकाशन',
        'Hostel': 'छात्रावास',
        'Canteen': 'कैंटीन',
        'Transport': 'परिवहन',
        'Medical': 'चिकित्सा',
        'Emergency': 'आपातकालीन',
        'Contact': 'संपर्क करें',
        'Phone': 'फ़ोन',
        'Email': 'ईमेल',
        'Website': 'वेबसाइट',
        'Address': 'पता',
        'Location': 'स्थान',
        'Map': 'नक्शा',
        'Directions': 'दिशा-निर्देश',
        'Rules': 'नियम',
        'Regulations': 'विनियम',
        'Policy': 'नीति',
        'Guidelines': 'दिशानिर्देश',
        'Code': 'कोड',
        'Conduct': 'आचरण',
        'Discipline': 'अनुशासन',
        'Attendance': 'उपस्थिति',
        'Marks': 'अंक',
        'Grades': 'ग्रेड',
        'Evaluation': 'मूल्यांकन',
        'Assessment': 'आकलन',
        'Feedback': 'प्रतिक्रिया',
        'Complaint': 'शिकायत',
        'Suggestion': 'सुझाव',
        'Improvement': 'सुधार',
        'Development': 'विकास',
        'Facilities': 'सुविधाएँ',
        'Infrastructure': 'बुनियादी ढांचा',
        'Equipment': 'उपकरण',
        'Resources': 'संसाधन',
        'Fees': 'शुल्क',
        'Payment': 'भुगतान',
        'Refund': 'वापसी',
        'Loan': 'ऋण',
        'Financial': 'वित्तीय',
        'Aid': 'सहायता',
        'Support': 'समर्थन',
        'Counseling': 'परामर्श',
        'Career': 'करियर',
        'Guidance': 'मार्गदर्शन',
        'Alumni': 'भूतपूर्व छात्र',
        'Association': 'संघ',
        'Club': 'क्लब',
        'Society': 'समाज',
        'Committee': 'समिति',
        'Board': 'बोर्ड',
        'Council': 'परिषद',
        'Faculty': 'संकाय',
        'Staff': 'कर्मचारी',
        'Administration': 'प्रशासन',
        'Management': 'प्रबंधन',
        'Director': 'निदेशक',
        'Principal': 'प्रधानाचार्य',
        'Dean': 'कुलपति',
        'HOD': 'विभागाध्यक्ष',
        'Professor': 'प्रोफेसर',
        'Assistant': 'सहायक',
        'Lecturer': 'व्याख्याता',
        'Instructor': 'निर्देशक',
        'Coordinator': 'समन्वयक',
        'Convener': 'आयोजक',
        'Secretary': 'सचिव',
        'Treasurer': 'कोषाध्यक्ष',
        'President': 'अध्यक्ष',
        'Vice': 'उप',
        'Chairman': 'अध्यक्ष',
        'Member': 'सदस्य',
        'Guest': 'अतिथि',
        'Speaker': 'वक्ता',
        'Participant': 'प्रतिभागी',
        'Audience': 'दर्शक',
        'Public': 'जनता',
        'Community': 'समुदाय',
        'Local': 'स्थानीय',
        'Regional': 'क्षेत्रीय',
        'National': 'राष्ट्रीय',
        'International': 'अंतरराष्ट्रीय',
        'Global': 'वैश्विक',
        'World': 'दुनिया',
        'Earth': 'पृथ्वी',
        'Environment': 'पर्यावरण',
        'Climate': 'जलवायु',
        'Weather': 'मौसम',
        'Season': 'ऋतु',
        'Spring': 'वसंत',
        'Summer': 'गर्मी',
        'Monsoon': 'मानसून',
        'Autumn': 'शरद ऋतु',
        'Winter': 'शीतकाल',
        'Celebration': 'आयोजन',
        'Ceremony': 'समारोह',
        'Anniversary': 'वर्षगांठ',
        'Birthday': 'जन्मदिन',
        'Convocation': 'दीक्षांत समारोह',
        'Inauguration': 'उद्घाटन',
        'Launch': 'शुभारंभ',
        'Opening': 'उद्घाटन',
        'Closing': 'समापन',
        'End': 'अंत',
        'Finish': 'समाप्त',
        'Complete': 'पूरा',
        'Full': 'पूर्ण',
        'Total': 'कुल',
        'All': 'सभी',
        'Every': 'हर',
        'Each': 'प्रत्येक',
        'Any': 'कोई भी',
        'Some': 'कुछ',
        'Many': 'कई',
        'Few': 'थोड़े',
        'Several': 'कई',
        'Various': 'विभिन्न',
        'Different': 'अलग',
        'Other': 'अन्य',
        'Another': 'एक और',
        'Next': 'अगला',
        'Previous': 'पिछला',
        'Last': 'अंतिम',
        'First': 'पहला',
        'Second': 'दूसरा',
        'Third': 'तीसरा',
        'Fourth': 'चौथा',
        'Fifth': 'पांचवां',
        'Sixth': 'छठा',
        'Seventh': 'सातवां',
        'Eighth': 'आठवां',
        'Ninth': 'नौवां',
        'Tenth': 'दसवां'
      };
      
      // Simple word replacement for demonstration (using different variable name)
      let translatedTextHindi = text;
      Object.keys(hindiMap).forEach(englishWord => {
        const hindiWord = hindiMap[englishWord];
        translatedTextHindi = translatedTextHindi.replace(new RegExp('\\b' + englishWord + '\\b', 'gi'), hindiWord);
      });
      
      return translatedTextHindi;
      
    default: // English
      return text;
  }
};

const StudentPortal: React.FC<StudentPortalProps> = ({ user, logout }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [currentView, setCurrentView] = useState<'notices' | 'events' | 'dashboard'>('notices');
  const [language, setLanguage] = useState<'en' | 'kn' | 'hi'>('en');
  const [translatedNotices, setTranslatedNotices] = useState<Notice[]>([]);
  const [translatedEvents, setTranslatedEvents] = useState<Event[]>([]);
  const [translating, setTranslating] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [checkingNotification, setCheckingNotification] = useState(true);
  const [summarizingNoticeId, setSummarizingNoticeId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Function to summarize notice content using AI
  const summarizeNotice = async (notice: Notice) => {
    setSummarizingNoticeId(notice._id);
    try {
      // In a real implementation, this would call an AI service
      // For now, we'll simulate with a smart summary
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      // Generate a smart summary based on the notice content
      const summary = generateSmartSummary(notice.title, notice.description);
      
      // Update the notice with the summary
      const updatedNotices = translatedNotices.map(n => 
        n._id === notice._id ? { ...n, summary } : n
      );
      setTranslatedNotices(updatedNotices);
      
      return summary;
    } catch (err) {
      console.error('Error summarizing notice:', err);
      // Fallback summary
      const fallbackSummary = `📋 Brief: ${notice.title.substring(0, 50)}${notice.title.length > 50 ? '...' : ''}`;
      const updatedNotices = translatedNotices.map(n => 
        n._id === notice._id ? { ...n, summary: fallbackSummary } : n
      );
      setTranslatedNotices(updatedNotices);
      return fallbackSummary;
    } finally {
      setSummarizingNoticeId(null);
    }
  };

  // Function to generate smart summary (enhanced AI simulation)
  const generateSmartSummary = (title: string, description: string): string => {
    // Enhanced summarization logic
    const fullText = `${title}. ${description}`;
    
    // Clean and normalize text
    const cleanText = fullText
      .replace(/\s+/g, ' ')
      .replace(/[^a-zA-Z0-9\s.,!?]/g, '')
      .trim();
    
    // Extract first sentence or first part if no sentence ending
    let keyInfo = '';
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length > 0) {
      keyInfo = sentences[0].trim();
    } else {
      keyInfo = cleanText.substring(0, 100);
    }
    
    // Truncate to appropriate length
    if (keyInfo.length > 80) {
      keyInfo = keyInfo.substring(0, 77) + '...';
    }
    
    // Determine category based on keywords
    const lowerText = fullText.toLowerCase();
    
    if (lowerText.includes('exam') || lowerText.includes('test') || lowerText.includes('assessment')) {
      return `📋 Exam: ${keyInfo}`;
    } else if (lowerText.includes('meeting') || lowerText.includes('discuss') || lowerText.includes('agenda')) {
      return `👥 Meeting: ${keyInfo}`;
    } else if (lowerText.includes('event') || lowerText.includes('workshop') || lowerText.includes('seminar')) {
      return `🎉 Event: ${keyInfo}`;
    } else if (lowerText.includes('deadline') || lowerText.includes('due') || lowerText.includes('submit')) {
      return `⏰ Deadline: ${keyInfo}`;
    } else if (lowerText.includes('holiday') || lowerText.includes('break') || lowerText.includes('vacation')) {
      return `🌴 Holiday: ${keyInfo}`;
    } else if (lowerText.includes('register') || lowerText.includes('enroll') || lowerText.includes('apply')) {
      return `✍️ Register: ${keyInfo}`;
    } else {
      // Generic summary
      return `📢 Notice: ${keyInfo}`;
    }
  };

  // Fetch notices and events
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        console.log('Fetching data for user:', user);
        console.log('Department:', user.department, 'Semester:', user.semester);
        
        // Fetch notices for student's department and semester
        const noticesResponse = await fetch(`/api/notices?department=${user.department}&semester=${user.semester}`);
        const noticesData = await noticesResponse.json();
        console.log('Fetched notices:', noticesData);
        setNotices(noticesData.notices || noticesData || []);
        
        // Fetch events for student's department and semester
        const eventsResponse = await fetch(`/api/events?department=${user.department}&semester=${user.semester}`);
        const eventsData = await eventsResponse.json();
        console.log('Fetched events:', eventsData);
        setEvents(eventsData.events || eventsData || []);
      } catch (err) {
        setError('Failed to fetch data');
        console.error('StudentPortal: Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up periodic refresh (every 30 seconds)
    const interval = setInterval(fetchData, 30000);
    
    // Listen for push notifications to refresh data
    const handlePushMessage = (event: MessageEvent) => {
      console.log('StudentPortal: Received push message:', event);
      if (event.data) {
        try {
          const data = JSON.parse(event.data);
          console.log('StudentPortal: Push message data:', data);
          // Refresh data when we receive certain push notifications
          if (data.tag && (data.tag.includes('new-notice') || data.tag.includes('new-event') || 
              data.tag.includes('deleted-notice') || data.tag.includes('deleted-event'))) {
            console.log('StudentPortal: Refreshing data due to push notification');
            // Refresh with department and semester filtering
            fetchData();
          }
        } catch (e) {
          console.log('StudentPortal: Could not parse push message data:', e);
        }
      }
    };
    
    // Add event listener for push messages if service worker is available
    if ('serviceWorker' in navigator) {
      console.log('StudentPortal: Adding message event listener');
      navigator.serviceWorker.addEventListener('message', handlePushMessage);
        
      // Check if service worker is registered
      navigator.serviceWorker.getRegistration().then(function(registration) {
        console.log('StudentPortal: Service worker registration:', registration);
        if (registration) {
          console.log('StudentPortal: Service worker is registered and active');
          // Check if it's controlling this client
          if (navigator.serviceWorker.controller) {
            console.log('StudentPortal: Service worker is controlling this client');
          } else {
            console.log('StudentPortal: Service worker is not controlling this client');
          }
        } else {
          console.log('StudentPortal: No service worker registration found');
        }
      }).catch(function(error) {
        console.error('StudentPortal: Error getting service worker registration:', error);
      });
    }
    
    // Cleanup
    return () => {
      console.log('Cleaning up event listeners');
      clearInterval(interval);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handlePushMessage);
      }
    };
  }, []);

  // Check push notification status
  useEffect(() => {
    console.log('Checking notification status for user:', user);
    // Check if user already has notifications enabled
    if (user && user.notificationsEnabled) {
      console.log('StudentPortal: User already has notifications enabled');
      setNotificationEnabled(true);
    }
    setCheckingNotification(false);
  }, [user]);

  // Enable push notifications
  const enableNotifications = async () => {
    try {
      console.log('StudentPortal: Enabling notifications');
      setCheckingNotification(true);
      const success = await subscribeToPushNotifications(user._id || user.username);
      console.log('StudentPortal: Subscription result:', success);
      if (success) {
        setNotificationEnabled(true);
        
        // Update user's notification status in database
        try {
          const response = await fetch(`/api/users/${user._id}/notifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notificationsEnabled: true }),
          });
          
          if (response.ok) {
            console.log('StudentPortal: User notification status updated in database');
          } else {
            console.error('StudentPortal: Failed to update user notification status');
          }
        } catch (error) {
          console.error('StudentPortal: Error updating user notification status:', error);
        }
        
        alert('✅ Notifications enabled! You will receive alerts for new notices and events.');
      } else {
        alert('❌ Failed to enable notifications. Please check your browser settings.');
      }
    } catch (error) {
      console.error('StudentPortal: Error enabling notifications:', error);
      alert('❌ Error enabling notifications');
    } finally {
      setCheckingNotification(false);
    }
  };

  // Test notification function
  const testNotification = async () => {
    try {
      if (!notificationEnabled) {
        alert('⚠️ Please enable notifications first!');
        return;
      }

      console.log('Sending test notification...');
      const response = await fetch('/api/send-test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          title: '🧪 Test Notification',
          body: 'This is a test notification from Smart Campus Hub!',
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ Test notification sent! Check your notifications.');
      } else {
        alert('❌ Failed to send test notification.');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('❌ Error sending test notification');
    }
  };

  // Function to translate notices and events
  const translateContent = async (targetLang: 'en' | 'kn' | 'hi') => {
    console.log('translateContent called with:', targetLang, 'Notices:', notices.length, 'Events:', events.length);
    
    if (targetLang === 'en') {
      // If English, use original content
      setTranslatedNotices(notices);
      setTranslatedEvents(events);
      return;
    }
    
    if (notices.length === 0 && events.length === 0) {
      console.log('No content to translate yet');
      return;
    }
    
    setTranslating(true);
    try {
      // Translate notices
      const translatedNoticesData = await Promise.all(
        notices.map(async (notice) => {
          const translatedTitle = await translateText(notice.title, targetLang);
          const translatedDesc = await translateText(notice.description, targetLang);
          console.log('Translated notice:', notice.title, '->', translatedTitle);
          return {
            ...notice,
            title: translatedTitle,
            description: translatedDesc
          };
        })
      );
      
      // Translate events
      const translatedEventsData = await Promise.all(
        events.map(async (event) => {
          const translatedTitle = await translateText(event.title, targetLang);
          const translatedDesc = await translateText(event.description, targetLang);
          console.log('Translated event:', event.title, '->', translatedTitle);
          return {
            ...event,
            title: translatedTitle,
            description: translatedDesc
          };
        })
      );
      
      setTranslatedNotices(translatedNoticesData);
      setTranslatedEvents(translatedEventsData);
      console.log('Translation completed successfully');
    } catch (err) {
      console.error('Translation error:', err);
      // Fallback to original content on error
      setTranslatedNotices(notices);
      setTranslatedEvents(events);
    } finally {
      setTranslating(false);
    }
  };

  // Handle language change
  const handleLanguageChange = async (lang: 'en' | 'kn' | 'hi') => {
    console.log('Language changed to:', lang);
    setLanguage(lang);
    await translateContent(lang);
  };

  // Initialize translated content when notices/events load
  useEffect(() => {
    console.log('Notices/Events loaded:', notices.length, events.length);
    if (language === 'en') {
      setTranslatedNotices(notices);
      setTranslatedEvents(events);
    } else if (notices.length > 0 || events.length > 0) {
      translateContent(language);
    }
  }, [notices, events]);

  const openRegistrationForm = async (event: any) => {
    // Refresh the event data to get the latest registration form
    try {
      const response = await fetch(`/api/events/${event._id}`);
      if (response.ok) {
        const updatedEvent = await response.json();
        setSelectedEvent(updatedEvent);
      } else {
        // If we can't fetch the updated event, use the existing one
        setSelectedEvent(event);
      }
    } catch (err) {
      // If there's an error, use the existing event
      setSelectedEvent(event);
    }
    
    setShowRegistrationForm(true);
    setRegistrationSuccess(false);
  };

  const handleRegistrationSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/events/${selectedEvent._id}/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Auto-fill only name, department, and semester from user profile
          studentId: user._id,
          studentName: user.username,
          department: user.department,
          semester: user.semester,
          // Include form data
          ...data
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setRegistrationSuccess(true);
        // Dispatch custom event to notify dashboard to refresh registered events count
        window.dispatchEvent(new CustomEvent('registrationUpdated'));
      } else {
        setError(result.message || 'Failed to register for event');
      }
    } catch (err) {
      setError('Failed to register for event');
      console.error('StudentPortal: Error registering for event:', err);
    }
  };

  const renderItems = () => {
    if (loading) {
      return <div className="empty">Loading...</div>;
    }
    
    if (error) {
      return <div className="empty">Error: {error}</div>;
    }
    
    // Use translated content based on selected language
    const items = currentView === 'notices' ? translatedNotices : translatedEvents;
    
    if (items.length === 0) {
      return <div className="empty">No {currentView} found.</div>;
    }
    
    return items.map((item: Notice | Event) => (
      <div className="card" key={item._id}>
        <div className="item-header">
          <div className="title">{item.title}</div>
          <div className="meta">{new Date(item.date).toLocaleDateString()}</div>
        </div>
        {/* Display createdBy information for notices */}
        {currentView === 'notices' && 'createdBy' in item && item.createdBy && (
          <div className="meta" style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>
            Posted by: {item.createdBy}
          </div>
        )}
        <div className="meta" style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {'semester' in item && item.semester && (
            <span className="badge">Sem {item.semester}</span>
          )}
          {'department' in item && item.department && (
            <span className="badge">{item.department}</span>
          )}
        </div>
        
        {/* AI Summary Section */}
        {'summary' in item && item.summary && item.summary.trim() !== '' && (
          <div style={{
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px', color: '#6366f1' }}>🤖</span>
            <div>
              <div style={{ 
                fontWeight: '700', 
                color: '#4f46e5', 
                marginBottom: '4px',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                AI Summary
              </div>
              <div style={{ 
                color: 'var(--text)', 
                fontSize: '16px',
                lineHeight: '1.5'
              }}>
                {item.summary}
              </div>
            </div>
          </div>
        )}
        
        <div>{item.description}</div>
        
        {/* AI Summarize Button for Notices */}
        {currentView === 'notices' && (!('summary' in item) || !item.summary || item.summary.trim() === '') && (
          <div style={{ marginTop: '16px' }}>
            <button 
              onClick={() => summarizeNotice(item as Notice)}
              disabled={summarizingNoticeId === item._id}
              style={{
                padding: '10px 16px',
                backgroundColor: '#818cf8',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#818cf8'}
            >
              <span>🤖</span>
              {summarizingNoticeId === item._id ? 'Generating Summary...' : 'AI Summarize Notice'}
            </button>
          </div>
        )}
        
        {/* Display AI-generated poster if available */}
        {item.poster && (
          <div className="poster-preview" style={{ marginTop: '15px' }}>
            <img 
              src={item.poster} 
              alt="AI-generated poster" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '200px',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }} 
            />
            <p style={{ marginTop: '10px', fontSize: '14px', color: 'var(--muted)' }}>
              AI-generated poster
            </p>
          </div>
        )}
        
        {currentView === 'notices' && item.file && typeof item.file === 'string' && (
          <div style={{ marginTop: '15px' }}>
            <a 
              href={item.file} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'inline-block',
                padding: '8px 12px',
                backgroundColor: 'rgba(34, 211, 238, 0.12)',
                color: '#a5f3fc',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
                border: '1px solid rgba(34, 211, 238, 0.25)'
              }}
            >
              Download Attachment
            </a>
          </div>
        )}
        
        {/* Display registration button for events with registration forms */}
        {currentView === 'events' && 'hasRegistrationForm' in item && item.hasRegistrationForm && (
          <div style={{ marginTop: '15px' }}>
            <button 
              onClick={() => openRegistrationForm(item)}
              style={{ 
                padding: '10px 16px',
                backgroundColor: 'rgba(34, 211, 238, 0.12)',
                color: '#a5f3fc',
                borderRadius: '6px',
                border: '1px solid rgba(34, 211, 238, 0.25)',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Register for Event
            </button>
          </div>
        )}
      </div>
    ));
  };

  // Use the central logout provided by App

  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => window.innerWidth > 768);
  const [transientHover, setTransientHover] = useState<boolean>(false);
  const [manualOpen, setManualOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className={`student-portal${sidebarOpen ? '' : ' sidebar-closed'}`}>
      {/* Left-edge hover zone to reveal sidebar when closed */}
      <div
        className="edge-hover"
        onMouseEnter={() => {
          if (!sidebarOpen) {
            setSidebarOpen(true);
            setTransientHover(true);
            setManualOpen(false);
          }
        }}
      />

      <div
        className="sidebar"
        onMouseLeave={() => {
          if (transientHover && !manualOpen) {
            setSidebarOpen(false);
            setTransientHover(false);
          } else if (transientHover && manualOpen) {
            // clear transient flag but keep sidebar open because user manually opened it
            setTransientHover(false);
          }
        }}
      >
        <h2>Smart Campus Hub</h2>
        <div style={{ padding: '0 16px 16px 16px', fontSize: '14px', color: 'var(--muted)' }}>
          <div>Welcome, {user.name}</div>
          <div>Department: {user.department}</div>
          <div>Semester: {user.semester}</div>
        </div>
        <button 
          className={currentView === 'dashboard' ? 'active' : ''}
          onClick={() => { setCurrentView('dashboard'); navigate('/student/dashboard'); setSidebarOpen(true); }}
        >
          Dashboard
        </button>
        <button 
          className={currentView === 'notices' ? 'active' : ''}
          onClick={() => { setCurrentView('notices'); navigate('/student'); setSidebarOpen(false); }}
        >
          Notices
        </button>
        <button 
          className={currentView === 'events' ? 'active' : ''}
          onClick={() => { setCurrentView('events'); navigate('/student'); setSidebarOpen(false); }}
        >
          Events
        </button>
        <button 
          className="logout-btn"
          onClick={() => { logout(); navigate('/'); }}
          style={{ marginTop: 'auto', backgroundColor: '#dc3545' }}
        >
          Logout
        </button>
      </div>
      
      <div className="main">
        <div className="mobile-header">
          <button
            className="hamburger"
            onClick={() => {
              setSidebarOpen(v => !v);
              setManualOpen(m => !m);
              setTransientHover(false);
            }}
            aria-label="Toggle sidebar"
          >☰</button>
        </div>

        {/* Small fixed edge button for touch devices when sidebar is closed */}
        {!sidebarOpen && (
          <button
            className="edge-button"
            onClick={() => {
              setSidebarOpen(true);
              setManualOpen(true);
            }}
            aria-label="Open sidebar"
          >☰</button>
        )}

        {/* Backdrop overlay on small screens: always rendered so we can animate fade in/out via CSS.
            Clicking closes the sidebar but handler is guarded so clicks when hidden do nothing. */}
        <div
          className={`sidebar-backdrop ${sidebarOpen && isMobile ? 'visible' : ''}`}
          aria-hidden={!(sidebarOpen && isMobile)}
          onClick={() => {
            if (!(sidebarOpen && isMobile)) return;
            // close sidebar when backdrop is clicked
            setSidebarOpen(false);
            setManualOpen(false);
            setTransientHover(false);
          }}
        />
        {location.pathname === '/student' || location.pathname === '/student/' ? (
          <StudentPortalHome
            currentView={currentView}
            setCurrentView={setCurrentView}
            language={language}
            handleLanguageChange={handleLanguageChange}
            translating={translating}
            notificationEnabled={notificationEnabled}
            checkingNotification={checkingNotification}
            enableNotifications={enableNotifications}
            testNotification={testNotification}
            renderItems={renderItems}
            notices={translatedNotices}
          />
        ) : (
          <Outlet />
        )}
      </div>
      
      {showRegistrationForm && selectedEvent && (
        <StudentRegistrationForm
          event={selectedEvent}
          user={user} // Pass user prop for auto-filled information
          onClose={() => {
            setShowRegistrationForm(false);
            setSelectedEvent(null);
          }}
          onSubmit={handleRegistrationSubmit}
          loading={false}
        />
      )}
      
      {registrationSuccess && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Registration Successful!</h3>
            <p>You have successfully registered for "{selectedEvent?.title}".</p>
            <button 
              onClick={() => {
                setRegistrationSuccess(false);
                setShowRegistrationForm(false);
                setSelectedEvent(null);
              }}
              className="save-btn"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPortal;